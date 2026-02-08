from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db import models
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class ZoneResponse(BaseModel):
    id: str
    name: str
    city: str
    latitude: float
    longitude: float
    pincodes: Optional[list[str]] = None
    
    class Config:
        from_attributes = True

class ZoneCreate(BaseModel):
    name: str
    city: str
    latitude: float
    longitude: float

@router.get("/zones", response_model=list[ZoneResponse])
async def get_zones(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all zones (Super Admin) or user's assigned zone (Operator)"""
    # Super Admin can see all zones
    if current_user.role == models.UserRole.SUPER_ADMIN:
        zones = db.query(models.Zone).all()
    # Operators can see their assigned zone
    elif current_user.role == models.UserRole.OPERATOR and current_user.zone_id:
        zone = db.query(models.Zone).filter(models.Zone.id == current_user.zone_id).first()
        zones = [zone] if zone else []
    # Viewers can see all zones (read-only)
    elif current_user.role == models.UserRole.VIEWER:
        zones = db.query(models.Zone).all()
    else:
        zones = []
    
    result = []
    for zone in zones:
        # Parse pincodes if it's a string
        pincodes_list = None
        if hasattr(zone, 'pincodes') and zone.pincodes:
            if isinstance(zone.pincodes, str):
                pincodes_list = [p.strip() for p in zone.pincodes.split(',') if p.strip()]
            elif isinstance(zone.pincodes, list):
                pincodes_list = zone.pincodes
        
        result.append(ZoneResponse(
            id=zone.id,
            name=zone.name,
            city=zone.city,
            latitude=zone.latitude,
            longitude=zone.longitude,
            pincodes=pincodes_list,
        ))
    return result

@router.post("/zones", response_model=ZoneResponse)
async def create_zone(
    zone_data: ZoneCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new zone"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create zones"
        )
    
    zone = models.Zone(
        name=zone_data.name,
        city=zone_data.city,
        latitude=zone_data.latitude,
        longitude=zone_data.longitude,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    
    return ZoneResponse(
        id=zone.id,
        name=zone.name,
        city=zone.city,
        latitude=zone.latitude,
        longitude=zone.longitude,
    )

