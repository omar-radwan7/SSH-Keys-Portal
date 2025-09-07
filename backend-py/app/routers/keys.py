from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..core.deps import get_db, get_current_user
from ..models import User, SSHKey, SystemGenRequest
from ..schemas import KeyPreviewRequest, KeyPreviewResponse, ImportKeyRequest, SSHKeyOut, GenerateKeyRequest, GenerateKeyResponse, ApiResponse
from ..utils.ssh import validate_public_key, parse_metadata, fingerprint_sha256, generate_system_keypair, encrypt_private_key
from ..services.audit import log_audit
from ..services.policy import PolicyService
from ..services.deploy import queue_apply_for_user
from ..services.security import SecurityService
from datetime import datetime, timedelta
import secrets
from ..core.config import settings

router = APIRouter()

def get_current_user_from_auth(request: Request, db: Session = Depends(get_db)) -> User:
	auth_header = request.headers.get("authorization")
	if not auth_header or not auth_header.startswith("Bearer "):
		raise HTTPException(status_code=401, detail="No valid token provided")
	
	token = auth_header[7:]  # Remove "Bearer "
	return get_current_user(token, db)

def get_client_ip(request: Request) -> str:
	forwarded = request.headers.get("x-forwarded-for")
	if forwarded:
		return forwarded.split(",")[0]
	return request.client.host if request.client else "0.0.0.0"

@router.get("", response_model=ApiResponse)
@router.get("/", response_model=ApiResponse)
async def get_my_keys(
	request: Request,
	db: Session = Depends(get_db)
):
	user = get_current_user_from_auth(request, db)
	keys = db.query(SSHKey).filter(SSHKey.user_id == user.id).all()
	
	return ApiResponse(
		success=True,
		data={
			"keys": [{
				"id": key.id,
				"user_id": key.user_id,
				"public_key": key.public_key,
				"algorithm": key.algorithm,
				"bit_length": key.bit_length,
				"comment": key.comment,
				"fingerprint_sha256": key.fingerprint_sha256,
				"origin": key.origin,
				"expires_at": key.expires_at.isoformat() if key.expires_at else None,
				"status": key.status,
				"authorized_keys_options": key.authorized_keys_options,
				"created_at": key.created_at.isoformat()
			} for key in keys]
		}
	)

@router.post("/preview", response_model=ApiResponse)
async def preview_key(
	preview_data: KeyPreviewRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	user = get_current_user_from_auth(request, db)
	
	if not validate_public_key(preview_data.publicKey):
		raise HTTPException(status_code=400, detail="Invalid SSH public key format")
	
	algorithm, bit_length = parse_metadata(preview_data.publicKey)
	fingerprint = fingerprint_sha256(preview_data.publicKey)
	
	# Get policy for comment normalization and validation
	policy_errors = PolicyService.validate_key_against_policy(
		db, algorithm, bit_length, 
		getattr(preview_data, 'comment', None),
		getattr(preview_data, 'authorizedKeysOptions', None),
		user.id
	)
	
	# Normalize comment if provided
	normalized_comment = None
	if hasattr(preview_data, 'comment') and preview_data.comment:
		# Basic comment normalization: strip whitespace, limit length
		normalized_comment = preview_data.comment.strip()[:255]
	
	return ApiResponse(
		success=True,
		data={
			"algorithm": algorithm,
			"bitLength": bit_length,
			"fingerprint": fingerprint,
			"normalizedComment": normalized_comment,
			"policyValidation": {
				"isValid": len(policy_errors) == 0,
				"errors": policy_errors
			}
		}
	)

@router.post("/", response_model=ApiResponse)
async def import_key(
	import_data: ImportKeyRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	user = get_current_user_from_auth(request, db)
	source_ip = get_client_ip(request)
	
	# Check for security lockout
	is_locked, lockout_reason = SecurityService.check_lockout(db, user.id)
	if is_locked:
		raise HTTPException(status_code=429, detail=lockout_reason)
	
	# Check rate limiting
	is_allowed, rate_limit_error = SecurityService.check_rate_limit(db, user.id, 'import')
	if not is_allowed:
		raise HTTPException(status_code=429, detail=rate_limit_error)
	
	# Validate key format
	if not validate_public_key(import_data.publicKey):
		raise HTTPException(status_code=400, detail="Invalid SSH public key format")
	
	# Parse key metadata
	algorithm, bit_length = parse_metadata(import_data.publicKey)
	fingerprint = fingerprint_sha256(import_data.publicKey)
	
	# Check for duplicate fingerprint
	existing = db.query(SSHKey).filter(SSHKey.fingerprint_sha256 == fingerprint).first()
	if existing:
		raise HTTPException(status_code=400, detail="SSH key with this fingerprint already exists")
	
	# Validate against policy
	policy_errors = PolicyService.validate_key_against_policy(
		db, algorithm, bit_length, import_data.comment, 
		import_data.authorizedKeysOptions, user.id
	)
	if policy_errors:
		raise HTTPException(status_code=400, detail="; ".join(policy_errors))
	
	# Set default expiry from policy
	expires_at = import_data.expiresAt or PolicyService.get_default_expiry(db)
	
	# Create SSH key record
	ssh_key = SSHKey(
		user_id=user.id,
		public_key=import_data.publicKey,
		algorithm=algorithm,
		bit_length=bit_length,
		comment=import_data.comment or "",
		fingerprint_sha256=fingerprint,
		origin='import',
		expires_at=expires_at,
		authorized_keys_options=import_data.authorizedKeysOptions
	)
	
	db.add(ssh_key)
	db.commit()
	db.refresh(ssh_key)
	
	# Log audit event
	log_audit(
		db, actor_user_id=user.id, action="ssh_key_imported",
		entity="ssh_key", entity_id=ssh_key.id,
		metadata={
			"algorithm": algorithm,
			"bit_length": bit_length,
			"fingerprint": fingerprint,
			"comment": import_data.comment
		},
		source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
	)
	
	# Queue apply operations for this user
	queue_apply_for_user(db, user.id)
	
	# Record operation for rate limiting
	SecurityService.record_operation(db, user.id, 'import')
	
	return ApiResponse(
		success=True,
		data={
			"id": ssh_key.id,
			"user_id": ssh_key.user_id,
			"public_key": ssh_key.public_key,
			"algorithm": ssh_key.algorithm,
			"bit_length": ssh_key.bit_length,
			"comment": ssh_key.comment,
			"fingerprint_sha256": ssh_key.fingerprint_sha256,
			"origin": ssh_key.origin,
			"expires_at": ssh_key.expires_at.isoformat() if ssh_key.expires_at else None,
			"status": ssh_key.status,
			"authorized_keys_options": ssh_key.authorized_keys_options,
			"created_at": ssh_key.created_at.isoformat()
		},
		message="SSH key imported successfully"
	)

@router.post("/generate", response_model=ApiResponse)
async def generate_key(
	generate_data: GenerateKeyRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	user = get_current_user_from_auth(request, db)
	source_ip = get_client_ip(request)
	
	# Check for security lockout
	is_locked, lockout_reason = SecurityService.check_lockout(db, user.id)
	if is_locked:
		raise HTTPException(status_code=429, detail=lockout_reason)
	
	# Check rate limiting
	is_allowed, rate_limit_error = SecurityService.check_rate_limit(db, user.id, 'generate')
	if not is_allowed:
		raise HTTPException(status_code=429, detail=rate_limit_error)
	
	# Generate key pair
	public_key, private_key = generate_system_keypair(generate_data.algorithm, generate_data.bitLength)
	
	# Compute metadata and fingerprint
	algorithm, bit_length = parse_metadata(public_key)
	fingerprint = fingerprint_sha256(public_key)
	
	# Prevent duplicate keys
	existing = db.query(SSHKey).filter(SSHKey.fingerprint_sha256 == fingerprint).first()
	if existing:
		raise HTTPException(status_code=400, detail="SSH key with this fingerprint already exists")
	
	# Validate against policy
	policy_errors = PolicyService.validate_key_against_policy(
		db, algorithm, bit_length, user_id=user.id
	)
	if policy_errors:
		raise HTTPException(status_code=400, detail="; ".join(policy_errors))
	
	# Create SSH key record for user
	ssh_key = SSHKey(
		user_id=user.id,
		public_key=public_key,
		algorithm=algorithm,
		bit_length=bit_length,
		comment=f"generated@{datetime.utcnow().isoformat()}",
		fingerprint_sha256=fingerprint,
		origin='system_gen',
		expires_at=PolicyService.get_default_expiry(db),
	)
	db.add(ssh_key)
	db.commit()
	db.refresh(ssh_key)

	# Prepare one-time private key download
	encrypted_private_key = encrypt_private_key(private_key, settings.SYSGEN_ENCRYPTION_KEY)
	download_token = secrets.token_urlsafe(32)
	expires_at = datetime.utcnow() + timedelta(minutes=settings.SYSGEN_DOWNLOAD_TTL_MIN)

	gen_request = SystemGenRequest(
		user_id=user.id,
		algorithm=algorithm,
		bit_length=bit_length,
		encrypted_private_key=encrypted_private_key,
		download_token=download_token,
		expires_at=expires_at
	)
	db.add(gen_request)
	db.commit()
	db.refresh(gen_request)

	# Log audit event
	log_audit(
		db, actor_user_id=user.id, action="ssh_key_generation_requested",
		entity="system_gen_request", entity_id=gen_request.id,
		metadata={
			"algorithm": algorithm,
			"bit_length": bit_length,
			"expires_at": expires_at.isoformat()
		},
		source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
	)
	
	# Queue apply operations for this user
	queue_apply_for_user(db, user.id)
	
	# Record operation for rate limiting
	SecurityService.record_operation(db, user.id, 'generate')

	return ApiResponse(
		success=True,
		data={
			"requestId": gen_request.id,
			"downloadUrl": f"/api/v1/keys/requests/{gen_request.id}/download?token={download_token}",
			"expiresIn": str(settings.SYSGEN_DOWNLOAD_TTL_MIN)
		},
		message="SSH key generated successfully. Download link expires in 10 minutes."
	)

@router.delete("/{key_id}", response_model=ApiResponse)
async def revoke_key(
	key_id: str,
	request: Request,
	db: Session = Depends(get_db)
):
	user = get_current_user_from_auth(request, db)
	source_ip = get_client_ip(request)
	
	# Find the key
	ssh_key = db.query(SSHKey).filter(
		SSHKey.id == key_id,
		SSHKey.user_id == user.id
	).first()
	
	if not ssh_key:
		raise HTTPException(status_code=404, detail="SSH key not found or access denied")
	
	# Update status to revoked
	ssh_key.status = 'revoked'
	db.commit()
	
	# Log audit event
	log_audit(
		db, actor_user_id=user.id, action="ssh_key_revoked",
		entity="ssh_key", entity_id=key_id,
		metadata={
			"fingerprint": ssh_key.fingerprint_sha256,
			"algorithm": ssh_key.algorithm
		},
		source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
	)
	
	# Queue apply operations for this user
	queue_apply_for_user(db, user.id)
	
	return ApiResponse(success=True, message="SSH key revoked successfully")

@router.post("/{key_id}/rotate", response_model=ApiResponse)
async def rotate_key(
	key_id: str,
	import_data: ImportKeyRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Rotate an existing key by replacing it with a new one"""
	user = get_current_user_from_auth(request, db)
	source_ip = get_client_ip(request)
	
	# Find the existing key
	old_key = db.query(SSHKey).filter(
		SSHKey.id == key_id,
		SSHKey.user_id == user.id,
		SSHKey.status == 'active'
	).first()
	
	if not old_key:
		raise HTTPException(status_code=404, detail="Active SSH key not found or access denied")
	
	# Validate new key format
	if not validate_public_key(import_data.publicKey):
		raise HTTPException(status_code=400, detail="Invalid SSH public key format")
	
	# Parse new key metadata
	algorithm, bit_length = parse_metadata(import_data.publicKey)
	fingerprint = fingerprint_sha256(import_data.publicKey)
	
	# Check for duplicate fingerprint
	existing = db.query(SSHKey).filter(SSHKey.fingerprint_sha256 == fingerprint).first()
	if existing:
		raise HTTPException(status_code=400, detail="SSH key with this fingerprint already exists")
	
	# Validate against policy (don't count current key against max limit)
	policy_errors = PolicyService.validate_key_against_policy(
		db, algorithm, bit_length, import_data.comment, 
		import_data.authorizedKeysOptions, None  # Skip user limit check for rotation
	)
	if policy_errors:
		raise HTTPException(status_code=400, detail="; ".join(policy_errors))
	
	# Create new key
	new_key = SSHKey(
		user_id=user.id,
		public_key=import_data.publicKey,
		algorithm=algorithm,
		bit_length=bit_length,
		comment=import_data.comment or f"rotated from {old_key.comment or 'unnamed'}",
		fingerprint_sha256=fingerprint,
		origin='import',
		expires_at=import_data.expiresAt or PolicyService.get_default_expiry(db),
		authorized_keys_options=import_data.authorizedKeysOptions
	)
	
	# Mark old key as deprecated (will be revoked after successful apply)
	old_key.status = 'deprecated'
	
	db.add(new_key)
	db.commit()
	db.refresh(new_key)
	
	# Log audit events
	log_audit(
		db, actor_user_id=user.id, action="ssh_key_rotated",
		entity="ssh_key", entity_id=new_key.id,
		metadata={
			"old_key_id": old_key.id,
			"old_fingerprint": old_key.fingerprint_sha256,
			"new_fingerprint": fingerprint,
			"algorithm": algorithm
		},
		source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
	)
	
	# Queue apply operations for this user
	queue_apply_for_user(db, user.id)
	
	return ApiResponse(
		success=True,
		data={
			"new_key_id": new_key.id,
			"old_key_id": old_key.id,
			"fingerprint": fingerprint
		},
		message="SSH key rotated successfully. Old key will be revoked after deployment."
	)

@router.get("/status", response_model=ApiResponse)
async def get_key_deployment_status(
	request: Request,
	db: Session = Depends(get_db)
):
	"""Get deployment status of user's keys across hosts"""
	user = get_current_user_from_auth(request, db)
	
	from ..models import UserHostAccount, Deployment
	
	# Get user's host accounts
	accounts = db.query(UserHostAccount).filter(
		UserHostAccount.user_id == user.id,
		UserHostAccount.status == 'active'
	).all()
	
	status_data = []
	for account in accounts:
		# Get latest deployment for this account
		latest_deployment = db.query(Deployment).filter(
			Deployment.user_host_account_id == account.id
		).order_by(Deployment.started_at.desc()).first()
		
		# Enhanced status information
		deployment_health = "unknown"
		if latest_deployment:
			if latest_deployment.status == "success":
				deployment_health = "healthy"
			elif latest_deployment.status == "failed":
				deployment_health = "error"
			elif latest_deployment.status in ["pending", "running"]:
				deployment_health = "syncing"
		
		account_status = {
			"host_id": account.host_id,
			"hostname": account.host.hostname,
			"address": account.host.address,
			"remote_username": account.remote_username,
			"deployment_status": latest_deployment.status if latest_deployment else "never_deployed",
			"deployment_health": deployment_health,
			"last_applied": latest_deployment.finished_at.isoformat() if latest_deployment and latest_deployment.finished_at else None,
			"last_attempt": latest_deployment.started_at.isoformat() if latest_deployment and latest_deployment.started_at else None,
			"key_count": latest_deployment.key_count if latest_deployment else 0,
			"checksum": latest_deployment.checksum if latest_deployment else None,
			"error": latest_deployment.error if latest_deployment and latest_deployment.status == 'failed' else None,
			"retry_count": latest_deployment.retry_count if latest_deployment else 0
		}
		status_data.append(account_status)
	
	# Get user's active keys with last applied timestamp
	keys = db.query(SSHKey).filter(
		SSHKey.user_id == user.id,
		SSHKey.status == 'active'
	).all()
	
	key_status = []
	for key in keys:
		# Calculate expiry status
		expiry_status = "valid"
		days_until_expiry = None
		if key.expires_at:
			days_until_expiry = (key.expires_at - datetime.utcnow()).days
			if days_until_expiry <= 0:
				expiry_status = "expired"
			elif days_until_expiry <= 7:
				expiry_status = "expiring_soon"
			elif days_until_expiry <= 30:
				expiry_status = "expiring_this_month"
		
		key_info = {
			"id": key.id,
			"algorithm": key.algorithm,
			"bit_length": key.bit_length,
			"fingerprint_sha256": key.fingerprint_sha256[:16] + "...",
			"comment": key.comment,
			"origin": key.origin,
			"status": key.status,
			"expires_at": key.expires_at.isoformat() if key.expires_at else None,
			"expiry_status": expiry_status,
			"days_until_expiry": days_until_expiry,
			"last_applied_at": key.last_applied_at.isoformat() if key.last_applied_at else None,
			"created_at": key.created_at.isoformat(),
			"authorized_keys_options": key.authorized_keys_options
		}
		key_status.append(key_info)
	
	return ApiResponse(
		success=True,
		data={
			"host_accounts": status_data,
			"keys": key_status,
			"summary": {
				"total_hosts": len(status_data),
				"active_keys": len(key_status),
				"successful_deployments": len([s for s in status_data if s["deployment_status"] == "success"]),
				"failed_deployments": len([s for s in status_data if s["deployment_status"] == "failed"]),
				"pending_deployments": len([s for s in status_data if s["deployment_status"] in ["pending", "running"]]),
				"never_deployed": len([s for s in status_data if s["deployment_status"] == "never_deployed"]),
				"expiring_keys": len([k for k in key_status if k["expiry_status"] in ["expiring_soon", "expiring_this_month"]]),
				"expired_keys": len([k for k in key_status if k["expiry_status"] == "expired"]),
				"overall_health": "healthy" if all(s["deployment_health"] == "healthy" for s in status_data) else "degraded" if any(s["deployment_health"] == "error" for s in status_data) else "syncing" if any(s["deployment_health"] == "syncing" for s in status_data) else "unknown"
			}
		}
	) 