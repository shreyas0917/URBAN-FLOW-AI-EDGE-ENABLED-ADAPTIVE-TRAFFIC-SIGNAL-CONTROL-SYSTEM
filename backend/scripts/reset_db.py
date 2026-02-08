"""
Reset Database - Delete and Reinitialize
Use this to reset the database with Mumbai data
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'urbanflow.db')

if os.path.exists(db_path):
    os.remove(db_path)
    print(f"[OK] Deleted existing database: {db_path}")

# Now run the Mumbai initialization
from scripts.init_db_mumbai import init_database
init_database()



