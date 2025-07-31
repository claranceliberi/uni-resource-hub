#!/usr/bin/env python3
"""
Test script to verify database connection with Prisma Postgres
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def test_database_connection():
    """Test the database connection"""
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables")
            return False
            
        print(f"🔗 Connecting to database...")
        print(f"   URL: {database_url[:50]}...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Database connection successful!")
            print(f"   PostgreSQL version: {version}")
            
            # Test if we can create a table (will be rolled back)
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    message TEXT
                )
            """))
            print("✅ Table creation test successful!")
            
            # Clean up test table
            connection.execute(text("DROP TABLE IF EXISTS test_connection"))
            connection.commit()
            
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing UniResource Hub Database Connection")
    print("=" * 50)
    
    success = test_database_connection()
    
    if success:
        print("\n🎉 Database is ready for the UniResource Hub!")
        print("   You can now start the FastAPI server.")
    else:
        print("\n💥 Database connection failed!")
        print("   Please check your connection string and try again.")
        sys.exit(1)
