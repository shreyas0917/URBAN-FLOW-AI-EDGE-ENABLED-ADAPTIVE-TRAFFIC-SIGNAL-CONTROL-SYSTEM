"""
Test Admin Role Return
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db import models

def test_role():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == 'admin@urbanflow.gov').first()
        
        if not admin:
            print("[ERROR] Admin not found")
            return
        
        print(f"Admin role object: {admin.role}")
        print(f"Admin role type: {type(admin.role)}")
        print(f"Has value attr: {hasattr(admin.role, 'value')}")
        
        if hasattr(admin.role, 'value'):
            role_value = admin.role.value
            print(f"Role value: {role_value}")
            print(f"Role value type: {type(role_value)}")
            print(f"Role value lower: {role_value.lower()}")
        else:
            role_str = str(admin.role)
            print(f"Role string: {role_str}")
            if '.' in role_str:
                extracted = role_str.split('.')[-1].lower()
                print(f"Extracted: {extracted}")
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_role()



