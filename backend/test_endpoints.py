#!/usr/bin/env python3
"""
Test script to verify all backend endpoints are working.
"""
import sys
import os
import requests
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoints():
    """Test all backend endpoints."""
    print("🚀 Testing UniResource Hub Backend Endpoints\n")
    
    # Test 1: Health check
    print("1. Testing health check...")
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running!")
        print("Please start the server with: uvicorn app.main:app --reload")
        return
    
    # Test 2: Login (get token)
    print("\n2. Testing login...")
    login_data = {
        "username": "m.bela@alustudent.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Login successful")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test 3: Get current user
    print("\n3. Testing get current user...")
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print(f"✅ Current user: {user['first_name']} {user['last_name']}")
        else:
            print(f"❌ Get user failed: {response.text}")
    except Exception as e:
        print(f"❌ Get user error: {e}")
    
    # Test 4: List categories
    print("\n4. Testing categories endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/categories", headers=headers)
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Categories endpoint working (found {len(categories)} categories)")
        else:
            print(f"❌ Categories failed: {response.text}")
    except Exception as e:
        print(f"❌ Categories error: {e}")
    
    # Test 5: List tags
    print("\n5. Testing tags endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/tags", headers=headers)
        if response.status_code == 200:
            tags = response.json()
            print(f"✅ Tags endpoint working (found {len(tags)} tags)")
        else:
            print(f"❌ Tags failed: {response.text}")
    except Exception as e:
        print(f"❌ Tags error: {e}")
    
    # Test 6: List resources
    print("\n6. Testing resources endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/resources", headers=headers)
        if response.status_code == 200:
            resources = response.json()
            print(f"✅ Resources endpoint working (found {resources.get('total', 0)} resources)")
        else:
            print(f"❌ Resources failed: {response.text}")
    except Exception as e:
        print(f"❌ Resources error: {e}")
    
    # Test 7: List bookmarks
    print("\n7. Testing bookmarks endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/bookmarks", headers=headers)
        if response.status_code == 200:
            bookmarks = response.json()
            print(f"✅ Bookmarks endpoint working (found {len(bookmarks)} bookmarks)")
        else:
            print(f"❌ Bookmarks failed: {response.text}")
    except Exception as e:
        print(f"❌ Bookmarks error: {e}")
    
    # Test 8: User stats
    print("\n8. Testing user stats...")
    try:
        response = requests.get(f"{BASE_URL}/users/me/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ User stats: {stats['uploaded_resources']} resources, {stats['bookmarks']} bookmarks")
        else:
            print(f"❌ User stats failed: {response.text}")
    except Exception as e:
        print(f"❌ User stats error: {e}")
    
    print("\n🎉 Backend endpoint testing completed!")
    print("\nNext steps:")
    print("1. Start the backend server: uvicorn app.main:app --reload")
    print("2. Test the endpoints with this script")
    print("3. Connect the frontend to these endpoints")

if __name__ == "__main__":
    test_endpoints()