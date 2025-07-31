#!/usr/bin/env python3
"""
Script to check users in the database and create a test user
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.models import User
from app.core.security import get_password_hash

def main():
    """Check users and create test user if needed"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables")
            return
            
        # Create engine and session
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("🔍 Checking existing users...")
        users = db.query(User).all()
        
        if users:
            print(f"✅ Found {len(users)} users:")
            for user in users:
                print(f"   - {user.email} ({user.first_name} {user.last_name}) - Status: {user.account_status}")
                print(f"     Password hash: {user.password_hash[:50]}...")
        else:
            print("❌ No users found in database")
            print("🔨 Creating test user...")
            
            # Create test user
            test_user = User(
                email="test@alustudent.com",
                password_hash=get_password_hash("testpassword123"),
                first_name="Test",
                last_name="User"
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            print("✅ Test user created:")
            print(f"   Email: test@alustudent.com")
            print(f"   Password: testpassword123")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
