from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings
import os

DATABASE_URL = settings.DATABASE_URL or f"sqlite:///{os.path.abspath('./hpc_ssh_portal.db')}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db() -> None:
	# For Postgres, you can create extensions/migrations here if needed
	pass

# Import models to register with SQLAlchemy
from ..models import User, SSHKey, ManagedHost, Deployment, Policy, AuditEvent, SystemGenRequest 