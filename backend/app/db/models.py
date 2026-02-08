from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    OPERATOR = "operator"
    VIEWER = "viewer"

class SignalStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"

class SignalPhase(str, enum.Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"

class ControlMode(str, enum.Enum):
    AUTO = "auto"
    SEMI_AUTO = "semi_auto"
    MANUAL = "manual"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.VIEWER)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    zone = relationship("Zone", back_populates="operators")

class Zone(Base):
    __tablename__ = "zones"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pincode = Column(String, nullable=True)  # Primary pincode for the zone
    pincodes = Column(String, nullable=True)  # Comma-separated list of pincodes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    operators = relationship("User", back_populates="zone")
    signals = relationship("Signal", back_populates="zone")

class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, unique=True, index=True, nullable=False)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(SQLEnum(SignalStatus), nullable=False, default=SignalStatus.ACTIVE)
    current_phase = Column(SQLEnum(SignalPhase), nullable=False, default=SignalPhase.NORTH)
    green_time = Column(Integer, default=30)
    yellow_time = Column(Integer, default=5)
    red_time = Column(Integer, default=30)
    mode = Column(SQLEnum(ControlMode), nullable=False, default=ControlMode.AUTO)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    zone = relationship("Zone", back_populates="signals")
    traffic_logs = relationship("TrafficLog", back_populates="signal")
    ai_explanations = relationship("AIExplanation", back_populates="signal")

class TrafficLog(Base):
    __tablename__ = "traffic_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, ForeignKey("signals.id"), nullable=False)
    vehicle_count = Column(Integer, default=0)
    pedestrian_count = Column(Integer, default=0)
    queue_length = Column(Integer, default=0)
    density = Column(Float, default=0.0)  # Traffic density (0.0 to 1.0)
    traffic_density = Column(Float, default=0.0)  # Legacy column (NOT NULL), synced with density
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    signal = relationship("Signal", back_populates="traffic_logs")
    
    def __init__(self, **kwargs):
        # Sync traffic_density with density if density is set but traffic_density is not
        if 'density' in kwargs and 'traffic_density' not in kwargs:
            kwargs['traffic_density'] = kwargs.get('density', 0.0)
        super().__init__(**kwargs)
        # Ensure traffic_density is set even after init
        if self.density is not None and self.traffic_density is None:
            self.traffic_density = self.density

class AIExplanation(Base):
    __tablename__ = "ai_explanations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, ForeignKey("signals.id"), nullable=False)
    decision = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    factors = Column(String, nullable=True)  # JSON string
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    signal = relationship("Signal", back_populates="ai_explanations")

class EmergencyRoute(Base):
    __tablename__ = "emergency_routes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    end_latitude = Column(Float, nullable=False)
    end_longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


