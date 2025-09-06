from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from ..core.deps import get_db
from ..models import SystemGenRequest
from ..utils.ssh import decrypt_private_key
from ..services.audit import log_audit
from ..services.security import SecurityService
from ..core.config import settings
from datetime import datetime

router = APIRouter()

def get_client_ip(request: Request) -> str:
	forwarded = request.headers.get("x-forwarded-for")
	if forwarded:
		return forwarded.split(",")[0]
	return request.client.host if request.client else "0.0.0.0"

@router.get("/requests/{request_id}/download")
async def download_private_key(
	request_id: str,
	token: str,
	request: Request,
	db: Session = Depends(get_db)
):
	source_ip = get_client_ip(request)
	
	# Get the generation request
	gen_request = db.query(SystemGenRequest).filter(
		SystemGenRequest.id == request_id,
		SystemGenRequest.download_token == token,
		SystemGenRequest.expires_at > datetime.utcnow()
	).first()
	
	if not gen_request:
		# Record failed pickup attempt if we have user context
		# Note: We can't easily get user_id from token alone, but we could enhance this
		raise HTTPException(
			status_code=404,
			detail="Download link not found or expired"
		)
	
	# Check for security lockout
	is_locked, lockout_reason = SecurityService.check_lockout(db, gen_request.user_id)
	if is_locked:
		raise HTTPException(status_code=429, detail=lockout_reason)
	
	# Check rate limiting for downloads
	is_allowed, rate_limit_error = SecurityService.check_rate_limit(db, gen_request.user_id, 'download')
	if not is_allowed:
		raise HTTPException(status_code=429, detail=rate_limit_error)
	
	# Check if already downloaded
	if gen_request.downloaded_at:
		raise HTTPException(
			status_code=410,
			detail="Download link has already been used"
		)
	
	# Decrypt private key
	try:
		private_key = decrypt_private_key(gen_request.encrypted_private_key, settings.SYSGEN_ENCRYPTION_KEY)
	except Exception:
		raise HTTPException(
			status_code=500,
			detail="Failed to decrypt private key"
		)
	
	# Mark as downloaded
	gen_request.downloaded_at = datetime.utcnow()
	db.commit()
	
	# Record operation for rate limiting
	SecurityService.record_operation(db, gen_request.user_id, 'download')
	
	# Log download event
	log_audit(
		db, actor_user_id=gen_request.user_id, action="private_key_downloaded",
		entity="system_gen_request", entity_id=request_id,
		metadata={
			"algorithm": gen_request.algorithm,
			"bit_length": gen_request.bit_length
		},
		source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
	)
	
	# Set headers for file download
	filename = f"id_{gen_request.algorithm.replace('-', '_')}_{gen_request.bit_length}"
	
	return Response(
		content=private_key,
		media_type="application/x-pem-file",
		headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
	) 