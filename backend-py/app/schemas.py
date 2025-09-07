from pydantic import BaseModel, Field, constr, EmailStr, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
	username: constr(strip_whitespace=True, min_length=1)
	password: constr(min_length=1)

class TokenUser(BaseModel):
	id: str
	username: str
	display_name: str
	role: str

class RegisterRequest(BaseModel):
	username: constr(strip_whitespace=True, min_length=3, max_length=50)
	password: constr(min_length=8, max_length=128)
	email: Optional[EmailStr] = None
	display_name: constr(strip_whitespace=True, min_length=1, max_length=255) = Field(..., alias="displayName")
	# No role field - all registrations are users

	@field_validator('email', mode='before')
	@classmethod
	def empty_string_to_none(cls, v):
		if isinstance(v, str) and v.strip() == '':
			return None
		return v

	model_config = ConfigDict(populate_by_name=True)

class RegisterResponse(BaseModel):
	success: bool
	message: str
	user: Optional[TokenUser] = None

class LoginResponse(BaseModel):
	token: str
	user: TokenUser

class KeyPreviewRequest(BaseModel):
	publicKey: str
	comment: Optional[str] = None
	authorizedKeysOptions: Optional[str] = None

class KeyPreviewResponse(BaseModel):
	algorithm: str
	bitLength: int
	fingerprint: str
	normalizedComment: Optional[str] = None
	policyValidation: dict

class ImportKeyRequest(BaseModel):
	publicKey: str
	comment: Optional[str] = ""
	expiresAt: Optional[datetime] = None
	authorizedKeysOptions: Optional[str] = None

class SSHKeyOut(BaseModel):
	id: str
	user_id: str
	public_key: str
	algorithm: str
	bit_length: int
	comment: str | None
	fingerprint_sha256: str
	origin: str
	expires_at: Optional[datetime]
	status: str
	authorized_keys_options: Optional[str]
	created_at: datetime

	class Config:
		from_attributes = True

class GenerateKeyRequest(BaseModel):
	algorithm: str
	bitLength: int

class GenerateKeyResponse(BaseModel):
	requestId: str
	downloadUrl: str
	expiresIn: int

class ApiResponse(BaseModel):
	success: bool = True
	data: Optional[dict] = None
	error: Optional[str] = None
	message: Optional[str] = None

# Admin schemas
class ManagedHostCreate(BaseModel):
	hostname: constr(strip_whitespace=True, min_length=1)
	address: constr(strip_whitespace=True, min_length=1)
	os_family: constr(strip_whitespace=True, min_length=1)

class ManagedHostOut(BaseModel):
	id: str
	hostname: str
	address: str
	os_family: str
	last_seen_at: Optional[datetime]
	created_at: datetime
	class Config:
		from_attributes = True

class PolicyIn(BaseModel):
	rules_json: str
	is_active: bool = True

class PolicyOut(BaseModel):
	id: str
	rules_json: str
	is_active: bool
	created_at: datetime
	class Config:
		from_attributes = True

class AuditEventOut(BaseModel):
	id: str
	ts: datetime
	actor_user_id: Optional[str]
	action: str
	entity: str
	entity_id: Optional[str]
	metadata_json: Optional[str]
	source_ip: Optional[str]
	user_agent: Optional[str]
	class Config:
		from_attributes = True

# User-Host Account schemas
class UserHostAccountCreate(BaseModel):
	user_id: str
	host_id: str
	remote_username: constr(strip_whitespace=True, min_length=1)
	status: Optional[str] = "active"

class UserHostAccountOut(BaseModel):
	id: str
	user_id: str
	host_id: str
	remote_username: str
	status: str
	created_at: datetime
	class Config:
		from_attributes = True 

# User account update schemas
class ChangeUsernameRequest(BaseModel):
	newUsername: constr(strip_whitespace=True, min_length=3, max_length=50)
	currentPassword: constr(min_length=1)

class ChangePasswordRequest(BaseModel):
	currentPassword: constr(min_length=1)
	newPassword: constr(min_length=8, max_length=128) 