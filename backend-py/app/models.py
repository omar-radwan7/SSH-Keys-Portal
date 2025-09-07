from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, CheckConstraint, text, JSON
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from .core.db import Base
import uuid

class User(Base):
	__tablename__ = "users"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	external_id = Column(String(255), unique=True, nullable=True)  # Made nullable for local accounts
	username = Column(String(255), unique=True, nullable=False)
	email = Column(String(255))
	display_name = Column(String(255), nullable=False)
	password_hash = Column(String(255), nullable=True)  # For local accounts
	role = Column(String(20), nullable=False, default='user')
	status = Column(String(20), nullable=False, default='active')
	is_local_account = Column(Boolean, default=True)  # True for registered accounts, False for LDAP
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	last_login_at = Column(DateTime(timezone=True))
	last_activity_at = Column(DateTime(timezone=True))

	__table_args__ = (
		CheckConstraint("role in ('user','admin','auditor')"),
		CheckConstraint("status in ('active','inactive','new')"),
	)

	ssh_keys = relationship("SSHKey", back_populates="user", cascade="all,delete")
	account_bindings = relationship("UserHostAccount", back_populates="user", cascade="all,delete")

class SSHKey(Base):
	__tablename__ = "ssh_keys"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
	public_key = Column(Text, nullable=False)
	algorithm = Column(String(50), nullable=False)
	bit_length = Column(Integer, nullable=False)
	comment = Column(Text)
	fingerprint_sha256 = Column(String(64), unique=True, nullable=False)
	origin = Column(String(20), nullable=False)
	expires_at = Column(DateTime(timezone=True))
	status = Column(String(20), nullable=False, default='active')
	authorized_keys_options = Column(Text)
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	last_applied_at = Column(DateTime(timezone=True))

	__table_args__ = (
		CheckConstraint("origin in ('import','client_gen','system_gen')"),
		CheckConstraint("status in ('active','deprecated','revoked','expired')"),
	)

	user = relationship("User", back_populates="ssh_keys")

class ManagedHost(Base):
	__tablename__ = "managed_hosts"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	hostname = Column(String(255), unique=True, nullable=False)
	address = Column(String(255), nullable=False)
	os_family = Column(String(50), nullable=False)
	last_seen_at = Column(DateTime(timezone=True))
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

	account_bindings = relationship("UserHostAccount", back_populates="host", cascade="all,delete")
	deployments = relationship("Deployment", back_populates="host", cascade="all,delete")

class UserHostAccount(Base):
	__tablename__ = "user_host_accounts"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
	host_id = Column(String(36), ForeignKey('managed_hosts.id', ondelete='CASCADE'))
	remote_username = Column(String(255), nullable=False)
	status = Column(String(20), nullable=False, default='active')
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

	__table_args__ = (
		CheckConstraint("status in ('active','disabled')"),
	)

	user = relationship("User", back_populates="account_bindings")
	host = relationship("ManagedHost", back_populates="account_bindings")
	deployments = relationship("Deployment", back_populates="user_host_account", cascade="all,delete")

class Deployment(Base):
	__tablename__ = "deployments"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	host_id = Column(String(36), ForeignKey('managed_hosts.id', ondelete='CASCADE'))
	user_host_account_id = Column(String(36), ForeignKey('user_host_accounts.id', ondelete='CASCADE'))
	generation = Column(Integer, nullable=False)
	status = Column(String(20), nullable=False, default='pending')
	checksum = Column(String(64))
	key_count = Column(Integer, default=0)
	started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	finished_at = Column(DateTime(timezone=True))
	error = Column(Text)
	retry_count = Column(Integer, default=0)

	__table_args__ = (
		CheckConstraint("status in ('pending','running','success','failed','cancelled')"),
	)

	host = relationship("ManagedHost", back_populates="deployments")
	user_host_account = relationship("UserHostAccount", back_populates="deployments")

class Policy(Base):
	__tablename__ = "policies"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	name = Column(String(255), nullable=False)
	rules = Column(JSON, nullable=False)  # Structured policy rules
	is_active = Column(Boolean, nullable=False, default=False)
	created_by = Column(String(36), ForeignKey('users.id'))
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class AuditEvent(Base):
	__tablename__ = "audit_events"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	ts = Column(DateTime(timezone=True), default=datetime.utcnow)
	actor_user_id = Column(String(36), ForeignKey('users.id'))
	action = Column(String(100), nullable=False)
	entity = Column(String(50), nullable=False)
	entity_id = Column(String(255))
	metadata_json = Column(Text)  # JSON as TEXT for SQLite compatibility
	source_ip = Column(String(45))  # IP as string for SQLite
	user_agent = Column(Text)

class SystemGenRequest(Base):
	__tablename__ = "system_gen_requests"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
	algorithm = Column(String(50), nullable=False)
	bit_length = Column(Integer, nullable=False)
	encrypted_private_key = Column(Text, nullable=False)
	download_token = Column(String(255), unique=True, nullable=False)
	expires_at = Column(DateTime(timezone=True), nullable=False)
	downloaded_at = Column(DateTime(timezone=True))
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ApplyQueue(Base):
	__tablename__ = "apply_queue"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_host_account_id = Column(String(36), ForeignKey('user_host_accounts.id', ondelete='CASCADE'))
	priority = Column(Integer, default=0)
	status = Column(String(20), nullable=False, default='queued')
	scheduled_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	started_at = Column(DateTime(timezone=True))
	finished_at = Column(DateTime(timezone=True))
	error = Column(Text)
	retry_count = Column(Integer, default=0)
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

	__table_args__ = (
		CheckConstraint("status in ('queued','running','completed','failed','cancelled')"),
	)

class NotificationQueue(Base):
	__tablename__ = "notification_queue"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
	notification_type = Column(String(50), nullable=False)
	subject = Column(String(255), nullable=False)
	message = Column(Text, nullable=False)
	status = Column(String(20), nullable=False, default='queued')
	scheduled_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	sent_at = Column(DateTime(timezone=True))
	error = Column(Text)
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

	__table_args__ = (
		CheckConstraint("status in ('queued','sent','failed')"),
		CheckConstraint("notification_type in ('expiry_reminder','key_generated','key_revoked','apply_failed','emergency_revoke')"),
	) 