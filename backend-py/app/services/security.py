"""
Security service for rate limiting, lockout mechanisms, and security monitoring
Implements SRS security requirements for the SSH Key Portal
"""

from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, func
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
from ..models import Base
from ..core.config import settings

class RateLimitRecord(Base):
    """Track rate limiting per user and operation type"""
    __tablename__ = "rate_limits"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    operation_type = Column(String(50), nullable=False)  # 'import', 'generate', 'apply', 'revoke'
    count = Column(Integer, default=1)
    window_start = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class SecurityLockout(Base):
    """Track security lockouts for suspicious activity"""
    __tablename__ = "security_lockouts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    lockout_type = Column(String(50), nullable=False)  # 'failed_pickup', 'rate_limit', 'suspicious'
    locked_until = Column(DateTime(timezone=True), nullable=False)
    reason = Column(Text)
    attempt_count = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class SecurityAlert(Base):
    """Track security alerts for unusual activity"""
    __tablename__ = "security_alerts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    alert_type = Column(String(50), nullable=False)  # 'spike_apply', 'spike_revoke', 'mass_failure'
    severity = Column(String(20), nullable=False)  # 'low', 'medium', 'high', 'critical'
    description = Column(Text, nullable=False)
    alert_metadata = Column(Text)  # JSON
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(36))
    acknowledged_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class SecurityService:
    """Security service for rate limiting and monitoring"""
    
    # Rate limits per operation type (per hour)
    RATE_LIMITS = {
        'import': 10,      # Max 10 key imports per hour
        'generate': 5,     # Max 5 key generations per hour
        'apply': 20,       # Max 20 apply operations per hour
        'revoke': 10,      # Max 10 revocations per hour
        'download': 3,     # Max 3 private key downloads per hour
    }
    
    # Lockout durations (in minutes)
    LOCKOUT_DURATIONS = {
        'rate_limit': 60,      # 1 hour for rate limit violations
        'failed_pickup': 30,   # 30 minutes for failed pickups
        'suspicious': 240,     # 4 hours for suspicious activity
    }
    
    @staticmethod
    def check_rate_limit(db: Session, user_id: str, operation_type: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user has exceeded rate limits for operation type
        Returns (is_allowed, error_message)
        """
        if operation_type not in SecurityService.RATE_LIMITS:
            return True, None
        
        limit = SecurityService.RATE_LIMITS[operation_type]
        window_start = datetime.utcnow() - timedelta(hours=1)
        
        # Count operations in the last hour
        count = db.query(func.sum(RateLimitRecord.count)).filter(
            RateLimitRecord.user_id == user_id,
            RateLimitRecord.operation_type == operation_type,
            RateLimitRecord.window_start >= window_start
        ).scalar() or 0
        
        if count >= limit:
            # Create lockout record
            SecurityService._create_lockout(db, user_id, 'rate_limit', 
                f"Rate limit exceeded for {operation_type}: {count}/{limit}")
            return False, f"Rate limit exceeded. Max {limit} {operation_type} operations per hour."
        
        return True, None
    
    @staticmethod
    def record_operation(db: Session, user_id: str, operation_type: str):
        """Record an operation for rate limiting tracking"""
        window_start = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        
        # Try to find existing record for this hour
        existing = db.query(RateLimitRecord).filter(
            RateLimitRecord.user_id == user_id,
            RateLimitRecord.operation_type == operation_type,
            RateLimitRecord.window_start == window_start
        ).first()
        
        if existing:
            existing.count += 1
        else:
            record = RateLimitRecord(
                user_id=user_id,
                operation_type=operation_type,
                window_start=window_start
            )
            db.add(record)
        
        db.commit()
    
    @staticmethod
    def check_lockout(db: Session, user_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user is currently locked out
        Returns (is_locked, reason)
        """
        active_lockout = db.query(SecurityLockout).filter(
            SecurityLockout.user_id == user_id,
            SecurityLockout.is_active == True,
            SecurityLockout.locked_until > datetime.utcnow()
        ).first()
        
        if active_lockout:
            time_left = active_lockout.locked_until - datetime.utcnow()
            minutes_left = int(time_left.total_seconds() / 60)
            return True, f"Account temporarily locked ({active_lockout.lockout_type}). Try again in {minutes_left} minutes."
        
        return False, None
    
    @staticmethod
    def _create_lockout(db: Session, user_id: str, lockout_type: str, reason: str):
        """Create a security lockout record"""
        duration_minutes = SecurityService.LOCKOUT_DURATIONS.get(lockout_type, 60)
        locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        
        # Check for existing active lockout
        existing = db.query(SecurityLockout).filter(
            SecurityLockout.user_id == user_id,
            SecurityLockout.lockout_type == lockout_type,
            SecurityLockout.is_active == True
        ).first()
        
        if existing:
            # Extend lockout and increment attempt count
            existing.locked_until = locked_until
            existing.attempt_count += 1
            existing.reason = reason
        else:
            lockout = SecurityLockout(
                user_id=user_id,
                lockout_type=lockout_type,
                locked_until=locked_until,
                reason=reason
            )
            db.add(lockout)
        
        db.commit()
    
    @staticmethod
    def record_failed_pickup(db: Session, user_id: str, request_id: str):
        """Record a failed private key pickup attempt"""
        # Check how many failed attempts in the last hour
        window_start = datetime.utcnow() - timedelta(hours=1)
        failed_attempts = db.query(SecurityLockout).filter(
            SecurityLockout.user_id == user_id,
            SecurityLockout.lockout_type == 'failed_pickup',
            SecurityLockout.created_at >= window_start
        ).count()
        
        if failed_attempts >= 3:  # 3 failed attempts in an hour
            SecurityService._create_lockout(db, user_id, 'failed_pickup', 
                f"Multiple failed pickup attempts: {failed_attempts + 1}")
    
    @staticmethod
    def detect_unusual_activity(db: Session) -> List[Dict]:
        """Detect and alert on unusual activity spikes"""
        alerts = []
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        # Check for apply operation spikes
        recent_applies = db.query(func.count()).filter(
            RateLimitRecord.operation_type == 'apply',
            RateLimitRecord.created_at >= hour_ago
        ).scalar() or 0
        
        baseline_applies = db.query(func.count()).filter(
            RateLimitRecord.operation_type == 'apply',
            RateLimitRecord.created_at >= day_ago,
            RateLimitRecord.created_at < hour_ago
        ).scalar() or 0
        
        # Alert if recent activity is 3x baseline
        if recent_applies > 0 and baseline_applies > 0:
            spike_ratio = recent_applies / (baseline_applies / 23)  # Daily average per hour
            if spike_ratio > 3:
                alerts.append({
                    'type': 'spike_apply',
                    'severity': 'medium',
                    'description': f'Unusual spike in apply operations: {recent_applies} in last hour (baseline: {baseline_applies/23:.1f}/hour)',
                    'metadata': {'recent': recent_applies, 'baseline': baseline_applies}
                })
        
        # Check for revoke operation spikes
        recent_revokes = db.query(func.count()).filter(
            RateLimitRecord.operation_type == 'revoke',
            RateLimitRecord.created_at >= hour_ago
        ).scalar() or 0
        
        if recent_revokes > 10:  # More than 10 revokes in an hour
            alerts.append({
                'type': 'spike_revoke',
                'severity': 'high',
                'description': f'High number of revoke operations: {recent_revokes} in last hour',
                'metadata': {'count': recent_revokes}
            })
        
        # Store alerts in database
        for alert_data in alerts:
            existing_alert = db.query(SecurityAlert).filter(
                SecurityAlert.alert_type == alert_data['type'],
                SecurityAlert.created_at >= hour_ago,
                SecurityAlert.acknowledged == False
            ).first()
            
            if not existing_alert:
                alert = SecurityAlert(
                    alert_type=alert_data['type'],
                    severity=alert_data['severity'],
                    description=alert_data['description'],
                    metadata=json.dumps(alert_data.get('metadata', {}))
                )
                db.add(alert)
        
        db.commit()
        return alerts
    
    @staticmethod
    def get_security_alerts(db: Session, acknowledged: Optional[bool] = None) -> List[SecurityAlert]:
        """Get security alerts, optionally filtered by acknowledgment status"""
        query = db.query(SecurityAlert)
        if acknowledged is not None:
            query = query.filter(SecurityAlert.acknowledged == acknowledged)
        return query.order_by(SecurityAlert.created_at.desc()).all()
    
    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str, user_id: str):
        """Acknowledge a security alert"""
        alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
        if alert:
            alert.acknowledged = True
            alert.acknowledged_by = user_id
            alert.acknowledged_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def cleanup_old_records(db: Session):
        """Clean up old rate limit and lockout records"""
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        
        # Clean up old rate limit records
        db.query(RateLimitRecord).filter(
            RateLimitRecord.created_at < cutoff_date
        ).delete()
        
        # Clean up old inactive lockouts
        db.query(SecurityLockout).filter(
            SecurityLockout.locked_until < datetime.utcnow(),
            SecurityLockout.is_active == True
        ).update({'is_active': False})
        
        # Clean up very old lockout records
        db.query(SecurityLockout).filter(
            SecurityLockout.created_at < cutoff_date
        ).delete()
        
        db.commit() 