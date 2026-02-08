"""
Test Super Admin Login
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db import models
from app.core.security import verify_password, get_password_hash

def test_admin_login():
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(models.User).filter(models.User.email == 'admin@urbanflow.gov').first()
        
        if not admin:
            print("[ERROR] Admin user not found in database!")
            print("[INFO] Run: python scripts/init_db_mumbai.py to create users")
            return False
        
        print(f"[OK] Admin user found:")
        print(f"  Email: {admin.email}")
        print(f"  Name: {admin.name}")
        print(f"  Role: {admin.role}")
        print(f"  Has password hash: {admin.hashed_password is not None}")
        
        # Test password
        test_password = "Admin@2024"
        print(f"\n[TEST] Testing password: {test_password}")
        
        if not admin.hashed_password:
            print("[ERROR] Admin has no password hash!")
            print("[FIX] Regenerating password hash...")
            admin.hashed_password = get_password_hash(test_password)
            db.commit()
            print("[OK] Password hash regenerated")
        
        # Verify password
        is_valid = verify_password(test_password, admin.hashed_password)
        
        if is_valid:
            print("[OK] Password verification: SUCCESS")
            return True
        else:
            print("[ERROR] Password verification: FAILED")
            print("[FIX] Regenerating password hash...")
            admin.hashed_password = get_password_hash(test_password)
            db.commit()
            print("[OK] Password hash regenerated - try login again")
            return False
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_admin_login()
    if success:
        print("\n[SUCCESS] Super Admin login should work!")
    else:
        print("\n[FIX] Run this script again after fixing the password")



