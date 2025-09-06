import asyncio
import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..core.db import SessionLocal
from ..models import ApplyQueue, UserHostAccount, Deployment
from .deploy import render_authorized_keys_for_account, apply_to_host_account
from .audit import log_audit
from .security import SecurityService
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)

class ApplyWorker:
    def __init__(self, max_retries: int = 3, retry_delay: int = 60):
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.running = False
    
    async def start(self):
        """Start the worker loop"""
        self.running = True
        logger.info("Apply worker started")
        
        while self.running:
            try:
                await self.process_queue()
                await asyncio.sleep(5)  # Check queue every 5 seconds
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    def stop(self):
        """Stop the worker"""
        self.running = False
        logger.info("Apply worker stopped")
    
    async def process_queue(self):
        """Process items from the apply queue"""
        db = SessionLocal()
        try:
            # Get next queued item (priority order, then FIFO)
            queue_item = db.query(ApplyQueue).filter(
                ApplyQueue.status == 'queued',
                ApplyQueue.scheduled_at <= datetime.utcnow()
            ).order_by(
                ApplyQueue.priority.desc(),
                ApplyQueue.created_at.asc()
            ).first()
            
            if not queue_item:
                return  # Nothing to process
            
            # Mark as running
            queue_item.status = 'running'
            queue_item.started_at = datetime.utcnow()
            db.commit()
            
            try:
                await self.process_apply_item(db, queue_item)
                
                # Mark as completed
                queue_item.status = 'completed'
                queue_item.finished_at = datetime.utcnow()
                db.commit()
                
                logger.info(f"Successfully processed apply queue item {queue_item.id}")
                
            except Exception as e:
                logger.error(f"Failed to process apply queue item {queue_item.id}: {e}")
                
                # Handle retry logic
                queue_item.retry_count += 1
                queue_item.error = str(e)
                
                if queue_item.retry_count >= self.max_retries:
                    queue_item.status = 'failed'
                    queue_item.finished_at = datetime.utcnow()
                else:
                    # Schedule retry
                    queue_item.status = 'queued'
                    queue_item.scheduled_at = datetime.utcnow() + timedelta(seconds=self.retry_delay * queue_item.retry_count)
                    queue_item.started_at = None
                
                db.commit()
                
        finally:
            db.close()
    
    async def process_apply_item(self, db: Session, queue_item: ApplyQueue):
        """Process a single apply queue item"""
        # Get the user-host account
        account = db.query(UserHostAccount).filter(
            UserHostAccount.id == queue_item.user_host_account_id
        ).first()
        
        if not account:
            raise Exception(f"UserHostAccount {queue_item.user_host_account_id} not found")
        
        if account.status != 'active':
            raise Exception(f"UserHostAccount {queue_item.user_host_account_id} is not active")
        
        # Render authorized_keys content for this account
        content, checksum, key_count = render_authorized_keys_for_account(db, account)
        
        # Apply to the host
        success, error = apply_to_host_account(db, account, content, checksum, key_count)
        
        if not success:
            raise Exception(f"Apply failed: {error}")
        
        logger.info(f"Applied {key_count} keys to {account.host.hostname} for user {account.user.username}")

class NotificationWorker:
    def __init__(self):
        self.running = False
    
    async def start(self):
        """Start the notification worker loop"""
        self.running = True
        logger.info("Notification worker started")
        
        while self.running:
            try:
                await self.process_notifications()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Notification worker error: {e}")
                await asyncio.sleep(60)
    
    def stop(self):
        """Stop the notification worker"""
        self.running = False
        logger.info("Notification worker stopped")
    
    async def process_notifications(self):
        """Process queued notifications"""
        db = SessionLocal()
        try:
            from ..models import NotificationQueue
            
            # Get queued notifications
            notifications = db.query(NotificationQueue).filter(
                NotificationQueue.status == 'queued',
                NotificationQueue.scheduled_at <= datetime.utcnow()
            ).order_by(NotificationQueue.created_at.asc()).limit(10).all()
            
            for notification in notifications:
                try:
                    await self.send_notification(db, notification)
                    notification.status = 'sent'
                    notification.sent_at = datetime.utcnow()
                    logger.info(f"Sent notification {notification.id}: {notification.subject}")
                except Exception as e:
                    notification.status = 'failed'
                    notification.error = str(e)
                    logger.error(f"Failed to send notification {notification.id}: {e}")
            
            db.commit()
            
        finally:
            db.close()
    
    async def send_notification(self, db: Session, notification):
        """Send a notification (placeholder - implement email/webhook logic)"""
        # TODO: Implement actual notification sending
        # For now, just log the notification
        logger.info(f"NOTIFICATION: {notification.subject} - {notification.message}")
        
        # In a real implementation, you would:
        # - Send email via SMTP
        # - Send webhook to external service
        # - Send Slack/Teams message
        # - etc.

class MaintenanceWorker:
    def __init__(self):
        self.running = False
    
    async def start(self):
        """Start the maintenance worker loop"""
        self.running = True
        logger.info("Maintenance worker started")
        
        while self.running:
            try:
                await self.run_maintenance_tasks()
                await asyncio.sleep(3600)  # Run every hour
            except Exception as e:
                logger.error(f"Maintenance worker error: {e}")
                await asyncio.sleep(3600)
    
    def stop(self):
        """Stop the maintenance worker"""
        self.running = False
        logger.info("Maintenance worker stopped")
    
    async def run_maintenance_tasks(self):
        """Run periodic maintenance tasks"""
        db = SessionLocal()
        try:
            from ..services.policy import PolicyService
            from ..models import NotificationQueue
            
            # 1. Expire old keys
            expired_count = PolicyService.expire_old_keys(db)
            if expired_count > 0:
                logger.info(f"Expired {expired_count} old keys")
            
            # 2. Queue expiry reminder notifications
            keys_needing_reminders = PolicyService.get_keys_needing_expiry_reminders(db)
            for key in keys_needing_reminders:
                # Check if we already sent a reminder recently
                recent_notification = db.query(NotificationQueue).filter(
                    NotificationQueue.user_id == key.user_id,
                    NotificationQueue.notification_type == 'expiry_reminder',
                    NotificationQueue.created_at >= datetime.utcnow() - timedelta(days=1)
                ).first()
                
                if not recent_notification:
                    # Queue expiry reminder
                    expires_in_days = (key.expires_at - datetime.utcnow()).days
                    notification = NotificationQueue(
                        user_id=key.user_id,
                        notification_type='expiry_reminder',
                        subject=f"SSH Key Expiring in {expires_in_days} days",
                        message=f"Your SSH key ({key.algorithm} {key.fingerprint_sha256[:16]}...) will expire on {key.expires_at.strftime('%Y-%m-%d')}. Please rotate or renew it before then.",
                        status='queued'
                    )
                    db.add(notification)
            
            # 3. Clean up old completed queue items (older than 7 days)
            old_queue_items = db.query(ApplyQueue).filter(
                ApplyQueue.status.in_(['completed', 'failed']),
                ApplyQueue.finished_at < datetime.utcnow() - timedelta(days=7)
            ).all()
            
            for item in old_queue_items:
                db.delete(item)
            
            if old_queue_items:
                logger.info(f"Cleaned up {len(old_queue_items)} old queue items")
            
            # 4. Clean up old system gen requests (older than 1 day)
            from ..models import SystemGenRequest
            old_gen_requests = db.query(SystemGenRequest).filter(
                SystemGenRequest.expires_at < datetime.utcnow() - timedelta(days=1)
            ).all()
            
            for request in old_gen_requests:
                db.delete(request)
            
            if old_gen_requests:
                logger.info(f"Cleaned up {len(old_gen_requests)} old system generation requests")
            
            # 5. Security monitoring - detect unusual activity
            try:
                alerts = SecurityService.detect_unusual_activity(db)
                if alerts:
                    logger.info(f"Security scan detected {len(alerts)} new alerts")
                    
                    # Queue notifications for critical alerts
                    from ..models import NotificationQueue
                    for alert in alerts:
                        if alert.get('severity') in ['high', 'critical']:
                            notification = NotificationQueue(
                                user_id=None,  # System notification
                                notification_type='security_alert',
                                subject=f"Security Alert: {alert['type']}",
                                message=alert['description'],
                                status='queued',
                                metadata={'alert_type': alert['type'], 'severity': alert['severity']}
                            )
                            db.add(notification)
            except Exception as e:
                logger.error(f"Security monitoring failed: {e}")
            
            # 6. Clean up old security records
            try:
                SecurityService.cleanup_old_records(db)
            except Exception as e:
                logger.error(f"Security cleanup failed: {e}")
            
            db.commit()
            
        finally:
            db.close()

# Global worker instances
apply_worker = ApplyWorker()
notification_worker = NotificationWorker()
maintenance_worker = MaintenanceWorker()

async def start_all_workers():
    """Start all background workers"""
    tasks = [
        asyncio.create_task(apply_worker.start()),
        asyncio.create_task(notification_worker.start()),
        asyncio.create_task(maintenance_worker.start())
    ]
    
    try:
        await asyncio.gather(*tasks)
    except Exception as e:
        logger.error(f"Worker error: {e}")
        # Stop all workers on error
        apply_worker.stop()
        notification_worker.stop()
        maintenance_worker.stop()

def stop_all_workers():
    """Stop all background workers"""
    apply_worker.stop()
    notification_worker.stop()
    maintenance_worker.stop() 