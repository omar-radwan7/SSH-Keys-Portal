from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ldap3 import Server, Connection, ALL, SUBTREE
from ..core.deps import get_db, create_jwt
from ..core.config import settings
from ..models import User
from ..schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ApiResponse
from ..services.audit import log_audit
from ..utils.auth import hash_password, verify_password, validate_password_strength, validate_username
import json
from ..core.deps import get_current_user
from datetime import datetime, timedelta
from ..schemas import ChangeUsernameRequest, ChangePasswordRequest
from ..schemas import ChangeEmailRequest

router = APIRouter()

def get_client_ip(request: Request) -> str:
	forwarded = request.headers.get("x-forwarded-for")
	if forwarded:
		return forwarded.split(",")[0]
	return request.client.host if request.client else "0.0.0.0"

def determine_user_role(conn: Connection, user_dn: str) -> str:
	"""Determine user role based on LDAP group membership"""
	try:
		# Check for admin groups
		admin_groups = [g.strip() for g in settings.LDAP_ADMIN_GROUPS.split(',')]
		for group_dn in admin_groups:
			group_filter = settings.LDAP_GROUP_FILTER.format(user_dn=user_dn)
			conn.search(group_dn, group_filter, SUBTREE)
			if conn.entries:
				return 'admin'
		
		# Check for auditor groups
		auditor_groups = [g.strip() for g in settings.LDAP_AUDITOR_GROUPS.split(',')]
		for group_dn in auditor_groups:
			group_filter = settings.LDAP_GROUP_FILTER.format(user_dn=user_dn)
			conn.search(group_dn, group_filter, SUBTREE)
			if conn.entries:
				return 'auditor'
		
		# Default to user role
		return 'user'
	except Exception:
		# If group lookup fails, default to user role
		return 'user'

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
	
	# Update login tracking
	user.last_login_at = datetime.utcnow()
	user.last_activity_at = datetime.utcnow()
	if user.status == 'new':
		user.status = 'active'
	db.commit()
	
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
	"""Login with local account or LDAP authentication"""
	source_ip = get_client_ip(request)
	user_agent = request.headers.get("user-agent", "")
	
	try:
		# First, try to authenticate with local account
		user = db.query(User).filter(
			User.username == login_data.username,
			User.is_local_account == True
		).first()
		
		if user and user.password_hash:
			# Verify password for local account
			if verify_password(login_data.password, user.password_hash):
				# Check if account is disabled (only 'disabled' accounts cannot login)
				if user.status == 'disabled':
					raise HTTPException(
						status_code=401,
						detail="Account is disabled"
					)
				
				# Generate JWT token
				token = create_jwt(user)
				
				# Update login tracking
				user.last_login_at = datetime.utcnow()
				user.last_activity_at = datetime.utcnow()
				if user.status == 'new':
					user.status = 'active'
				db.commit()
				
				# Log successful login
				log_audit(
					db, actor_user_id=user.id, action="login_success",
					entity="user", entity_id=user.id,
					metadata={"role": user.role, "auth_type": "local"},
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
					},
					message="Login successful"
				)
			else:
				# Wrong password for local account
				log_audit(
					db, actor_user_id=user.id, action="login_failed",
					entity="user", entity_id=user.id,
					metadata={"reason": "invalid_password", "auth_type": "local"},
					source_ip=source_ip, user_agent=user_agent
				)
				raise HTTPException(
					status_code=401,
					detail="Invalid username or password"
				)
		
		# If no local account found, try LDAP authentication
		if settings.LDAP_URL and settings.LDAP_BASE_DN:
			try:
				server = Server(settings.LDAP_URL, get_info=ALL)
				user_dn = f"cn={login_data.username},{settings.LDAP_BASE_DN}"
				conn = Connection(server, user_dn, login_data.password, auto_bind=True)
				if not conn.bind():
					log_audit(
						db, actor_user_id=login_data.username, action="login_failed",
						entity="user", entity_id=login_data.username,
						metadata={"reason": "invalid_credentials", "auth_type": "ldap"},
						source_ip=source_ip, user_agent=user_agent
					)
					raise HTTPException(status_code=401, detail="Invalid credentials")
				
				# Search for user details
				search_filter = settings.LDAP_USER_FILTER.format(username=login_data.username)
				conn.search(settings.LDAP_BASE_DN, search_filter, SUBTREE, attributes=['cn', 'mail', 'displayName'])
				if not conn.entries:
					conn.unbind()
					raise HTTPException(status_code=401, detail="User not found")
				
				ldap_user = conn.entries[0]
				user_dn = ldap_user.entry_dn
				
				# Determine role based on group membership
				role = determine_user_role(conn, user_dn)
				conn.unbind()
				
				# Get or create LDAP user in local database
				user = db.query(User).filter(User.external_id == login_data.username).first()
				if not user:
					user = User(
						external_id=login_data.username,
						username=login_data.username,
						email=getattr(ldap_user, 'mail', None),
						display_name=getattr(ldap_user, 'displayName', login_data.username),
						role=role,
						status='active',
						is_local_account=False
					)
					db.add(user)
					db.commit()
					db.refresh(user)
				
				if user.status != 'active':
					log_audit(
						db, actor_user_id=user.id, action="login_failed",
						entity="user", entity_id=user.id,
						metadata={"reason": "account_disabled", "auth_type": "ldap"},
						source_ip=source_ip, user_agent=user_agent
					)
					raise HTTPException(status_code=401, detail="Account is disabled")
				
				# Generate JWT token
				token = create_jwt(user)
				
				# Update login tracking
				user.last_login_at = datetime.utcnow()
				user.last_activity_at = datetime.utcnow()
				if user.status == 'new':
					user.status = 'active'
				db.commit()
				
				# Log successful LDAP login
				log_audit(
					db, actor_user_id=user.id, action="login_success",
					entity="user", entity_id=user.id,
					metadata={"role": user.role, "auth_type": "ldap"},
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
					},
					message="Login successful"
				)
				
			except HTTPException:
				raise
			except Exception as e:
				log_audit(
					db, actor_user_id=login_data.username, action="login_failed",
					entity="user", entity_id=login_data.username,
					metadata={"reason": "ldap_error", "error": str(e)},
					source_ip=source_ip, user_agent=user_agent
				)
				raise HTTPException(status_code=500, detail="Authentication service error")
		
		# If we reach here, no authentication method worked
		log_audit(
			db, actor_user_id=login_data.username, action="login_failed",
			entity="user", entity_id=login_data.username,
			metadata={"reason": "no_auth_method"},
			source_ip=source_ip, user_agent=user_agent
		)
		raise HTTPException(status_code=401, detail="Invalid username or password")
		
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail="Authentication service error")

@router.post("/logout", response_model=ApiResponse)
async def logout(request: Request):
	return ApiResponse(success=True, message="Logged out successfully")

@router.put("/change-username", response_model=ApiResponse)
async def change_username(
	payload: ChangeUsernameRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Allow the current user to change their username (local accounts only)."""
	user = get_current_user(request.headers.get("authorization"), db)
	if not user.is_local_account:
		raise HTTPException(status_code=400, detail="Username change is only available for local accounts")
	if not user.password_hash or not verify_password(payload.currentPassword, user.password_hash):
		raise HTTPException(status_code=401, detail="Current password is incorrect")
	# Validate new username
	username_valid, username_errors = validate_username(payload.newUsername)
	if not username_valid:
		raise HTTPException(status_code=400, detail=f"Invalid username: {'; '.join(username_errors)}")
	# Check uniqueness
	existing = db.query(User).filter(User.username == payload.newUsername).first()
	if existing and existing.id != user.id:
		raise HTTPException(status_code=400, detail="Username already exists")
	old_username = user.username
	user.username = payload.newUsername
	db.commit()
	# Create new token reflecting updated username
	token = create_jwt(user)
	# Audit
	log_audit(
		db, actor_user_id=user.id, action="username_changed",
		entity="user", entity_id=user.id,
		metadata={"old_username": old_username, "new_username": user.username},
		source_ip=get_client_ip(request), user_agent=request.headers.get("user-agent", "")
	)
	return ApiResponse(
		success=True,
		message="Username updated successfully",
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

@router.put("/change-password", response_model=ApiResponse)
async def change_password(
	payload: ChangePasswordRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Allow the current user to change their password (local accounts only)."""
	user = get_current_user(request.headers.get("authorization"), db)
	if not user.is_local_account:
		raise HTTPException(status_code=400, detail="Password change is only available for local accounts")
	if not user.password_hash or not verify_password(payload.currentPassword, user.password_hash):
		raise HTTPException(status_code=401, detail="Current password is incorrect")
	# Validate new password strength
	password_valid, password_errors = validate_password_strength(payload.newPassword)
	if not password_valid:
		raise HTTPException(status_code=400, detail=f"Password requirements not met: {'; '.join(password_errors)}")
	# Update password
	user.password_hash = hash_password(payload.newPassword)
	db.commit()
	# Audit
	log_audit(
		db, actor_user_id=user.id, action="password_changed",
		entity="user", entity_id=user.id,
		metadata={"username": user.username},
		source_ip=get_client_ip(request), user_agent=request.headers.get("user-agent", "")
	)
	return ApiResponse(success=True, message="Password updated successfully")

@router.put("/change-email", response_model=ApiResponse)
async def change_email(
	payload: ChangeEmailRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Allow the current user to change their email (local accounts only)."""
	user = get_current_user(request.headers.get("authorization"), db)
	if not user.is_local_account:
		raise HTTPException(status_code=400, detail="Email change is only available for local accounts")
	if not user.password_hash or not verify_password(payload.currentPassword, user.password_hash):
		raise HTTPException(status_code=401, detail="Current password is incorrect")
	# Check email uniqueness
	if payload.newEmail:
		existing_email = db.query(User).filter(User.email == payload.newEmail).first()
		if existing_email and existing_email.id != user.id:
			raise HTTPException(status_code=400, detail="Email address already registered")
	old_email = user.email
	user.email = payload.newEmail
	db.commit()
	# Audit
	log_audit(
		db, actor_user_id=user.id, action="email_changed",
		entity="user", entity_id=user.id,
		metadata={"old_email": old_email, "new_email": user.email},
		source_ip=get_client_ip(request), user_agent=request.headers.get("user-agent", "")
	)
	return ApiResponse(success=True, message="Email updated successfully")

@router.post("/register", response_model=ApiResponse)
async def register_user(
	register_data: RegisterRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Register a new user account"""
	source_ip = get_client_ip(request)
	
	try:
		# Validate username format
		username_valid, username_errors = validate_username(register_data.username)
		if not username_valid:
			raise HTTPException(
				status_code=400,
				detail=f"Invalid username: {'; '.join(username_errors)}"
			)
		
		# Validate password strength
		password_valid, password_errors = validate_password_strength(register_data.password)
		if not password_valid:
			raise HTTPException(
				status_code=400,
				detail=f"Password requirements not met: {'; '.join(password_errors)}"
			)
		
		# Check if username already exists
		existing_user = db.query(User).filter(User.username == register_data.username).first()
		if existing_user:
			raise HTTPException(
				status_code=400,
				detail="Username already exists"
			)
		
		# Check if email already exists (if provided)
		if register_data.email:
			existing_email = db.query(User).filter(User.email == register_data.email).first()
			if existing_email:
				raise HTTPException(
					status_code=400,
					detail="Email address already registered"
				)
		
		# Hash the password
		password_hash = hash_password(register_data.password)
		
		# Create new user (always as 'user' role - admins must be created by existing admins)
		new_user = User(
			username=register_data.username,
			email=register_data.email,
			display_name=register_data.display_name,
			password_hash=password_hash,
			role='user',  # Force all registrations to be users
			status='new',  # New users start as 'new' until first login
			is_local_account=True,
			external_id=None  # Local accounts don't have external IDs
		)
		
		db.add(new_user)
		db.commit()
		db.refresh(new_user)
		
		# Log the registration
		log_audit(
			db, actor_user_id=new_user.id, action="user_registered",
			entity="user", entity_id=new_user.id,
			metadata={
				"username": new_user.username,
				"role": new_user.role,
				"registration_type": "local"
			},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		
		# Create JWT token for immediate login
		token = create_jwt(new_user)
		
		return ApiResponse(
			success=True,
			message="Registration successful! You are now logged in.",
			data={
				"token": token,
				"user": {
					"id": new_user.id,
					"username": new_user.username,
					"display_name": new_user.display_name,
					"role": new_user.role
				}
			}
		)
		
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail="Registration failed. Please try again."
		)

@router.post("/bootstrap-admin", response_model=ApiResponse)
async def bootstrap_first_admin(
	admin_data: RegisterRequest,
	request: Request,
	db: Session = Depends(get_db)
):
	"""Create the first admin account - only works if no admin accounts exist"""
	source_ip = get_client_ip(request)
	
	try:
		# Check if any admin accounts already exist
		existing_admin = db.query(User).filter(User.role == 'admin').first()
		if existing_admin:
			raise HTTPException(
				status_code=403,
				detail="Admin accounts already exist. Use the admin panel to create additional admins."
			)
		
		# Validate username format
		username_valid, username_errors = validate_username(admin_data.username)
		if not username_valid:
			raise HTTPException(
				status_code=400,
				detail=f"Invalid username: {'; '.join(username_errors)}"
			)
		
		# Validate password strength
		password_valid, password_errors = validate_password_strength(admin_data.password)
		if not password_valid:
			raise HTTPException(
				status_code=400,
				detail=f"Password requirements not met: {'; '.join(password_errors)}"
			)
		
		# Check if username already exists
		existing_user = db.query(User).filter(User.username == admin_data.username).first()
		if existing_user:
			raise HTTPException(
				status_code=400,
				detail="Username already exists"
			)
		
		# Check if email already exists (if provided)
		if admin_data.email:
			existing_email = db.query(User).filter(User.email == admin_data.email).first()
			if existing_email:
				raise HTTPException(
					status_code=400,
					detail="Email address already registered"
				)
		
		# Hash the password
		password_hash = hash_password(admin_data.password)
		
		# Create first admin user
		first_admin = User(
			username=admin_data.username,
			email=admin_data.email,
			display_name=admin_data.display_name,
			password_hash=password_hash,
			role='admin',  # Create as admin
			status='new',  # New admin starts as 'new' until first login
			is_local_account=True,
			external_id=None
		)
		
		db.add(first_admin)
		db.commit()
		db.refresh(first_admin)
		
		# Log the bootstrap admin creation
		log_audit(
			db, actor_user_id=first_admin.id, action="bootstrap_admin_created",
			entity="user", entity_id=first_admin.id,
			metadata={
				"username": first_admin.username,
				"bootstrap": True
			},
			source_ip=source_ip, user_agent=request.headers.get("user-agent", "")
		)
		
		# Create JWT token for immediate login
		token = create_jwt(first_admin)
		
		return ApiResponse(
			success=True,
			message="First admin account created successfully! You are now logged in.",
			data={
				"token": token,
				"user": {
					"id": first_admin.id,
					"username": first_admin.username,
					"display_name": first_admin.display_name,
					"role": first_admin.role
				}
			}
		)
		
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail="Failed to create first admin account. Please try again."
		) 