#!/usr/bin/env python3
"""
Test specific login credentials
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.models import User
from app.core.security import verify_password

def test_login(email, password):
    """Test login with specific credentials"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print(f"🔍 Testing login for: {email}")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("❌ User not found")
            return False
            
        print(f"✅ User found: {user.first_name} {user.last_name}")
        print(f"📧 Email: {user.email}")
        print(f"🏷️  Status: {user.account_status}")
        
        if str(user.account_status) != "AccountStatus.ACTIVE":
            print(f"❌ Account not active: {user.account_status}")
            return False
            
        print(f"🔐 Testing password...")
        is_valid = verify_password(password, user.password_hash)
        
        if is_valid:
            print("✅ Password is CORRECT!")
            return True
        else:
            print("❌ Password is INCORRECT!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Test with the actual user in database
    print("Testing with database user...")
    test_login("m.bela@alustudent.com", "password123")
    print()
    test_login("m.bela@alustudent.com", "testpassword")
    print()
    test_login("m.bela@alustudent.com", "admin123")
