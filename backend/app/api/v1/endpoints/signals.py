from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.db import models
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class SignalResponse(BaseModel):
    id: str
    signal_id: str
    zone_id: str
    latitude: float
    longitude: float
    status: str
    current_phase: str
    green_time: int
    yellow_time: int
    red_time: int
    mode: str
    
    class Config:
        from_attributes = True

@router.get("/signals", response_model=list[SignalResponse])
async def get_signals(
    zone_id: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all traffic signals, optionally filtered by zone"""
    query = db.query(models.Signal)
    
    # Filter by zone if provided
    if zone_id:
        query = query.filter(models.Signal.zone_id == zone_id)
    # If user is operator, filter by their zone
    elif current_user.role == models.UserRole.OPERATOR and current_user.zone_id:
        query = query.filter(models.Signal.zone_id == current_user.zone_id)
    
    signals = query.all()
    
    return [
        SignalResponse(
            id=signal.id,
            signal_id=signal.signal_id,
            zone_id=signal.zone_id,
            latitude=signal.latitude,
            longitude=signal.longitude,
            status=signal.status.value if hasattr(signal.status, 'value') else str(signal.status),
            current_phase=signal.current_phase.value if hasattr(signal.current_phase, 'value') else str(signal.current_phase),
            green_time=signal.green_time,
            yellow_time=signal.yellow_time,
            red_time=signal.red_time,
            mode=signal.mode.value if hasattr(signal.mode, 'value') else str(signal.mode),
        )
        for signal in signals
    ]

@router.get("/signals/{signal_id}", response_model=SignalResponse)
async def get_signal(
    signal_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific traffic signal by ID"""
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    # Check if operator can access this signal
    if current_user.role == models.UserRole.OPERATOR:
        if signal.zone_id != current_user.zone_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this signal"
            )
    
    return SignalResponse(
        id=signal.id,
        signal_id=signal.signal_id,
        zone_id=signal.zone_id,
        latitude=signal.latitude,
        longitude=signal.longitude,
        status=signal.status.value if hasattr(signal.status, 'value') else str(signal.status),
        current_phase=signal.current_phase.value if hasattr(signal.current_phase, 'value') else str(signal.current_phase),
        green_time=signal.green_time,
        yellow_time=signal.yellow_time,
        red_time=signal.red_time,
        mode=signal.mode.value if hasattr(signal.mode, 'value') else str(signal.mode),
    )

@router.put("/signals/{signal_id}")
async def update_signal(
    signal_id: str,
    update_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a traffic signal"""
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    # Check permissions
    if current_user.role == models.UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot update signals"
        )
    
    if current_user.role == models.UserRole.OPERATOR:
        if signal.zone_id != current_user.zone_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this signal"
            )
    
    # Update signal fields
    for key, value in update_data.items():
        if hasattr(signal, key):
            # Handle enum values
            if key == 'status' and isinstance(value, str):
                try:
                    signal.status = models.SignalStatus(value)
                except:
                    pass
            elif key == 'current_phase' and isinstance(value, str):
                try:
                    signal.current_phase = models.SignalPhase(value)
                except:
                    pass
            elif key == 'mode' and isinstance(value, str):
                try:
                    signal.mode = models.ControlMode(value)
                except:
                    pass
            else:
                setattr(signal, key, value)
    
    db.commit()
    db.refresh(signal)
    
    return SignalResponse(
        id=signal.id,
        signal_id=signal.signal_id,
        zone_id=signal.zone_id,
        latitude=signal.latitude,
        longitude=signal.longitude,
        status=signal.status.value if hasattr(signal.status, 'value') else str(signal.status),
        current_phase=signal.current_phase.value if hasattr(signal.current_phase, 'value') else str(signal.current_phase),
        green_time=signal.green_time,
        yellow_time=signal.yellow_time,
        red_time=signal.red_time,
        mode=signal.mode.value if hasattr(signal.mode, 'value') else str(signal.mode),
    )

@router.put("/signals/{signal_id}/timing")
async def update_signal_timing(
    signal_id: str,
    timing: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update signal timing"""
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    # Check permissions
    if current_user.role == models.UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot update signals"
        )
    
    if current_user.role == models.UserRole.OPERATOR:
        if signal.zone_id != current_user.zone_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this signal"
            )
    
    # Update timing
    if 'green_time' in timing:
        signal.green_time = timing['green_time']
    if 'yellow_time' in timing:
        signal.yellow_time = timing['yellow_time']
    if 'red_time' in timing:
        signal.red_time = timing['red_time']
    
    db.commit()
    db.refresh(signal)
    
    return SignalResponse(
        id=signal.id,
        signal_id=signal.signal_id,
        zone_id=signal.zone_id,
        latitude=signal.latitude,
        longitude=signal.longitude,
        status=signal.status.value if hasattr(signal.status, 'value') else str(signal.status),
        current_phase=signal.current_phase.value if hasattr(signal.current_phase, 'value') else str(signal.current_phase),
        green_time=signal.green_time,
        yellow_time=signal.yellow_time,
        red_time=signal.red_time,
        mode=signal.mode.value if hasattr(signal.mode, 'value') else str(signal.mode),
    )

