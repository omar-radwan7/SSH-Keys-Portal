from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from ..models import Policy, SSHKey
from datetime import datetime, timedelta
import re
import json

class PolicyRules:
    def __init__(self, rules: Dict[str, Any]):
        self.allowed_algorithms = rules.get('allowed_algorithms', ['ssh-ed25519', 'ssh-rsa'])
        self.min_key_lengths = rules.get('min_key_lengths', {'ssh-rsa': 2048, 'ssh-ed25519': 256, 'ecdsa-sha2-nistp256': 256})
        self.default_ttl_days = rules.get('default_ttl_days', 365)
        self.max_keys_per_user = rules.get('max_keys_per_user', 5)
        self.comment_regex = rules.get('comment_regex', None)
        self.allowed_options = rules.get('allowed_options', ['no-port-forwarding', 'no-agent-forwarding', 'no-X11-forwarding', 'no-pty', 'restrict', 'from'])
        self.expiry_reminder_days = rules.get('expiry_reminder_days', [30, 7, 1])

    def to_dict(self) -> Dict[str, Any]:
        return {
            'allowed_algorithms': self.allowed_algorithms,
            'min_key_lengths': self.min_key_lengths,
            'default_ttl_days': self.default_ttl_days,
            'max_keys_per_user': self.max_keys_per_user,
            'comment_regex': self.comment_regex,
            'allowed_options': self.allowed_options,
            'expiry_reminder_days': self.expiry_reminder_days
        }

class PolicyService:
    @staticmethod
    def get_current_policy(db: Session) -> PolicyRules:
        """Get the currently active policy or return default"""
        policy = db.query(Policy).filter(Policy.is_active == True).first()
        if policy:
            return PolicyRules(policy.rules)
        
        # Return default policy
        return PolicyRules({})
    
    @staticmethod
    def set_policy(db: Session, rules: Dict[str, Any], created_by: str, name: str = "SSH Key Policy") -> Policy:
        """Set a new active policy, deactivating the old one"""
        # Deactivate current policy
        current = db.query(Policy).filter(Policy.is_active == True).first()
        if current:
            current.is_active = False
        
        # Create new active policy
        policy = Policy(
            name=name,
            rules=rules,
            is_active=True,
            created_by=created_by
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy
    
    @staticmethod
    def validate_key_against_policy(
        db: Session, 
        algorithm: str, 
        bit_length: int, 
        comment: Optional[str] = None,
        authorized_keys_options: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[str]:
        """Validate a key against current policy. Returns list of errors."""
        policy = PolicyService.get_current_policy(db)
        errors = []
        
        # Check algorithm
        if algorithm not in policy.allowed_algorithms:
            errors.append(f"Algorithm '{algorithm}' not allowed. Allowed: {', '.join(policy.allowed_algorithms)}")
        
        # Check minimum key length
        min_length = policy.min_key_lengths.get(algorithm, 0)
        if bit_length < min_length:
            errors.append(f"Key length {bit_length} below minimum {min_length} for {algorithm}")
        
        # Check comment format
        if policy.comment_regex and comment:
            try:
                if not re.match(policy.comment_regex, comment):
                    errors.append(f"Comment does not match required format: {policy.comment_regex}")
            except re.error:
                pass  # Invalid regex in policy, skip validation
        
        # Check authorized_keys options
        if authorized_keys_options:
            options = [opt.strip() for opt in authorized_keys_options.split(',')]
            for option in options:
                # Extract option name (before = or :)
                option_name = option.split('=')[0].split(':')[0].strip()
                if option_name not in policy.allowed_options:
                    errors.append(f"Option '{option_name}' not allowed. Allowed: {', '.join(policy.allowed_options)}")
        
        # Check max keys per user
        if user_id:
            active_key_count = db.query(SSHKey).filter(
                SSHKey.user_id == user_id,
                SSHKey.status == 'active'
            ).count()
            if active_key_count >= policy.max_keys_per_user:
                errors.append(f"Maximum {policy.max_keys_per_user} keys per user exceeded")
        
        return errors
    
    @staticmethod
    def get_default_expiry(db: Session) -> datetime:
        """Get default expiry date based on current policy"""
        policy = PolicyService.get_current_policy(db)
        return datetime.utcnow() + timedelta(days=policy.default_ttl_days)
    
    @staticmethod
    def get_keys_needing_expiry_reminders(db: Session) -> List[SSHKey]:
        """Get keys that need expiry reminders based on policy"""
        policy = PolicyService.get_current_policy(db)
        keys_needing_reminders = []
        
        for reminder_days in policy.expiry_reminder_days:
            reminder_date = datetime.utcnow() + timedelta(days=reminder_days)
            keys = db.query(SSHKey).filter(
                SSHKey.status == 'active',
                SSHKey.expires_at.isnot(None),
                SSHKey.expires_at <= reminder_date,
                SSHKey.expires_at > datetime.utcnow()
            ).all()
            keys_needing_reminders.extend(keys)
        
        return list(set(keys_needing_reminders))  # Remove duplicates
    
    @staticmethod
    def expire_old_keys(db: Session) -> int:
        """Mark expired keys as expired. Returns count of keys expired."""
        expired_keys = db.query(SSHKey).filter(
            SSHKey.status == 'active',
            SSHKey.expires_at.isnot(None),
            SSHKey.expires_at <= datetime.utcnow()
        ).all()
        
        count = 0
        for key in expired_keys:
            key.status = 'expired'
            count += 1
        
        if count > 0:
            db.commit()
        
        return count 