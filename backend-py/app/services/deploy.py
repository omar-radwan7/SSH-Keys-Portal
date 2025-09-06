from typing import List, Tuple, Dict, Optional
import hashlib
import os
import paramiko
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models import UserHostAccount, SSHKey, Deployment, ManagedHost
from datetime import datetime

def render_authorized_keys_for_account(
    db: Session, 
    user_host_account: UserHostAccount,
    global_options: Optional[str] = None
) -> Tuple[str, str, int]:
    """
    Render authorized_keys content for a specific user-host account.
    Returns (content, checksum, key_count)
    """
    # Get all active keys for this user
    active_keys = db.query(SSHKey).filter(
        SSHKey.user_id == user_host_account.user_id,
        SSHKey.status == 'active'
    ).all()
    
    content_lines = []
    for key in active_keys:
        # Build the line with options
        line_parts = []
        
        # Add per-key options first
        if key.authorized_keys_options:
            line_parts.append(key.authorized_keys_options.strip())
        
        # Add global options if specified
        if global_options:
            line_parts.append(global_options.strip())
        
        # Add the public key
        line_parts.append(key.public_key.strip())
        
        # Join with spaces and add to content
        content_lines.append(' '.join(line_parts))
    
    content = '\n'.join(content_lines) + '\n' if content_lines else ''
    checksum = hashlib.sha256(content.encode()).hexdigest()
    
    return content, checksum, len(active_keys)

def apply_to_host_account(
    db: Session,
    user_host_account: UserHostAccount,
    authorized_keys_content: str,
    checksum: str,
    key_count: int
) -> Tuple[bool, Optional[str]]:
    """
    Apply authorized_keys content to a specific user-host account.
    Returns (success, error_message)
    """
    host = user_host_account.host
    ssh_user = settings.APPLY_SSH_USER
    key_path = os.path.expanduser(settings.APPLY_SSH_KEY_PATH)

    try:
        client = paramiko.SSHClient()
        if settings.APPLY_STRICT_HOST_KEY_CHECK:
            client.load_system_host_keys()
        else:
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        client.connect(
            host.hostname, 
            username=ssh_user, 
            key_filename=key_path, 
            timeout=10
        )

        # Create deployment record
        deployment = Deployment(
            host_id=host.id,
            user_host_account_id=user_host_account.id,
            generation=int(datetime.utcnow().timestamp()),
            status='running',
            checksum=checksum,
            key_count=key_count,
            started_at=datetime.utcnow()
        )
        db.add(deployment)
        db.commit()
        db.refresh(deployment)

        # Setup remote paths
        remote_dir = f"/home/{user_host_account.remote_username}/.ssh"
        remote_file = f"{remote_dir}/authorized_keys"
        
        # Ensure SSH directory exists with correct permissions
        sftp = client.open_sftp()
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            sftp.mkdir(remote_dir)
            client.exec_command(
                f"chown {user_host_account.remote_username}:{user_host_account.remote_username} {remote_dir} && chmod 700 {remote_dir}"
            )

        # Write to temp file and move atomically
        tmp_path = f"{remote_file}.tmp.{deployment.generation}"
        with sftp.file(tmp_path, 'w') as f:
            f.write(authorized_keys_content)
        
        # Set correct ownership and permissions, then move atomically
        client.exec_command(
            f"chown {user_host_account.remote_username}:{user_host_account.remote_username} {tmp_path} && "
            f"chmod 600 {tmp_path} && "
            f"mv {tmp_path} {remote_file}"
        )

        # Update deployment status
        deployment.status = 'success'
        deployment.finished_at = datetime.utcnow()
        db.commit()

        sftp.close()
        client.close()
        
        # Update last_applied_at for all keys
        for key in db.query(SSHKey).filter(
            SSHKey.user_id == user_host_account.user_id,
            SSHKey.status == 'active'
        ).all():
            key.last_applied_at = datetime.utcnow()
        db.commit()
        
        return True, None

    except Exception as e:
        # Update deployment with error
        try:
            deployment.status = 'failed'
            deployment.error = str(e)
            deployment.finished_at = datetime.utcnow()
            db.commit()
        except:
            pass
        
        try:
            client.close()
        except:
            pass
        
        return False, str(e)

def queue_apply_for_user(db: Session, user_id: str, priority: int = 0) -> int:
    """
    Queue apply operations for all host accounts of a user.
    Returns number of operations queued.
    """
    from ..models import ApplyQueue
    
    # Get all active user-host accounts for this user
    accounts = db.query(UserHostAccount).filter(
        UserHostAccount.user_id == user_id,
        UserHostAccount.status == 'active'
    ).all()
    
    queued_count = 0
    for account in accounts:
        # Check if already queued
        existing = db.query(ApplyQueue).filter(
            ApplyQueue.user_host_account_id == account.id,
            ApplyQueue.status.in_(['queued', 'running'])
        ).first()
        
        if not existing:
            queue_item = ApplyQueue(
                user_host_account_id=account.id,
                priority=priority,
                status='queued'
            )
            db.add(queue_item)
            queued_count += 1
    
    db.commit()
    return queued_count

def queue_apply_for_all_users(db: Session, priority: int = 0) -> int:
    """
    Queue apply operations for all user-host accounts.
    Returns number of operations queued.
    """
    from ..models import ApplyQueue
    
    # Get all active user-host accounts
    accounts = db.query(UserHostAccount).filter(
        UserHostAccount.status == 'active'
    ).all()
    
    queued_count = 0
    for account in accounts:
        # Check if already queued
        existing = db.query(ApplyQueue).filter(
            ApplyQueue.user_host_account_id == account.id,
            ApplyQueue.status.in_(['queued', 'running'])
        ).first()
        
        if not existing:
            queue_item = ApplyQueue(
                user_host_account_id=account.id,
                priority=priority,
                status='queued'
            )
            db.add(queue_item)
            queued_count += 1
    
    db.commit()
    return queued_count

# Legacy function for backward compatibility
def render_authorized_keys(public_keys: List[str], options: str | None = None) -> Tuple[str, str]:
    """Legacy function - use render_authorized_keys_for_account instead"""
    content_lines = []
    for key in public_keys:
        line = f"{options} {key}" if options else key
        content_lines.append(line)
    content = "\n".join(content_lines) + "\n"
    checksum = hashlib.sha256(content.encode()).hexdigest()
    return content, checksum

# Legacy function for backward compatibility  
def apply_to_host(hostname: str, username: str, authorized_keys_content: str) -> Tuple[bool, str | None]:
    """Legacy function - use apply_to_host_account instead"""
    ssh_user = settings.APPLY_SSH_USER
    key_path = os.path.expanduser(settings.APPLY_SSH_KEY_PATH)

    try:
        client = paramiko.SSHClient()
        if settings.APPLY_STRICT_HOST_KEY_CHECK:
            client.load_system_host_keys()
        else:
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, username=ssh_user, key_filename=key_path, timeout=10)

        sftp = client.open_sftp()
        remote_dir = f"/home/{username}/.ssh"
        remote_file = f"{remote_dir}/authorized_keys"
        
        # Ensure directory exists
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            sftp.mkdir(remote_dir)
            client.exec_command(f"chown {username}:{username} {remote_dir} && chmod 700 {remote_dir}")

        # Write to temp and move atomically
        tmp_path = f"{remote_file}.tmp"
        with sftp.file(tmp_path, 'w') as f:
            f.write(authorized_keys_content)
        client.exec_command(f"chown {username}:{username} {tmp_path} && chmod 600 {tmp_path} && mv {tmp_path} {remote_file}")

        sftp.close()
        client.close()
        return True, None
    except Exception as e:
        try:
            client.close()
        except Exception:
            pass
        return False, str(e) 