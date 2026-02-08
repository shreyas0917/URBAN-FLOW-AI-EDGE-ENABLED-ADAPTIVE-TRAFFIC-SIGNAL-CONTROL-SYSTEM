from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta

from app.db.database import get_db
from app.db import models
from app.core.security import verify_password, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "viewer"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    zone_id: str | None = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """Get current authenticated user"""
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint"""
    try:
        # Normalize email to lowercase for comparison
        email_lower = login_data.email.lower().strip()
        # SQLite doesn't support ilike, so we use func.lower for case-insensitive comparison
        from sqlalchemy import func
        user = db.query(models.User).filter(func.lower(models.User.email) == email_lower).first()
        
        if not user:
            print(f"Login attempt failed: User not found for email: {email_lower}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        password_valid = verify_password(login_data.password, user.hashed_password)
        if not password_valid:
            print(f"Login attempt failed: Invalid password for email: {email_lower}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        )
        
        # Get user role (handle both enum and string)
        if hasattr(user.role, 'value'):
            user_role = user.role.value
        elif isinstance(user.role, str):
            user_role = user.role
        else:
            # Handle enum directly - extract the name
            user_role = str(user.role)
            # If it's like "UserRole.SUPER_ADMIN", extract "SUPER_ADMIN"
            if '.' in user_role:
                user_role = user_role.split('.')[-1]
        
        # Normalize role to lowercase with underscore
        user_role = user_role.lower().replace('-', '_')
        
        # Map common variations
        role_mapping = {
            'superadmin': 'super_admin',
            'super admin': 'super_admin',
            'admin': 'super_admin',
        }
        user_role = role_mapping.get(user_role, user_role)
        
        print(f"Login successful for user: {user.email}, role: {user_role}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user_role,
                zone_id=user.zone_id
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/logout")
async def logout():
    """Logout endpoint"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        zone_id=current_user.zone_id
    )

