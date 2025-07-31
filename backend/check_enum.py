#!/usr/bin/env python3
"""
Check the actual enum values in the database.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from sqlalchemy import text

def check_enums():
    """Check enum values in database."""
    print("🔍 Checking Database Enum Values...\n")
    
    try:
        db = SessionLocal()
        
        # Check all enum types
        result = db.execute(text("""
            SELECT t.typname, e.enumlabel 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            ORDER BY t.typname, e.enumsortorder
        """))
        
        enums = {}
        for type_name, enum_value in result.fetchall():
            if type_name not in enums:
                enums[type_name] = []
            enums[type_name].append(enum_value)
        
        print("📋 Found enum types:")
        for enum_name, values in enums.items():
            print(f"  {enum_name}: {values}")
        
        # Check resources table structure
        result = db.execute(text("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'resources'
            ORDER BY ordinal_position
        """))
        
        print(f"\n📊 Resources table structure:")
        for column, data_type, udt_name in result.fetchall():
            print(f"  - {column}: {data_type} ({udt_name})")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_enums()