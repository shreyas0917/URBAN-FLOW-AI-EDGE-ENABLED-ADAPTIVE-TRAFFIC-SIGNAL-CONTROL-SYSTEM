"""
Fix traffic_logs table schema - ensure density column exists
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
    cursor.execute("PRAGMA table_info(traffic_logs)")
    columns = {row[1]: row[2] for row in cursor.fetchall()}
    print(f"[INFO] Current columns: {list(columns.keys())}")
    
    # If traffic_density exists but density doesn't, we're good (model maps density -> traffic_density)
    # If neither exists, add traffic_density
    if 'traffic_density' not in columns and 'density' not in columns:
        print("[INFO] Adding 'traffic_density' column...")
        cursor.execute("ALTER TABLE traffic_logs ADD COLUMN traffic_density REAL DEFAULT 0.0")
        conn.commit()
        print("[OK] Column 'traffic_density' added")
    elif 'traffic_density' in columns:
        print("[OK] Column 'traffic_density' already exists")
    
    # Remove density column if it exists separately (should use traffic_density)
    if 'density' in columns and 'traffic_density' in columns:
        print("[INFO] Both 'density' and 'traffic_density' exist. Keeping 'traffic_density'.")
        # We'll keep both for now to avoid data loss
    
    # Verify final schema
    cursor.execute("PRAGMA table_info(traffic_logs)")
    final_columns = [row[1] for row in cursor.fetchall()]
    print(f"[OK] Final columns: {final_columns}")
    
    conn.close()
    print("[SUCCESS] Schema check complete")
    
except Exception as e:
    print(f"[ERROR] Failed: {e}")
    import traceback
    traceback.print_exc()



