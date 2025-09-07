"""
Authentication utilities for password hashing and verification
"""

from passlib.context import CryptContext
from typing import Optional
import re

# Password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        errors.append("Password must be less than 128 characters long")
    
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must contain at least one special character")
    
    return len(errors) == 0, errors

def validate_username(username: str) -> tuple[bool, list[str]]:
    """
    Validate username format
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    if len(username) < 3:
        errors.append("Username must be at least 3 characters long")
    
    if len(username) > 50:
        errors.append("Username must be less than 50 characters long")
    
    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        errors.append("Username can only contain letters, numbers, hyphens, and underscores")
    
    if username.startswith(('-', '_')) or username.endswith(('-', '_')):
        errors.append("Username cannot start or end with hyphens or underscores")
    
    return len(errors) == 0, errors 