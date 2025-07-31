#!/usr/bin/env python3
"""
Reset password for existing user
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.models import User
from app.core.security import get_password_hash, verify_password

def reset_password(email, new_password):
    """Reset password for a user"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print(f"🔍 Finding user: {email}")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("❌ User not found")
            return False
            
        print(f"✅ User found: {user.first_name} {user.last_name}")
        
        # Generate new password hash
        new_hash = get_password_hash(new_password)
        print(f"🔐 Generating new password hash...")
        
        # Update user password
        user.password_hash = new_hash
        db.commit()
        
        print(f"✅ Password updated successfully!")
        print(f"📧 Email: {email}")
        print(f"🔑 New Password: {new_password}")
        
        # Verify the password works
        print(f"🧪 Testing new password...")
        if verify_password(new_password, user.password_hash):
            print("✅ Password verification successful!")
            return True
        else:
            print("❌ Password verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Reset password for the existing user
    email = "m.bela@alustudent.com"
    new_password = "password123"
    
    print("🔧 Resetting password for existing user...")
    print(f"Email: {email}")
    print(f"New Password: {new_password}")
    print("-" * 50)
    
    success = reset_password(email, new_password)
    
    if success:
        print("\n🎉 SUCCESS! You can now login with:")
        print(f"   Email: {email}")
        print(f"   Password: {new_password}")
    else:
        print("\n❌ FAILED to reset password")
