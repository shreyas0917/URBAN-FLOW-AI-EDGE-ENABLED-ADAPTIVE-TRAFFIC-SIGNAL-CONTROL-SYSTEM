"""Fix all user passwords in the database"""
import sys
from app.db.database import SessionLocal
from app.db import models
from app.core.security import verify_password, get_password_hash

def fix_all_passwords():
    db = SessionLocal()
    try:
        # Define correct passwords
        passwords = {
            "admin@urbanflow.gov": "Admin@2024",
            "operator1@urbanflow.gov": "Operator@2024",
            "operator2@urbanflow.gov": "Operator@2024",
            "viewer@urbanflow.gov": "Viewer@2024",
        }
        
        fixed_count = 0
        verified_count = 0
        
        for email, password in passwords.items():
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                print(f"[SKIP] User not found: {email}")
                continue
            
            # Test current password
            if verify_password(password, user.hashed_password):
                print(f"[OK] Password verified for: {email}")
                verified_count += 1
            else:
                # Regenerate password hash
                print(f"[FIX] Regenerating password hash for: {email}")
                user.hashed_password = get_password_hash(password)
                fixed_count += 1
                
                # Verify the new hash
                if verify_password(password, user.hashed_password):
                    print(f"[OK] Password hash regenerated and verified for: {email}")
                    verified_count += 1
                else:
                    print(f"[ERROR] Password verification failed after regeneration for: {email}")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"Summary:")
        print(f"  Fixed: {fixed_count} users")
        print(f"  Verified: {verified_count} users")
        print("=" * 60)
        
        return fixed_count > 0 or verified_count == len(passwords)
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Fix All User Passwords")
    print("=" * 60)
    print()
    
    success = fix_all_passwords()
    
    if success:
        print("\n[OK] All passwords have been fixed!")
        print("     You can now login with:")
        print("     - admin@urbanflow.gov / Admin@2024")
        print("     - operator1@urbanflow.gov / Operator@2024")
        print("     - operator2@urbanflow.gov / Operator@2024")
        print("     - viewer@urbanflow.gov / Viewer@2024")
    else:
        print("\n[ERROR] Some passwords could not be fixed")

