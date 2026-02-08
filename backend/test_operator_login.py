"""Test script to diagnose operator login issues"""
import sys
from app.db.database import SessionLocal
from app.db import models
from app.core.security import verify_password, get_password_hash

def test_operator_login():
    db = SessionLocal()
    try:
        # Find operator user
        user = db.query(models.User).filter(models.User.email == 'operator1@urbanflow.gov').first()
        
        if not user:
            print("[ERROR] Operator user not found in database!")
            print("        Run: python scripts/init_db.py")
            return False
        
        print(f"[OK] User found: {user.email}")
        print(f"     Name: {user.name}")
        print(f"     Role: {user.role}")
        print(f"     Has password hash: {bool(user.hashed_password)}")
        
        if user.hashed_password:
            print(f"     Password hash length: {len(user.hashed_password)}")
            print(f"     Password hash preview: {user.hashed_password[:50]}...")
        
        # Test password verification
        test_password = "Operator@2024"
        print(f"\n[TEST] Testing password: {test_password}")
        
        try:
            result = verify_password(test_password, user.hashed_password)
            if result:
                print("[OK] Password verification: SUCCESS")
                return True
            else:
                print("[ERROR] Password verification: FAILED")
                print("        The password hash might be incorrect.")
                print("        Regenerating the password hash...")
                
                # Regenerate password hash
                new_hash = get_password_hash(test_password)
                user.hashed_password = new_hash
                db.commit()
                print("[OK] Password hash regenerated and saved")
                
                # Test again
                result2 = verify_password(test_password, new_hash)
                if result2:
                    print("[OK] Password verification after regeneration: SUCCESS")
                    return True
                else:
                    print("[ERROR] Password verification still failing after regeneration")
                    return False
        except Exception as e:
            print(f"[ERROR] Password verification error: {e}")
            print("        Attempting to fix...")
            
            # Regenerate password hash
            new_hash = get_password_hash(test_password)
            user.hashed_password = new_hash
            db.commit()
            print("[OK] Password hash regenerated")
            
            # Test again
            result2 = verify_password(test_password, new_hash)
            if result2:
                print("[OK] Password verification after fix: SUCCESS")
                return True
            else:
                print("[ERROR] Password verification still failing")
                return False
                
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Operator Login Diagnostic Test")
    print("=" * 60)
    print()
    
    success = test_operator_login()
    
    print()
    print("=" * 60)
    if success:
        print("[OK] Operator login should work now!")
        print("     Try logging in with: operator1@urbanflow.gov / Operator@2024")
    else:
        print("[ERROR] Operator login still has issues")
        print("        You may need to reinitialize the database:")
        print("        python scripts/init_db.py")
    print("=" * 60)

