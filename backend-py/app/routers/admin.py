from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.deps import get_db
from ..models import User, ManagedHost, Policy, AuditEvent, SSHKey, Deployment, UserHostAccount, ApplyQueue
from ..schemas import ManagedHostCreate, ManagedHostOut, PolicyIn, PolicyOut, AuditEventOut, ApiResponse, UserHostAccountCreate, UserHostAccountOut
from .keys import get_current_user_from_auth
from ..services.deploy import render_authorized_keys, apply_to_host
from ..services.policy import PolicyService
from ..services.audit import log_audit
from ..services.security import SecurityService
from datetime import datetime, timedelta
import csv
import json
import io
from ..utils.auth import validate_username, validate_password_strength, hash_password
from sqlalchemy import func

router = APIRouter()

@router.post("/hosts", response_model=ApiResponse)
async def create_host(payload: ManagedHostCreate, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	# Prevent duplicate hostname (unique constraint)
	exists = db.query(ManagedHost).filter(ManagedHost.hostname == payload.hostname).first()
	if exists:
		# Make this operation idempotent: return the existing host as success
		return ApiResponse(success=True, data={"host": ManagedHostOut.model_validate(exists).model_dump()}, message="Host already existed; returning existing record")
	host = ManagedHost(hostname=payload.hostname, address=payload.address, os_family=payload.os_family)
	db.add(host); db.commit(); db.refresh(host)
	return ApiResponse(success=True, data={"host": ManagedHostOut.model_validate(host).model_dump()})

@router.get("/hosts", response_model=ApiResponse)
async def list_hosts(request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	hosts = db.query(ManagedHost).all()
	return ApiResponse(success=True, data={"hosts": [ManagedHostOut.model_validate(h).model_dump() for h in hosts]})

@router.post("/user-host-accounts", response_model=ApiResponse)
async def create_user_host_account(payload: UserHostAccountCreate, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	# Verify user and host exist
	target_user = db.query(User).filter(User.id == payload.user_id).first()
	if not target_user:
		raise HTTPException(status_code=404, detail="User not found")
	
	host = db.query(ManagedHost).filter(ManagedHost.id == payload.host_id).first()
	if not host:
		raise HTTPException(status_code=404, detail="Host not found")
	
	# Check for existing mapping
	existing = db.query(UserHostAccount).filter(
		UserHostAccount.user_id == payload.user_id,
		UserHostAccount.host_id == payload.host_id
	).first()
	if existing:
		raise HTTPException(status_code=409, detail="User-host account mapping already exists")
	
	account = UserHostAccount(
		user_id=payload.user_id,
		host_id=payload.host_id,
		remote_username=payload.remote_username,
		status=payload.status or 'active'
	)
	db.add(account)
	db.commit()
	db.refresh(account)
	
	log_audit(
		db, actor_user_id=user.id, action="user_host_account_created",
		entity="user_host_account", entity_id=account.id,
		metadata={"user_id": payload.user_id, "host_id": payload.host_id, "remote_username": payload.remote_username},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(success=True, data={"account": UserHostAccountOut.model_validate(account).model_dump()})

@router.get("/user-host-accounts", response_model=ApiResponse)
async def list_user_host_accounts(request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	accounts = db.query(UserHostAccount).all()
	return ApiResponse(success=True, data={"accounts": [UserHostAccountOut.model_validate(a).model_dump() for a in accounts]})

@router.post("/policies", response_model=ApiResponse)
async def set_policy(payload: PolicyIn, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	policy = Policy(rules_json=payload.rules_json, is_active=payload.is_active)
	db.add(policy); db.commit(); db.refresh(policy)
	return ApiResponse(success=True, data={"policy": PolicyOut.model_validate(policy).model_dump()})

@router.get("/policies", response_model=ApiResponse)
async def list_policies(request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	policies = db.query(Policy).order_by(Policy.created_at.desc()).all()
	return ApiResponse(success=True, data={"policies": [PolicyOut.model_validate(p).model_dump() for p in policies]})

@router.get("/policies/current", response_model=ApiResponse)
async def get_current_policy(request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	policy_rules = PolicyService.get_current_policy(db)
	return ApiResponse(success=True, data=policy_rules.to_dict())

@router.put("/policies/ssh", response_model=ApiResponse)
async def update_ssh_policy(policy_data: dict, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	try:
		# Set the new policy
		policy = PolicyService.set_policy(db, policy_data, user.id, "SSH Key Policy")
		
		# Log the policy change
		log_audit(
			db, actor_user_id=user.id, action="policy_updated",
			entity="policy", entity_id=policy.id,
			metadata={"policy_rules": policy_data},
			source_ip=request.client.host if request.client else "0.0.0.0",
			user_agent=request.headers.get("user-agent", "")
		)
		
		return ApiResponse(success=True, message="Policy updated successfully")
	except Exception as e:
		raise HTTPException(status_code=400, detail=f"Invalid policy configuration: {str(e)}")

@router.get("/audits", response_model=ApiResponse)
async def search_audit_events(
	request: Request, 
	db: Session = Depends(get_db),
	start_date: Optional[str] = Query(None),
	end_date: Optional[str] = Query(None),
	action: Optional[str] = Query(None),
	entity: Optional[str] = Query(None),
	actor_user_id: Optional[str] = Query(None),
	limit: int = Query(200, le=1000),
	offset: int = Query(0, ge=0)
):
	user = get_current_user_from_auth(request, db)
	if user.role not in ('admin', 'auditor'):
		raise HTTPException(status_code=403, detail="Admin or auditor access required")
	
	query = db.query(AuditEvent)
	
	# Apply filters
	if start_date:
		try:
			start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
			query = query.filter(AuditEvent.ts >= start_dt)
		except ValueError:
			raise HTTPException(status_code=400, detail="Invalid start_date format")
	
	if end_date:
		try:
			end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
			query = query.filter(AuditEvent.ts <= end_dt)
		except ValueError:
			raise HTTPException(status_code=400, detail="Invalid end_date format")
	
	if action:
		query = query.filter(AuditEvent.action.ilike(f"%{action}%"))
	
	if entity:
		query = query.filter(AuditEvent.entity.ilike(f"%{entity}%"))
		
	if actor_user_id:
		query = query.filter(AuditEvent.actor_user_id == actor_user_id)
	
	# Get total count for pagination
	total = query.count()
	
	# Apply pagination and ordering
	rows = query.order_by(AuditEvent.ts.desc()).offset(offset).limit(limit).all()
	
	return ApiResponse(
		success=True, 
		data={
			"events": [AuditEventOut.model_validate(a).model_dump() for a in rows],
			"total": total,
			"offset": offset,
			"limit": limit
		}
	)

@router.get("/audit/export")
async def export_audit_events(
	request: Request,
	db: Session = Depends(get_db),
	format: str = Query("csv", regex="^(csv|json)$"),
	start_date: Optional[str] = Query(None),
	end_date: Optional[str] = Query(None)
):
	user = get_current_user_from_auth(request, db)
	if user.role not in ('admin', 'auditor'):
		raise HTTPException(status_code=403, detail="Admin or auditor access required")
	
	query = db.query(AuditEvent)
	
	# Apply date filters
	if start_date:
		try:
			start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
			query = query.filter(AuditEvent.ts >= start_dt)
		except ValueError:
			raise HTTPException(status_code=400, detail="Invalid start_date format")
	
	if end_date:
		try:
			end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
			query = query.filter(AuditEvent.ts <= end_dt)
		except ValueError:
			raise HTTPException(status_code=400, detail="Invalid end_date format")
	
	events = query.order_by(AuditEvent.ts.desc()).limit(10000).all()  # Reasonable limit
	
	if format == "csv":
		output = io.StringIO()
		writer = csv.writer(output)
		writer.writerow(['timestamp', 'actor_user_id', 'action', 'entity', 'entity_id', 'source_ip', 'user_agent', 'metadata'])
		
		for event in events:
			writer.writerow([
				event.ts.isoformat(),
				event.actor_user_id,
				event.action,
				event.entity,
				event.entity_id,
				event.source_ip,
				event.user_agent,
				event.metadata_json
			])
		
		content = output.getvalue()
		output.close()
		
		from fastapi.responses import Response
		return Response(
			content=content,
			media_type="text/csv",
			headers={"Content-Disposition": f"attachment; filename=audit_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
		)
	
	else:  # JSON format
		data = [AuditEventOut.model_validate(event).model_dump() for event in events]
		
		from fastapi.responses import JSONResponse
		return JSONResponse(
			content={"events": data, "exported_at": datetime.utcnow().isoformat(), "total": len(data)},
			headers={"Content-Disposition": f"attachment; filename=audit_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
		)

@router.post("/apply", response_model=ApiResponse)
async def queue_apply_all(request: Request, db: Session = Depends(get_db)):
	"""Queue apply operations for all user-host accounts"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	from ..services.deploy import queue_apply_for_all_users
	
	queued_count = queue_apply_for_all_users(db, priority=1)  # High priority for admin-triggered applies
	
	log_audit(
		db, actor_user_id=user.id, action="apply_queued_all",
		entity="apply_queue", entity_id=None,
		metadata={"queued_operations": queued_count},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(
		success=True, 
		data={"queued_operations": queued_count},
		message=f"Queued {queued_count} apply operations for processing"
	)

@router.post("/apply/user/{user_id}", response_model=ApiResponse)
async def queue_apply_for_user(user_id: str, request: Request, db: Session = Depends(get_db)):
	"""Queue apply operations for a specific user's accounts"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	# Verify target user exists
	target_user = db.query(User).filter(User.id == user_id).first()
	if not target_user:
		raise HTTPException(status_code=404, detail="User not found")
	
	from ..services.deploy import queue_apply_for_user as queue_for_user
	
	queued_count = queue_for_user(db, user_id, priority=1)
	
	log_audit(
		db, actor_user_id=user.id, action="apply_queued_user",
		entity="apply_queue", entity_id=user_id,
		metadata={"target_user_id": user_id, "queued_operations": queued_count},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(
		success=True, 
		data={"queued_operations": queued_count, "user_id": user_id},
		message=f"Queued {queued_count} apply operations for user {target_user.username}"
	)

# Legacy endpoint for backward compatibility
@router.post("/apply-legacy", response_model=ApiResponse)
async def apply_authorized_keys_legacy(username: str, request: Request, db: Session = Depends(get_db)):
	"""Legacy apply endpoint - applies all active keys to all hosts with same username"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	# collect active keys
	keys = db.query(SSHKey).filter(SSHKey.status == 'active').all()
	pubs = [k.public_key for k in keys]
	content, checksum = render_authorized_keys(pubs)
	
	# simulate/apply to all hosts
	hosts = db.query(ManagedHost).all()
	results = []
	for h in hosts:
		success, error = apply_to_host(h.hostname, username, content)
		dep = Deployment(
			host_id=h.id, 
			user_host_account_id=None,  # Legacy - no specific account mapping
			generation=int(datetime.utcnow().timestamp()), 
			status='success' if success else 'failed', 
			checksum=checksum, 
			key_count=len(pubs),
			finished_at=datetime.utcnow(), 
			error=error
		)
		db.add(dep)
		results.append({"host": h.hostname, "success": success, "error": error})
	db.commit()
	return ApiResponse(success=True, data={"applied": results, "checksum": checksum})

@router.post("/revoke/fingerprint", response_model=ApiResponse)
async def emergency_revoke_by_fingerprint(
	fingerprint: str, 
	request: Request, 
	db: Session = Depends(get_db)
):
	"""Emergency revoke all keys with matching fingerprint across all users"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	# Find all keys with this fingerprint
	keys = db.query(SSHKey).filter(
		SSHKey.fingerprint_sha256 == fingerprint,
		SSHKey.status.in_(['active', 'deprecated'])
	).all()
	
	if not keys:
		raise HTTPException(status_code=404, detail="No keys found with this fingerprint")
	
	revoked_count = 0
	affected_users = set()
	
	for key in keys:
		key.status = 'revoked'
		affected_users.add(key.user_id)
		revoked_count += 1
	
	db.commit()
	
	# Log emergency revoke
	log_audit(
		db, actor_user_id=user.id, action="emergency_revoke_by_fingerprint",
		entity="ssh_key", entity_id=fingerprint,
		metadata={
			"fingerprint": fingerprint,
			"revoked_count": revoked_count,
			"affected_users": list(affected_users)
		},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	# TODO: Queue apply operations for all affected user-host accounts
	
	return ApiResponse(
		success=True,
		data={
			"fingerprint": fingerprint,
			"revoked_count": revoked_count,
			"affected_users": len(affected_users)
		},
		message=f"Emergency revoked {revoked_count} keys with fingerprint {fingerprint[:16]}..."
	)

@router.get("/metrics", response_model=ApiResponse)
async def get_admin_metrics(request: Request, db: Session = Depends(get_db)):
	"""Get admin dashboard metrics"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	# Aggregate counts safely
	host_count = db.query(ManagedHost).count()
	user_count = db.query(User).count()
	# Key metrics guarded if table exists
	try:
		key_totals = db.query(func.count(SSHKey.id)).scalar() or 0
		key_active = db.query(func.count(SSHKey.id)).filter(SSHKey.status == 'active').scalar() or 0
	except Exception:
		key_totals = 0
		key_active = 0
	return ApiResponse(success=True, data={
		"total_hosts": host_count,
		"total_users": user_count,
		"total_keys": key_totals,
		"active_keys": key_active
	})

@router.get("/deployments", response_model=ApiResponse)
async def list_deployments(
	request: Request, 
	db: Session = Depends(get_db),
	status: Optional[str] = Query(None),
	host_id: Optional[str] = Query(None),
	limit: int = Query(100, le=500)
):
	"""List recent deployments with optional filters"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	query = db.query(Deployment)
	
	if status:
		query = query.filter(Deployment.status == status)
	
	if host_id:
		query = query.filter(Deployment.host_id == host_id)
	
	deployments = query.order_by(Deployment.started_at.desc()).limit(limit).all()
	
	# Convert to dict format with host info
	deployment_data = []
	for dep in deployments:
		dep_dict = {
			"id": dep.id,
			"host_id": dep.host_id,
			"hostname": dep.host.hostname if dep.host else "Unknown",
			"user_host_account_id": dep.user_host_account_id,
			"remote_username": dep.user_host_account.remote_username if dep.user_host_account else "Unknown",
			"generation": dep.generation,
			"status": dep.status,
			"checksum": dep.checksum,
			"key_count": dep.key_count,
			"started_at": dep.started_at.isoformat() if dep.started_at else None,
			"finished_at": dep.finished_at.isoformat() if dep.finished_at else None,
			"error": dep.error,
			"retry_count": dep.retry_count
		}
		deployment_data.append(dep_dict)
	
	return ApiResponse(success=True, data={"deployments": deployment_data})

@router.get("/users", response_model=ApiResponse)
async def list_users(request: Request, db: Session = Depends(get_db)):
	"""List all users for admin management"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	users = db.query(User).order_by(User.created_at.desc()).all()
	
	user_data = []
	for u in users:
		# Calculate usage-based status
		calculated_status = calculate_user_status(u)
		# Update status if it has changed
		if u.status != calculated_status and calculated_status in ['active', 'inactive']:
			u.status = calculated_status
			db.commit()
		
		user_dict = {
			"id": u.id,
			"username": u.username,
			"display_name": u.display_name,
			"email": u.email,
			"role": u.role,
			"status": u.status,
			"last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
			"days_since_login": (datetime.utcnow() - u.last_login_at).days if u.last_login_at else None,
			"created_at": u.created_at.isoformat(),
			"key_count": len([k for k in u.ssh_keys if k.status == 'active'])
		}
		user_data.append(user_dict)
	
	return ApiResponse(success=True, data={"users": user_data})

@router.put("/users/{user_id}/role", response_model=ApiResponse)
async def update_user_role(user_id: str, payload: dict, request: Request, db: Session = Depends(get_db)):
	current_user = get_current_user_from_auth(request, db)
	if current_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	# Disallow role changes per product decision
	raise HTTPException(status_code=403, detail="Changing user roles is disabled")

@router.put("/users/{user_id}/status", response_model=ApiResponse)
async def update_user_status(
	user_id: str, 
	status_data: dict, 
	request: Request, 
	db: Session = Depends(get_db)
):
	"""Update a user's status (active/disabled)"""
	admin_user = get_current_user_from_auth(request, db)
	if admin_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	target_user = db.query(User).filter(User.id == user_id).first()
	if not target_user:
		raise HTTPException(status_code=404, detail="User not found")
	
	# Prevent admins from modifying other admins
	if target_user.role == 'admin' and target_user.id != admin_user.id:
		raise HTTPException(status_code=403, detail="Cannot modify other admin accounts")
	
	new_status = status_data.get('status')
	if new_status not in ['active', 'inactive', 'new']:
		raise HTTPException(status_code=400, detail="Invalid status")
	
	old_status = target_user.status
	target_user.status = new_status
	db.commit()
	
	log_audit(
		db, actor_user_id=admin_user.id, action="user_status_updated",
		entity="user", entity_id=target_user.id,
		metadata={
			"old_status": old_status,
			"new_status": new_status,
			"target_username": target_user.username
		},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(
		success=True, 
		message=f"Updated {target_user.username} status from {old_status} to {new_status}"
	)

@router.put("/users/{user_id}/username", response_model=ApiResponse)
async def admin_update_username(
	user_id: str,
	payload: dict,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Admin updates a user's username"""
	admin_user = get_current_user_from_auth(request, db)
	if admin_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")

	new_username = (payload.get('new_username') or '').strip()
	if not new_username:
		raise HTTPException(status_code=400, detail="new_username is required")

	valid, errors = validate_username(new_username)
	if not valid:
		raise HTTPException(status_code=400, detail=f"Invalid username: {'; '.join(errors)}")

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")

	# Prevent admins from modifying other admins
	if user.role == 'admin' and user.id != admin_user.id:
		raise HTTPException(status_code=403, detail="Cannot modify other admin accounts")

	existing = db.query(User).filter(User.username == new_username).first()
	if existing and existing.id != user.id:
		raise HTTPException(status_code=400, detail="Username already exists")

	old_username = user.username
	user.username = new_username
	db.commit()

	log_audit(
		db, actor_user_id=admin_user.id, action="admin_updated_username",
		entity="user", entity_id=user.id,
		metadata={"old_username": old_username, "new_username": new_username, "target_user_id": user.id},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)

	return ApiResponse(success=True, message=f"Username updated to {new_username}")

@router.put("/users/{user_id}/password", response_model=ApiResponse)
async def admin_reset_password(
	user_id: str,
	payload: dict,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Admin resets a user's password (local accounts only)"""
	admin_user = get_current_user_from_auth(request, db)
	if admin_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")

	new_password = payload.get('new_password') or ''
	if not new_password:
		raise HTTPException(status_code=400, detail="new_password is required")

	valid, errors = validate_password_strength(new_password)
	if not valid:
		raise HTTPException(status_code=400, detail=f"Password requirements not met: {'; '.join(errors)}")

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")
	if not user.is_local_account:
		raise HTTPException(status_code=400, detail="Cannot reset password for non-local accounts")

	# Prevent admins from modifying other admins
	if user.role == 'admin' and user.id != admin_user.id:
		raise HTTPException(status_code=403, detail="Cannot modify other admin accounts")

	user.password_hash = hash_password(new_password)
	db.commit()

	log_audit(
		db, actor_user_id=admin_user.id, action="admin_reset_password",
		entity="user", entity_id=user.id,
		metadata={"target_username": user.username, "target_user_id": user.id},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)

	return ApiResponse(success=True, message="Password reset successfully")

def calculate_user_status(user):
	"""Calculate real-time-like status:
	- active: last_activity_at within 10 minutes
	- new: never logged in
	- inactive: otherwise
	"""
	from datetime import datetime, timedelta
	if user.last_activity_at:
		if datetime.utcnow() - user.last_activity_at <= timedelta(minutes=10):
			return 'active'
	# Never logged in
	if not user.last_login_at:
		return 'new'
	# Logged in before but not recently active
	return 'inactive'

@router.get("/security/alerts", response_model=ApiResponse)
async def get_security_alerts(
	request: Request,
	acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment status"),
	db: Session = Depends(get_db)
):
	"""Get security alerts for admin monitoring"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	alerts = SecurityService.get_security_alerts(db, acknowledged)
	
	return ApiResponse(
		success=True,
		data={
			"alerts": [
				{
					"id": alert.id,
					"alert_type": alert.alert_type,
					"severity": alert.severity,
					"description": alert.description,
					"metadata": json.loads(alert.alert_metadata) if alert.alert_metadata else {},
					"acknowledged": alert.acknowledged,
					"acknowledged_by": alert.acknowledged_by,
					"acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
					"created_at": alert.created_at.isoformat()
				}
				for alert in alerts
			]
		}
	)

@router.post("/security/alerts/{alert_id}/acknowledge", response_model=ApiResponse)
async def acknowledge_security_alert(
	alert_id: str,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Acknowledge a security alert"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	SecurityService.acknowledge_alert(db, alert_id, user.id)
	
	log_audit(
		db, actor_user_id=user.id, action="security_alert_acknowledged",
		entity="security_alert", entity_id=alert_id,
		metadata={"alert_id": alert_id},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(success=True, message="Security alert acknowledged")

@router.post("/security/detect-activity", response_model=ApiResponse)
async def detect_unusual_activity(
	request: Request,
	db: Session = Depends(get_db)
):
	"""Manually trigger unusual activity detection"""
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	
	alerts = SecurityService.detect_unusual_activity(db)
	
	log_audit(
		db, actor_user_id=user.id, action="security_scan_triggered",
		entity="system", entity_id="security",
		metadata={"alerts_found": len(alerts)},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	
	return ApiResponse(
		success=True,
		data={
			"alerts_detected": len(alerts),
			"alerts": alerts
		},
		message=f"Security scan completed. {len(alerts)} new alerts detected."
	)

@router.post("/create-admin", response_model=ApiResponse)
async def create_admin_account(
	admin_data: dict,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Create a new admin account - only accessible by existing admins"""
	# Get current user and verify admin role
	current_user = get_current_user_from_auth(request, db)
	if current_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Only admins can create admin accounts")
	
	source_ip = request.client.host if request.client else "0.0.0.0"
	
	try:
		# Import password utilities
		from ..utils.auth import hash_password, validate_password_strength, validate_username
		
		# Extract data
		username = admin_data.get('username', '').strip()
		password = admin_data.get('password', '')
		email = admin_data.get('email', '').strip() or None
		display_name = admin_data.get('display_name', '').strip()
		
		if not all([username, password, display_name]):
			raise HTTPException(status_code=400, detail="Username, password, and display name are required")
		
		# Validate username format
		username_valid, username_errors = validate_username(username)
		if not username_valid:
			raise HTTPException(status_code=400, detail=f"Invalid username: {'; '.join(username_errors)}")
		
		# Validate password strength
		password_valid, password_errors = validate_password_strength(password)
		if not password_valid:
			raise HTTPException(status_code=400, detail=f"Password requirements not met: {'; '.join(password_errors)}")
		
		# Check if username already exists
		existing_user = db.query(User).filter(User.username == username).first()
		if existing_user:
			raise HTTPException(status_code=400, detail="Username already exists")
		
		# Check if email already exists (if provided)
		if email:
			existing_email = db.query(User).filter(User.email == email).first()
			if existing_email:
				raise HTTPException(status_code=400, detail="Email address already registered")
		
		# Hash the password
		password_hash = hash_password(password)
		
		# Create new admin user
		new_admin = User(
			username=username,
			email=email,
			display_name=display_name,
			password_hash=password_hash,
			role='admin',  # Create as admin
			status='new',  # New admin starts as 'new' until first login
			is_local_account=True,
			external_id=None
		)
		
		db.add(new_admin)
		db.commit()
		db.refresh(new_admin)
		
		# Log the admin creation
		log_audit(
			db, actor_user_id=current_user.id, action="admin_account_created",
			entity="user", entity_id=new_admin.id,
			metadata={
				"created_username": new_admin.username,
				"created_by": current_user.username,
				"account_type": "admin"
			},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		
		return ApiResponse(
			success=True,
			message=f"Admin account '{username}' created successfully",
			data={
				"user": {
					"id": new_admin.id,
					"username": new_admin.username,
					"display_name": new_admin.display_name,
					"role": new_admin.role,
					"created_at": new_admin.created_at.isoformat()
				}
			}
		)
		
	except HTTPException:
		raise
	except Exception as e:
		log_audit(
			db, actor_user_id=current_user.id, action="admin_creation_failed",
			entity="user", entity_id=current_user.id,
			metadata={"error": str(e), "attempted_username": admin_data.get('username', 'unknown')},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		raise HTTPException(status_code=500, detail="Failed to create admin account")

@router.post("/create-user", response_model=ApiResponse)
async def create_user_account(
	user_data: dict,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Create a new user account - only accessible by admins"""
	# Get current user and verify admin role
	current_user = get_current_user_from_auth(request, db)
	if current_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Only admins can create user accounts")
	
	source_ip = request.client.host if request.client else "0.0.0.0"
	
	try:
		# Import password utilities
		from ..utils.auth import hash_password, validate_password_strength, validate_username
		
		# Extract data
		username = user_data.get('username', '').strip()
		password = user_data.get('password', '')
		email = user_data.get('email', '').strip() or None
		display_name = user_data.get('display_name', '').strip()
		
		if not all([username, password, display_name]):
			raise HTTPException(status_code=400, detail="Username, password, and display name are required")
		
		# Validate username format
		username_valid, username_errors = validate_username(username)
		if not username_valid:
			raise HTTPException(status_code=400, detail=f"Invalid username: {'; '.join(username_errors)}")
		
		# Validate password strength
		password_valid, password_errors = validate_password_strength(password)
		if not password_valid:
			raise HTTPException(status_code=400, detail=f"Password requirements not met: {'; '.join(password_errors)}")
		
		# Check if username already exists
		existing_user = db.query(User).filter(User.username == username).first()
		if existing_user:
			raise HTTPException(status_code=400, detail="Username already exists")
		
		# Check if email already exists (if provided)
		if email:
			existing_email = db.query(User).filter(User.email == email).first()
			if existing_email:
				raise HTTPException(status_code=400, detail="Email address already registered")
		
		# Hash the password
		password_hash = hash_password(password)
		
		# Create new user
		new_user = User(
			username=username,
			email=email,
			display_name=display_name,
			password_hash=password_hash,
			role='user',  # Create as user
			status='new',  # New user starts as 'new' until first login
			is_local_account=True,
			external_id=None
		)
		
		db.add(new_user)
		db.commit()
		db.refresh(new_user)
		
		# Log the user creation
		log_audit(
			db, actor_user_id=current_user.id, action="user_account_created",
			entity="user", entity_id=new_user.id,
			metadata={
				"created_username": new_user.username,
				"created_by": current_user.username,
				"account_type": "user"
			},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		
		return ApiResponse(
			success=True,
			message=f"User account '{username}' created successfully",
			data={
				"user": {
					"id": new_user.id,
					"username": new_user.username,
					"display_name": new_user.display_name,
					"role": new_user.role,
					"created_at": new_user.created_at.isoformat()
				}
			}
		)
		
	except HTTPException:
		raise
	except Exception as e:
		log_audit(
			db, actor_user_id=current_user.id, action="user_creation_failed",
			entity="user", entity_id=current_user.id,
			metadata={"error": str(e), "attempted_username": user_data.get('username', 'unknown')},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		raise HTTPException(status_code=500, detail="Failed to create user account") 

@router.delete("/users/{user_id}", response_model=ApiResponse)
async def delete_user(user_id: str, request: Request, db: Session = Depends(get_db)):
	current_user = get_current_user_from_auth(request, db)
	if current_user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	# Prevent deleting admins (including self or others)
	target = db.query(User).filter(User.id == user_id).first()
	if not target:
		raise HTTPException(status_code=404, detail="User not found")
	if target.role == 'admin':
		raise HTTPException(status_code=403, detail="Cannot delete admin accounts")
	# Delete related mappings (FKs) first if any
	for acc in db.query(UserHostAccount).filter(UserHostAccount.user_id == user_id).all():
		db.delete(acc)
	# Finally delete user
	db.delete(target)
	db.commit()
	# Audit
	log_audit(
		db, actor_user_id=current_user.id, action="user_deleted",
		entity="user", entity_id=user_id,
		metadata={"deleted_username": target.username},
		source_ip=request.client.host if request.client else "0.0.0.0",
		user_agent=request.headers.get("user-agent", "")
	)
	return ApiResponse(success=True, message="User deleted successfully") 