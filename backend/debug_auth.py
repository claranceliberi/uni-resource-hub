#!/usr/bin/env python3
"""Debug authentication issues"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import get_db_session
from app.db.models import User
from app.core.security import verify_password, get_password_hash

def check_user_and_password():
    """Check if user exists and test password verification"""
    db = get_db_session()
    
    try:
        # Check if user exists
        email = "m.bela@alustudent.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"✅ User found: {user.first_name} {user.last_name}")
            print(f"📧 Email: {user.email}")
            print(f"🆔 User ID: {user.id}")
            print(f"🔒 Password hash: {user.password_hash[:50]}...")
            
            # Test password verification with common passwords
            test_passwords = ["password", "Password123", "password123", "test123", "admin123"]
            
            print("\n🔍 Testing common passwords:")
            for password in test_passwords:
                if verify_password(password, user.password_hash):
                    print(f"✅ Password '{password}' works!")
                    return password
                else:
                    print(f"❌ Password '{password}' doesn't work")
            
            print("\n❓ None of the common passwords worked.")
            print("💡 Try creating a new password for this user or create a new test user.")
            
        else:
            print(f"❌ No user found with email: {email}")
            print("💡 You need to create an account first using the signup form.")
            
            # List all users
            all_users = db.query(User).all()
            if all_users:
                print(f"\n📋 Found {len(all_users)} users in database:")
                for u in all_users:
                    print(f"  - {u.email} ({u.first_name} {u.last_name})")
            else:
                print("\n📋 No users found in database.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

def create_test_user():
    """Create a test user with known password"""
    db = get_db_session()
    
    try:
        email = "test@alustudent.com"
        password = "TestPassword123"
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"⚠️  Test user {email} already exists")
            return
        
        # Create new test user
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            password_hash=hashed_password,
            first_name="Test",
            last_name="User"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ Created test user:")
        print(f"📧 Email: {email}")
        print(f"🔒 Password: {password}")
        print(f"💡 You can now login with these credentials!")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔍 Debugging Authentication Issues\n")
    
    print("1. Checking existing user...")
    check_user_and_password()
    
    print("\n" + "="*50)
    print("2. Creating test user...")
    create_test_user()
