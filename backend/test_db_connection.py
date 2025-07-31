#!/usr/bin/env python3
"""
Test database connection and check table structure.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine
from sqlalchemy import text

def test_connection():
    """Test database connection and show table info."""
    print("🔍 Testing Database Connection...\n")
    
    try:
        db = SessionLocal()
        
        # Test connection
        result = db.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"✅ Connected to PostgreSQL: {version[:50]}...\n")
        
        # Check tables
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result.fetchall()]
        print(f"📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Check users table structure
        if 'users' in tables:
            print(f"\n👤 Users table structure:")
            result = db.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            """))
            
            for column, data_type in result.fetchall():
                print(f"  - {column}: {data_type}")
        
        # Check categories count
        if 'categories' in tables:
            result = db.execute(text("SELECT COUNT(*) FROM categories"))
            count = result.fetchone()[0]
            print(f"\n📁 Categories table: {count} records")
            
            # Show first few categories
            result = db.execute(text("SELECT id, name FROM categories LIMIT 5"))
            print("  Sample categories:")
            for cat_id, name in result.fetchall():
                print(f"    {cat_id}: {name}")
        
        db.close()
        print(f"\n🎉 Database connection test completed!")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    test_connection()