"""
Update database with Mumbai data (without deleting)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.db import models
from app.core.security import get_password_hash
from scripts.mumbai_data import MUMBAI_ZONES, MUMBAI_SIGNALS
from sqlalchemy import text

def update_database():
    """Update database with Mumbai data"""
    db = SessionLocal()
    try:
        # Clear existing zones and signals (keep users)
        print("[INFO] Clearing existing zones and signals...")
        db.query(models.Signal).delete()
        db.query(models.Zone).delete()
        db.commit()
        print("[OK] Cleared existing data")
        
        # Create Mumbai zones using raw SQL to handle old schema
        zones = []
        import uuid
        for zone_data in MUMBAI_ZONES:
            lat = zone_data["latitude"]
            lon = zone_data["longitude"]
            zone_id = str(uuid.uuid4())
            
            # Insert using raw SQL to handle all columns
            db.execute(
                text("""INSERT INTO zones (id, name, city, latitude, longitude, pincode, pincodes, 
                   north_bound, south_bound, east_bound, west_bound, created_at)
                   VALUES (:id, :name, :city, :lat, :lon, :pincode, :pincodes, 
                   :north, :south, :east, :west, datetime('now'))"""),
                {
                    "id": zone_id,
                    "name": zone_data["name"],
                    "city": zone_data["city"],
                    "lat": lat,
                    "lon": lon,
                    "pincode": zone_data["pincodes"][0] if zone_data["pincodes"] else None,
                    "pincodes": ",".join(zone_data["pincodes"]) if zone_data["pincodes"] else None,
                    "north": lat + 0.05,
                    "south": lat - 0.05,
                    "east": lon + 0.05,
                    "west": lon - 0.05,
                }
            )
            
            # Fetch the created zone
            zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
            zones.append(zone)
        
        db.commit()
        print(f"[OK] Created {len(zones)} Mumbai zones")
        
        # Update operator zone assignments
        operators = db.query(models.User).filter(models.User.role == models.UserRole.OPERATOR).all()
        for idx, operator in enumerate(operators[:4]):  # Update first 4 operators
            if idx < len(zones):
                operator.zone_id = zones[idx].id
                print(f"[OK] Assigned {operator.name} to {zones[idx].name}")
        
        db.commit()
        
        # Create signals using raw SQL to handle name column
        import uuid
        
        for signal_data in MUMBAI_SIGNALS:
            zone = next((z for z in zones if z.name == signal_data["zone"]), zones[0] if zones else None)
            signal_id = str(uuid.uuid4())
            
            # Insert using raw SQL to handle name column
            db.execute(
                text("""INSERT INTO signals (id, signal_id, zone_id, latitude, longitude, status, 
                     current_phase, green_time, yellow_time, red_time, mode, name, created_at)
                     VALUES (:id, :signal_id, :zone_id, :lat, :lon, :status, :phase, 
                     :green, :yellow, :red, :mode, :name, datetime('now'))"""),
                {
                    "id": signal_id,
                    "signal_id": signal_data["signal_id"],
                    "zone_id": zone.id if zone else zones[0].id if zones else None,
                    "lat": signal_data["lat"],
                    "lon": signal_data["lon"],
                    "status": "ACTIVE",
                    "phase": "NORTH",
                    "green": 30,
                    "yellow": 5,
                    "red": 30,
                    "mode": "AUTO",
                    "name": signal_data["signal_id"],  # Use signal_id as name
                }
            )
        
        db.commit()
        print(f"[OK] Created {len(MUMBAI_SIGNALS)} Mumbai traffic signals")
        
        # Summary
        zones_count = db.query(models.Zone).count()
        operators_count = db.query(models.User).filter(models.User.role == models.UserRole.OPERATOR).count()
        signals_count = db.query(models.Signal).count()
        
        print("\n" + "="*60)
        print("[SUCCESS] Database Updated Successfully!")
        print("="*60)
        print(f"Zones: {zones_count}")
        print(f"Operators: {operators_count}")
        print(f"Signals: {signals_count}")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_database()

