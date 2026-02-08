from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import math

from app.db.database import get_db
from app.db import models
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class EmergencyRouteCreate(BaseModel):
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    vehicle_type: str = "ambulance"
    priority: int = 1
    name: Optional[str] = None
    clear_signals: bool = True  # Automatically clear signals along route

class EmergencyRouteResponse(BaseModel):
    id: str
    name: Optional[str] = None
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    vehicle_type: str
    priority: int
    active: bool
    created_at: datetime
    estimated_arrival: Optional[datetime] = None
    signals_cleared: List[str] = []
    created_by: Optional[str] = None

class EmergencyVehicleRequest(BaseModel):
    vehicle_type: str = "ambulance"
    current_latitude: float
    current_longitude: float
    destination_latitude: float
    destination_longitude: float
    priority: int = 1
    clear_signals: bool = True

# In-memory storage for emergency routes (in production, use database)
emergency_routes: dict[str, dict] = {}

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def find_signals_along_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float, db: Session, radius_km: float = 0.5) -> List[models.Signal]:
    """Find signals within radius_km of the route"""
    signals = db.query(models.Signal).filter(models.Signal.status == models.SignalStatus.ACTIVE).all()
    route_signals = []
    
    for signal in signals:
        # Calculate distance from signal to route start
        dist_to_start = calculate_distance(signal.latitude, signal.longitude, start_lat, start_lon)
        # Calculate distance from signal to route end
        dist_to_end = calculate_distance(signal.latitude, signal.longitude, end_lat, end_lon)
        # Calculate distance from signal to route midpoint
        mid_lat = (start_lat + end_lat) / 2
        mid_lon = (start_lon + end_lon) / 2
        dist_to_mid = calculate_distance(signal.latitude, signal.longitude, mid_lat, mid_lon)
        
        # If signal is within radius of any point on route
        if min(dist_to_start, dist_to_end, dist_to_mid) <= radius_km:
            route_signals.append(signal)
    
    return route_signals

def clear_signals_for_emergency(signal_ids: List[str], db: Session):
    """Clear signals (set to green) for emergency vehicle"""
    cleared = []
    for signal_id in signal_ids:
        signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
        if signal:
            # Set signal to green phase and extend green time
            signal.current_phase = models.SignalPhase.NORTH  # Green phase
            signal.green_time = 60  # Extended green time for emergency
            signal.mode = models.ControlMode.MANUAL  # Manual mode for emergency
            cleared.append(signal_id)
    db.commit()
    return cleared

@router.post("/emergency/routes", response_model=EmergencyRouteResponse)
async def create_emergency_route(
    route_data: EmergencyRouteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an emergency vehicle route and optionally clear signals"""
    # Check if user has permission (Super Admin or Operator)
    if current_user.role not in [models.UserRole.SUPER_ADMIN, models.UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin and Operators can create emergency routes"
        )
    
    route_id = str(uuid.uuid4())
    
    # Find signals along the route
    route_signals = []
    signals_cleared = []
    
    if route_data.clear_signals:
        route_signals = find_signals_along_route(
            route_data.start_latitude,
            route_data.start_longitude,
            route_data.end_latitude,
            route_data.end_longitude,
            db,
            radius_km=0.5  # 500m radius
        )
        
        if route_signals:
            signal_ids = [s.id for s in route_signals]
            signals_cleared = clear_signals_for_emergency(signal_ids, db)
    
    # Calculate estimated arrival (assuming 60 km/h average speed)
    distance_km = calculate_distance(
        route_data.start_latitude, route_data.start_longitude,
        route_data.end_latitude, route_data.end_longitude
    )
    estimated_minutes = (distance_km / 60) * 60  # Convert to minutes
    estimated_arrival = datetime.utcnow() + timedelta(minutes=int(estimated_minutes))
    
    route = {
        "id": route_id,
        "name": route_data.name or f"{route_data.vehicle_type.title()} Emergency Route",
        "start_latitude": route_data.start_latitude,
        "start_longitude": route_data.start_longitude,
        "end_latitude": route_data.end_latitude,
        "end_longitude": route_data.end_longitude,
        "vehicle_type": route_data.vehicle_type,
        "priority": route_data.priority,
        "active": True,
        "created_at": datetime.utcnow(),
        "created_by": current_user.id,
        "created_by_name": current_user.name,
        "signals_cleared": signals_cleared,
        "estimated_arrival": estimated_arrival,
    }
    
    emergency_routes[route_id] = route
    
    return EmergencyRouteResponse(
        id=route_id,
        name=route["name"],
        start_latitude=route["start_latitude"],
        start_longitude=route["start_longitude"],
        end_latitude=route["end_latitude"],
        end_longitude=route["end_longitude"],
        vehicle_type=route["vehicle_type"],
        priority=route["priority"],
        active=route["active"],
        created_at=route["created_at"],
        estimated_arrival=route["estimated_arrival"],
        signals_cleared=signals_cleared,
        created_by=current_user.name,
    )

@router.get("/emergency/routes/active", response_model=List[EmergencyRouteResponse])
async def get_active_routes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active emergency routes"""
    active = [r for r in emergency_routes.values() if r.get("active", True)]
    
    return [
        EmergencyRouteResponse(
            id=r["id"],
            name=r.get("name"),
            start_latitude=r["start_latitude"],
            start_longitude=r["start_longitude"],
            end_latitude=r["end_latitude"],
            end_longitude=r["end_longitude"],
            vehicle_type=r["vehicle_type"],
            priority=r["priority"],
            active=r["active"],
            created_at=r["created_at"],
            estimated_arrival=r.get("estimated_arrival"),
            signals_cleared=r.get("signals_cleared", []),
            created_by=r.get("created_by_name"),
        )
        for r in active
    ]

@router.put("/emergency/routes/{route_id}/deactivate")
async def deactivate_route(
    route_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate an emergency route and restore normal signal operation"""
    if route_id not in emergency_routes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    # Restore signals to normal operation
    route = emergency_routes[route_id]
    signal_ids = route.get("signals_cleared", [])
    
    for signal_id in signal_ids:
        signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
        if signal:
            signal.mode = models.ControlMode.AUTO  # Restore auto mode
            signal.green_time = 30  # Restore normal green time
    db.commit()
    
    emergency_routes[route_id]["active"] = False
    
    return {"message": "Route deactivated and signals restored", "route_id": route_id}

@router.post("/emergency/clear-signals")
async def clear_signals_emergency(
    request: EmergencyVehicleRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually clear signals for emergency vehicle"""
    if current_user.role not in [models.UserRole.SUPER_ADMIN, models.UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin and Operators can clear signals"
        )
    
    # Find signals near the emergency vehicle
    route_signals = find_signals_along_route(
        request.current_latitude,
        request.current_longitude,
        request.destination_latitude,
        request.destination_longitude,
        db,
        radius_km=0.5
    )
    
    if not route_signals:
        return {"message": "No signals found along route", "signals_cleared": []}
    
    signal_ids = [s.id for s in route_signals]
    signals_cleared = clear_signals_for_emergency(signal_ids, db)
    
    return {
        "message": f"Cleared {len(signals_cleared)} signals for emergency vehicle",
        "signals_cleared": signals_cleared,
        "vehicle_type": request.vehicle_type
    }

@router.get("/emergency/routes/active")
async def get_active_corridors(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active emergency corridors (alias for active routes)"""
    return await get_active_routes(current_user, db)


