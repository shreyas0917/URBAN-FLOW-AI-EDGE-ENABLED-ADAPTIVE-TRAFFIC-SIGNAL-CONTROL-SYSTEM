"""
Fix zones table schema - add city column if missing
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'urbanflow.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(zones)")
    columns = {row[1]: row[2] for row in cursor.fetchall()}
    print(f"[INFO] Current zones columns: {list(columns.keys())}")
    
    # Add missing columns
    missing_columns = {
        'city': "VARCHAR DEFAULT 'Mumbai'",
        'latitude': 'FLOAT DEFAULT 19.0760',
        'longitude': 'FLOAT DEFAULT 72.8777',
        'pincode': 'VARCHAR',
        'pincodes': 'VARCHAR',
    }
    
    for col_name, col_type in missing_columns.items():
        if col_name not in columns:
            print(f"[INFO] Adding '{col_name}' column to zones table...")
            cursor.execute(f"ALTER TABLE zones ADD COLUMN {col_name} {col_type}")
            conn.commit()
            print(f"[OK] Column '{col_name}' added")
        else:
            print(f"[OK] Column '{col_name}' already exists")
    
    # Update existing zones with Mumbai defaults if needed
    cursor.execute("UPDATE zones SET city = 'Mumbai' WHERE city IS NULL OR city = ''")
    cursor.execute("UPDATE zones SET latitude = 19.0760 WHERE latitude IS NULL OR latitude = 0")
    cursor.execute("UPDATE zones SET longitude = 72.8777 WHERE longitude IS NULL OR longitude = 0")
    conn.commit()
    print("[OK] Updated existing zones with default values")
    
    # Verify final schema
    cursor.execute("PRAGMA table_info(zones)")
    final_columns = [row[1] for row in cursor.fetchall()]
    print(f"[OK] Final columns: {final_columns}")
    
    conn.close()
    print("[SUCCESS] Schema check complete")
    
except Exception as e:
    print(f"[ERROR] Failed: {e}")
    import traceback
    traceback.print_exc()

