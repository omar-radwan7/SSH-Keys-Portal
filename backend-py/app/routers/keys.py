from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..core.deps import get_db, get_current_user
from ..models import User, SSHKey, SystemGenRequest
from ..schemas import KeyPreviewRequest, KeyPreviewResponse, ImportKeyRequest, SSHKeyOut, GenerateKeyRequest, GenerateKeyResponse, ApiResponse
from ..utils.ssh import validate_public_key, parse_metadata, fingerprint_sha256, generate_system_keypair, encrypt_private_key
from ..services.audit import log_audit
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
		data=[{
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
	
	return ApiResponse(
		success=True,
		data={
			"algorithm": algorithm,
			"bitLength": bit_length,
			"fingerprint": fingerprint
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
	
	# Check max keys per user (default policy: 5)
	user_key_count = db.query(SSHKey).filter(
		SSHKey.user_id == user.id, 
		SSHKey.status == 'active'
	).count()
	
	if user_key_count >= 5:  # Default policy limit
		raise HTTPException(status_code=400, detail="Maximum number of keys per user exceeded")
	
	# Set default expiry (1 year from now)
	expires_at = import_data.expiresAt or (datetime.utcnow() + timedelta(days=365))
	
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
	
	# Generate key pair
	public_key, private_key = generate_system_keypair(generate_data.algorithm, generate_data.bitLength)
	
	# Compute metadata and fingerprint
	algorithm, bit_length = parse_metadata(public_key)
	fingerprint = fingerprint_sha256(public_key)
	
	# Prevent duplicate keys
	existing = db.query(SSHKey).filter(SSHKey.fingerprint_sha256 == fingerprint).first()
	if existing:
		raise HTTPException(status_code=400, detail="SSH key with this fingerprint already exists")
	
	# Create SSH key record for user
	ssh_key = SSHKey(
		user_id=user.id,
		public_key=public_key,
		algorithm=algorithm,
		bit_length=bit_length,
		comment=f"generated@{datetime.utcnow().isoformat()}",
		fingerprint_sha256=fingerprint,
		origin='system_gen',
		expires_at=datetime.utcnow() + timedelta(days=365),
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
	
	return ApiResponse(success=True, message="SSH key revoked successfully") 