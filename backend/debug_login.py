#!/usr/bin/env python3
"""
Debug script to test login functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import verify_password

def debug_login(email: str, password: str):
    """Debug login process step by step"""
    db = SessionLocal()
    
    try:
        print(f"🔍 Searching for user with email: {email}")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("❌ User not found in database")
            return False
        
        print(f"✅ User found: {user.first_name} {user.last_name}")
        print(f"📧 Email: {user.email}")
        print(f"🏷️  Account Status: {user.account_status}")
        print(f"🔒 Password hash: {user.password_hash[:20]}...")
        
        if user.account_status.value != "active":
            print(f"❌ Account is not active (status: {user.account_status})")
            return False
        
        print(f"🔐 Testing password verification...")
        password_valid = verify_password(password, user.password_hash)
        
        if password_valid:
            print("✅ Password is correct!")
            return True
        else:
            print("❌ Password is incorrect!")
            return False
            
    except Exception as e:
        print(f"💥 Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Test with common credentials
    test_credentials = [
        ("admin@example.com", "admin123"),
        ("test@example.com", "password"),
        ("user@example.com", "user123"),
        ("student@alu.edu", "password123"),
        ("m.bela@alustudent.com", "password123"),  # Actual user from database
    ]
    
    print("🚀 Testing login credentials...\n")
    
    for email, password in test_credentials:
        print(f"Testing: {email} / {password}")
        result = debug_login(email, password)
        print(f"Result: {'SUCCESS' if result else 'FAILED'}")
        print("-" * 50)
