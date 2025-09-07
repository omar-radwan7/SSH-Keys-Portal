from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from ..core.db import SessionLocal
from ..core.config import settings
from ..models import User

ALGORITHM = "HS256"

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

def create_jwt(user: User) -> str:
	expires = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRES_HOURS)
	payload = {
		"id": str(user.id),
		"username": user.username,
		"display_name": user.display_name,
		"role": user.role,
		"exp": expires
	}
	return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)

def get_current_user(token: str, db: Session) -> User:
	try:
		data = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
		user = db.query(User).filter(User.id == data.get("id")).first()
		if not user:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
		# Only block 'disabled' users - allow 'new', 'active', and 'inactive' users
		# 'inactive' just means they haven't been active recently, not that they're blocked
		if user.status == 'disabled':
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is disabled")
		# Update last activity timestamp for real-time status
		user.last_activity_at = datetime.utcnow()
		db.commit()
		return user
	except jwt.PyJWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") 