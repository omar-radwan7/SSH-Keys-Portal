from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ldap3 import Server, Connection, ALL, SUBTREE
from ..core.deps import get_db, create_jwt
from ..core.config import settings
from ..models import User
from ..schemas import LoginRequest, LoginResponse, ApiResponse
from ..services.audit import log_audit
import json

router = APIRouter()

def get_client_ip(request: Request) -> str:
	forwarded = request.headers.get("x-forwarded-for")
	if forwarded:
		return forwarded.split(",")[0]
	return request.client.host if request.client else "0.0.0.0"

@router.post("/test-login", response_model=ApiResponse)
async def test_login(
	login_data: LoginRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Test endpoint that creates a demo user without LDAP - for development only"""
	if not settings.ALLOW_TEST_LOGIN:
		raise HTTPException(status_code=404, detail="Not found")
	
	source_ip = get_client_ip(request)
	user_agent = request.headers.get("user-agent", "")
	
	# Demo creds: user/demo, admin/admin, auditor/auditor
	valid = {
		("demo", "demo"): "user",
		("admin", "admin"): "admin",
		("auditor", "auditor"): "auditor",
	}
	role = valid.get((login_data.username, login_data.password))
	if not role:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Use demo/demo, admin/admin, or auditor/auditor")
	
	user = db.query(User).filter(User.username == login_data.username).first()
	if not user:
		user = User(
			external_id=login_data.username,
			username=login_data.username,
			email=f"{login_data.username}@example.com",
			display_name=f"{login_data.username.title()} User",
			role=role,
			status='active'
		)
		db.add(user)
		db.commit()
		db.refresh(user)
	
	# Generate JWT token
	token = create_jwt(user)
	
	# Log successful login
	log_audit(
		db, actor_user_id=user.id, action="test_login_success",
		entity="user", entity_id=user.id,
		metadata={"role": user.role, "test_mode": True},
		source_ip=source_ip, user_agent=user_agent
	)
	
	return ApiResponse(
		success=True,
		data={
			"token": token,
			"user": {
				"id": user.id,
				"username": user.username,
				"display_name": user.display_name,
				"role": user.role
			}
		}
	)

@router.post("/login", response_model=ApiResponse)
async def login(
	login_data: LoginRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	source_ip = get_client_ip(request)
	user_agent = request.headers.get("user-agent", "")
	
	# In development, allow demo creds directly via /login as a fallback
	if settings.ALLOW_TEST_LOGIN:
		valid = {
			("demo", "demo"): "user",
			("admin", "admin"): "admin",
			("auditor", "auditor"): "auditor",
		}
		role = valid.get((login_data.username, login_data.password))
		if role:
			user = db.query(User).filter(User.username == login_data.username).first()
			if not user:
				user = User(
					external_id=login_data.username,
					username=login_data.username,
					email=f"{login_data.username}@example.com",
					display_name=f"{login_data.username.title()} User",
					role=role,
					status='active'
				)
				db.add(user); db.commit(); db.refresh(user)
			
			token = create_jwt(user)
			log_audit(
				db, actor_user_id=user.id, action="login_success",
				entity="user", entity_id=user.id,
				metadata={"role": user.role, "demo_fallback": True},
				source_ip=source_ip, user_agent=user_agent
			)
			return ApiResponse(success=True, data={"token": token, "user": {"id": user.id, "username": user.username, "display_name": user.display_name, "role": user.role}})
	
	try:
		# LDAP authentication
		server = Server(settings.LDAP_URL, get_info=ALL)
		user_dn = f"cn={login_data.username},{settings.LDAP_BASE_DN}"
		conn = Connection(server, user_dn, login_data.password, auto_bind=True)
		if not conn.bind():
			log_audit(
				db, actor_user_id=login_data.username, action="login_failed",
				entity="user", entity_id=login_data.username,
				metadata={"reason": "invalid_credentials"},
				source_ip=source_ip, user_agent=user_agent
			)
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
		# Search for user details
		search_filter = settings.LDAP_USER_FILTER.format(username=login_data.username)
		conn.search(settings.LDAP_BASE_DN, search_filter, SUBTREE, attributes=['cn', 'mail', 'displayName', 'userAccountControl'])
		if not conn.entries:
			conn.unbind()
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
		ldap_user = conn.entries[0]
		conn.unbind()
		# Get or create local user
		user = db.query(User).filter(User.external_id == login_data.username).first()
		if not user:
			user = User(
				external_id=login_data.username,
				username=login_data.username,
				email=getattr(ldap_user, 'mail', None),
				display_name=getattr(ldap_user, 'displayName', login_data.username),
				role='user',
				status='active'
			)
			db.add(user); db.commit(); db.refresh(user)
		if user.status != 'active':
			log_audit(
				db, actor_user_id=user.id, action="login_failed",
				entity="user", entity_id=user.id,
				metadata={"reason": "account_disabled"},
				source_ip=source_ip, user_agent=user_agent
			)
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account disabled")
		# Generate JWT token
		token = create_jwt(user)
		log_audit(
			db, actor_user_id=user.id, action="login_success",
			entity="user", entity_id=user.id,
			metadata={"role": user.role},
			source_ip=source_ip, user_agent=user_agent
		)
		return ApiResponse(success=True, data={"token": token, "user": {"id": user.id, "username": user.username, "display_name": user.display_name, "role": user.role}})
	except HTTPException:
		raise
	except Exception:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication service error")

@router.post("/logout", response_model=ApiResponse)
async def logout(request: Request):
	return ApiResponse(success=True, message="Logged out successfully") 