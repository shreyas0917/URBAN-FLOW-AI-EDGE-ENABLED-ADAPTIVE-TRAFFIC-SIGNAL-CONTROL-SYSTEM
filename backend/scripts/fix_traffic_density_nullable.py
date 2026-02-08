"""
Fix traffic_density column to be nullable or remove NOT NULL constraint
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'urbanflow.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
    # But first, let's check if we can just make traffic_density nullable by default
    # Actually, SQLite doesn't enforce NOT NULL on existing columns if they have defaults
    # The issue is that traffic_density might have been created with NOT NULL
    
    # Check current schema
    cursor.execute("PRAGMA table_info(traffic_logs)")
    columns = cursor.fetchall()
    print("[INFO] Current schema:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}) - NOT NULL: {col[3]}, Default: {col[4]}")
    
    # Since SQLite doesn't support ALTER COLUMN, we have two options:
    # 1. Drop the traffic_density column if we're using density
    # 2. Or ensure traffic_density gets populated
    
    # Let's check if traffic_density has data
    cursor.execute("SELECT COUNT(*) FROM traffic_logs WHERE traffic_density IS NOT NULL")
    count_with_traffic_density = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM traffic_logs")
    total_count = cursor.fetchone()[0]
    
    print(f"\n[INFO] Records with traffic_density: {count_with_traffic_density}/{total_count}")
    
    # Option: Drop traffic_density column since we're using density
    # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    # But this is risky. Instead, let's just ensure we populate traffic_density too
    
    # Actually, the best solution is to update existing records to have traffic_density = density
    if total_count > 0:
        print("[INFO] Updating existing records: setting traffic_density = density where density exists")
        cursor.execute("""
            UPDATE traffic_logs 
            SET traffic_density = density 
            WHERE density IS NOT NULL AND traffic_density IS NULL
        """)
        updated = cursor.rowcount
        conn.commit()
        print(f"[OK] Updated {updated} records")
    
    # For new inserts, we need to ensure traffic_density is populated
    # But actually, the model should handle this. Let me check if we can make it nullable
    
    # Since SQLite doesn't support ALTER COLUMN, the best approach is:
    # 1. Keep both columns
    # 2. Update the model to populate traffic_density when density is set
    # OR
    # 3. Recreate the table without NOT NULL on traffic_density
    
    # For now, let's add a trigger or update the model to populate traffic_density
    # Actually, the simplest fix is to update the model to also set traffic_density
    
    print("\n[INFO] Schema check complete")
    print("[NOTE] The model should populate both 'density' and 'traffic_density' columns")
    print("[NOTE] Or we can drop 'traffic_density' and use only 'density'")
    
    conn.close()
    print("[SUCCESS] Database check complete")
    
except Exception as e:
    print(f"[ERROR] Failed: {e}")
    import traceback
    traceback.print_exc()



