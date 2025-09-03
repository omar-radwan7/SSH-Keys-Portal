from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from .core.db import Base
import uuid

class User(Base):
	__tablename__ = "users"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	external_id = Column(String(255), unique=True, nullable=False)
	username = Column(String(255), unique=True, nullable=False)
	email = Column(String(255))
	display_name = Column(String(255), nullable=False)
	role = Column(String(20), nullable=False, default='user')
	status = Column(String(20), nullable=False, default='active')
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

	__table_args__ = (
		CheckConstraint("role in ('user','admin','auditor')"),
		CheckConstraint("status in ('active','disabled')"),
	)

	ssh_keys = relationship("SSHKey", back_populates="user", cascade="all,delete")

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

class Deployment(Base):
	__tablename__ = "deployments"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	host_id = Column(String(36), ForeignKey('managed_hosts.id', ondelete='CASCADE'))
	username = Column(String(255), nullable=False)
	generation = Column(Integer, nullable=False)
	status = Column(String(20), nullable=False, default='pending')
	checksum = Column(String(64))
	started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
	finished_at = Column(DateTime(timezone=True))
	error = Column(Text)

	__table_args__ = (
		CheckConstraint("status in ('pending','success','failed')"),
	)

class Policy(Base):
	__tablename__ = "policies"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	rules_json = Column(Text, nullable=False)  # JSON as TEXT for SQLite
	is_active = Column(Boolean, nullable=False, default=False)
	created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class AuditEvent(Base):
	__tablename__ = "audit_events"
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	ts = Column(DateTime(timezone=True), default=datetime.utcnow)
	actor_user_id = Column(String(36), ForeignKey('users.id'))
	action = Column(String(100), nullable=False)
	entity = Column(String(50), nullable=False)
	entity_id = Column(String(255))
	metadata_json = Column(Text)  # JSON as TEXT for SQLite
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