from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..core.deps import get_db
from ..models import User, ManagedHost, Policy, AuditEvent, SSHKey, Deployment
from ..schemas import ManagedHostCreate, ManagedHostOut, PolicyIn, PolicyOut, AuditEventOut, ApiResponse
from .keys import get_current_user_from_auth
from ..services.deploy import render_authorized_keys, apply_to_host
from datetime import datetime

router = APIRouter()

@router.post("/hosts", response_model=ApiResponse)
async def create_host(payload: ManagedHostCreate, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
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

@router.get("/audits", response_model=ApiResponse)
async def list_audits(request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role not in ('admin', 'auditor'):
		raise HTTPException(status_code=403, detail="Admin or auditor access required")
	rows = db.query(AuditEvent).order_by(AuditEvent.ts.desc()).limit(200).all()
	return ApiResponse(success=True, data={"events": [AuditEventOut.model_validate(a).model_dump() for a in rows]})

@router.post("/apply", response_model=ApiResponse)
async def apply_authorized_keys(username: str, request: Request, db: Session = Depends(get_db)):
	user = get_current_user_from_auth(request, db)
	if user.role != 'admin':
		raise HTTPException(status_code=403, detail="Admin access required")
	# collect active keys
	keys = db.query(SSHKey).filter(SSHKey.status == 'active').all()
	pubs = [k.public_key for k in keys]
	content, checksum = render_authorized_keys(pubs)
	
	# simulate apply to all hosts
	hosts = db.query(ManagedHost).all()
	results = []
	for h in hosts:
		success, error = apply_to_host(h.hostname, username, content)
		dep = Deployment(host_id=h.id, username=username, generation=int(datetime.utcnow().timestamp()), status='success' if success else 'failed', checksum=checksum, finished_at=datetime.utcnow(), error=error)
		db.add(dep)
		results.append({"host": h.hostname, "success": success, "error": error})
	db.commit()
	return ApiResponse(success=True, data={"applied": results, "checksum": checksum}) 