"""
Add density column to traffic_logs table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'urbanflow.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(traffic_logs)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'density' not in columns:
        print("[INFO] Adding 'density' column to traffic_logs table...")
        cursor.execute("ALTER TABLE traffic_logs ADD COLUMN density REAL DEFAULT 0.0")
        conn.commit()
        print("[OK] Column 'density' added successfully")
    else:
        print("[INFO] Column 'density' already exists")
    
    # Verify
    cursor.execute("PRAGMA table_info(traffic_logs)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"[OK] traffic_logs columns: {columns}")
    
    conn.close()
    print("[SUCCESS] Database schema updated")
    
except Exception as e:
    print(f"[ERROR] Failed to update schema: {e}")
    import traceback
    traceback.print_exc()



