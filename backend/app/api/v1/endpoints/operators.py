from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db.database import get_db
from app.db import models
from app.api.v1.endpoints.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

class OperatorResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    zone_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class OperatorCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    zone_id: Optional[str] = None

@router.get("/operators", response_model=list[OperatorResponse])
async def get_operators(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all operators"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can view all operators"
        )
    
    operators = db.query(models.User).filter(
        models.User.role.in_([models.UserRole.OPERATOR, models.UserRole.VIEWER])
    ).all()
    
    return [
        OperatorResponse(
            id=op.id,
            email=op.email,
            name=op.name,
            role=op.role.value if hasattr(op.role, 'value') else str(op.role),
            zone_id=op.zone_id,
        )
        for op in operators
    ]

@router.post("/operators", response_model=OperatorResponse)
async def create_operator(
    operator_data: OperatorCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new operator"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create operators"
        )
    
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == operator_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Verify zone exists if provided
    if operator_data.zone_id:
        zone = db.query(models.Zone).filter(models.Zone.id == operator_data.zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zone not found"
            )
    
    operator = models.User(
        email=operator_data.email,
        hashed_password=get_password_hash(operator_data.password),
        name=operator_data.name,
        role=models.UserRole.OPERATOR,
        zone_id=operator_data.zone_id,
    )
    db.add(operator)
    db.commit()
    db.refresh(operator)
    
    return OperatorResponse(
        id=operator.id,
        email=operator.email,
        name=operator.name,
        role=operator.role.value if hasattr(operator.role, 'value') else str(operator.role),
        zone_id=operator.zone_id,
    )

@router.put("/operators/{operator_id}/assign-zone")
async def assign_zone(
    operator_id: str,
    zone_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a zone to an operator"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can assign zones"
        )
    
    operator = db.query(models.User).filter(models.User.id == operator_id).first()
    if not operator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator not found"
        )
    
    zone_id = zone_data.get('zone_id')
    if zone_id:
        zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zone not found"
            )
        operator.zone_id = zone_id
    else:
        operator.zone_id = None
    
    db.commit()
    db.refresh(operator)
    
    return OperatorResponse(
        id=operator.id,
        email=operator.email,
        name=operator.name,
        role=operator.role.value if hasattr(operator.role, 'value') else str(operator.role),
        zone_id=operator.zone_id,
    )

