from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings
import os

# Determine database URL based on configuration
if settings.DATABASE_URL:
    DATABASE_URL = settings.DATABASE_URL
elif settings.USE_SQLITE:
    DATABASE_URL = f"sqlite:///{os.path.abspath('./hpc_ssh_portal.db')}"
else:
    DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

# Create engine with appropriate configuration
if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db() -> None:
	# For Postgres, you can create extensions/migrations here if needed
	pass

# Import models to register with SQLAlchemy
from ..models import User, SSHKey, ManagedHost, Deployment, Policy, AuditEvent, SystemGenRequest 