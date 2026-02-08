"""
Reset database and initialize with Mumbai data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3
from app.db.database import engine, SessionLocal
from app.db import models
from app.core.security import get_password_hash
from scripts.mumbai_data import MUMBAI_ZONES, MUMBAI_ROADS, MUMBAI_SIGNALS

def reset_and_init():
    """Reset database and initialize with Mumbai data"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'urbanflow.db')
    
    # Delete existing database
    if os.path.exists(db_path):
        print("[INFO] Deleting existing database...")
        os.remove(db_path)
        print("[OK] Database deleted")
    
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created")
    
    db = SessionLocal()
    try:
        # Create Mumbai zones
        zones = []
        for zone_data in MUMBAI_ZONES:
            zone = models.Zone(
                name=zone_data["name"],
                city=zone_data["city"],
                latitude=zone_data["latitude"],
                longitude=zone_data["longitude"],
                pincode=zone_data["pincodes"][0] if zone_data["pincodes"] else None,
                pincodes=",".join(zone_data["pincodes"]) if zone_data["pincodes"] else None,
            )
            db.add(zone)
            zones.append(zone)
        
        db.commit()
        print(f"[OK] Created {len(zones)} Mumbai zones")
        
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
                "name": "South Mumbai Operator",
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
        for signal_data in MUMBAI_SIGNALS:
            zone = next((z for z in zones if z.name == signal_data["zone"]), zones[0] if zones else None)
            
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
        print(f"[OK] Created {len(MUMBAI_SIGNALS)} Mumbai traffic signals")
        
        print("\n" + "="*60)
        print("[SUCCESS] Mumbai Database Initialized Successfully!")
        print("="*60)
        print(f"\nZones: {len(zones)}")
        for zone in zones:
            print(f"  - {zone.name} ({zone.city}) - Pincodes: {zone.pincodes or 'N/A'}")
        print(f"\nUsers: {len(users_data)}")
        print(f"  - Super Admin: admin@urbanflow.gov")
        print(f"  - Operators: operator1-4@urbanflow.gov")
        print(f"  - Viewer: viewer@urbanflow.gov")
        print(f"\nSignals: {len(MUMBAI_SIGNALS)}")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_init()



