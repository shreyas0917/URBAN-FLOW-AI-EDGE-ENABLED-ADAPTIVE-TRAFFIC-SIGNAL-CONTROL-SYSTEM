import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine, SessionLocal
from app.db import models
from app.core.security import get_password_hash

# Use Mumbai-specific data
try:
    from scripts.mumbai_data import MUMBAI_ZONES, MUMBAI_SIGNALS
    USE_MUMBAI_DATA = True
except ImportError:
    from scripts.indian_cities_data import INDIAN_CITIES, TRAFFIC_SIGNALS
    USE_MUMBAI_DATA = False

def init_database():
    """Initialize database with sample data"""
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created")
    
    db = SessionLocal()
    try:
        # Check if users already exist
        existing_users = db.query(models.User).count()
        if existing_users > 0:
            print(f"[INFO] Database already initialized with {existing_users} users")
            return
        
        # Create zones
        zones = []
        if USE_MUMBAI_DATA:
            # Use Mumbai-specific zones with pincodes
            for zone_data in MUMBAI_ZONES:
                zone = models.Zone(
                    name=zone_data["name"],
                    city=zone_data["city"],
                    latitude=zone_data["latitude"],
                    longitude=zone_data["longitude"],
                    pincode=zone_data["pincodes"][0],  # Primary pincode
                    pincodes=",".join(zone_data["pincodes"]),  # All pincodes
                )
                db.add(zone)
                zones.append(zone)
        else:
            # Fallback to original data (Mumbai only)
            for city_data in INDIAN_CITIES:
                for i, zone_name in enumerate(city_data["zones"]):
                    zone = models.Zone(
                        name=zone_name,
                        city=city_data["name"],
                        latitude=city_data["lat"] + (i * 0.05),
                        longitude=city_data["lon"] + (i * 0.05),
                    )
                    db.add(zone)
                    zones.append(zone)
        
        db.commit()
        print(f"[OK] Created {len(zones)} zones")
        
        # Create users
        users_data = [
            {
                "email": "admin@urbanflow.gov",
                "password": "Admin@2024",
                "name": "Super Admin",
                "role": models.UserRole.SUPER_ADMIN,
            },
            {
                "email": "operator1@urbanflow.gov",
                "password": "Operator@2024",
                "name": "John Traffic Operator",
                "role": models.UserRole.OPERATOR,
                "zone_id": zones[0].id if zones else None,
            },
            {
                "email": "operator2@urbanflow.gov",
                "password": "Operator@2024",
                "name": "Central Mumbai Operator",
                "role": models.UserRole.OPERATOR,
                "zone_id": zones[1].id if len(zones) > 1 else None,
            },
            {
                "email": "operator3@urbanflow.gov",
                "password": "Operator@2024",
                "name": "Western Suburbs Operator",
                "role": models.UserRole.OPERATOR,
                "zone_id": zones[2].id if len(zones) > 2 else None,
            },
            {
                "email": "operator4@urbanflow.gov",
                "password": "Operator@2024",
                "name": "North Mumbai Operator",
                "role": models.UserRole.OPERATOR,
                "zone_id": zones[3].id if len(zones) > 3 else None,
            },
            {
                "email": "viewer@urbanflow.gov",
                "password": "Viewer@2024",
                "name": "Traffic Viewer",
                "role": models.UserRole.VIEWER,
            },
        ]
        
        for user_data in users_data:
            user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
            user = models.User(**user_data)
            db.add(user)
        
        db.commit()
        print(f"[OK] Created {len(users_data)} users")
        
        # Create signals
        signal_list = MUMBAI_SIGNALS if USE_MUMBAI_DATA else TRAFFIC_SIGNALS[:15]
        for signal_data in signal_list:
            # Find zone by name (Mumbai) or city (fallback)
            if USE_MUMBAI_DATA:
                zone = next((z for z in zones if z.name == signal_data["zone"]), zones[0] if zones else None)
            else:
                zone = next((z for z in zones if z.city == signal_data["city"]), zones[0] if zones else None)
            
            signal = models.Signal(
                signal_id=signal_data["signal_id"],
                zone_id=zone.id if zone else zones[0].id if zones else None,
                latitude=signal_data["lat"],
                longitude=signal_data["lon"],
                status=models.SignalStatus.ACTIVE,
                current_phase=models.SignalPhase.NORTH,
                green_time=30,
                yellow_time=5,
                red_time=30,
                mode=models.ControlMode.AUTO,
            )
            db.add(signal)
        
        db.commit()
        print(f"[OK] Created 15 traffic signals")
        
        print("\n[SUCCESS] Database initialized successfully!")
        print("\nLogin Credentials:")
        print("  Super Admin: admin@urbanflow.gov / Admin@2024")
        print("  Operator 1: operator1@urbanflow.gov / Operator@2024")
        print("  Operator 2: operator2@urbanflow.gov / Operator@2024")
        print("  Viewer: viewer@urbanflow.gov / Viewer@2024")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to initialize database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()


