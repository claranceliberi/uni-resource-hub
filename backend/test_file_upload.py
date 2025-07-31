#!/usr/bin/env python3
"""
Test script for file upload functionality.
"""
import sys
import os
import requests
import json
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_file_upload(email: str, password: str, file_path: str):
    """
    Test file upload functionality.
    
    Args:
        email: User email
        password: User password
        file_path: Path to file to upload
    """
    base_url = "http://localhost:8000/api/v1"
    
    # Step 1: Login to get token
    print(f"🔑 Logging in as {email}...")
    login_data = {
        "username": email,
        "password": password
    }
    
    login_response = requests.post(
        f"{base_url}/auth/token",
        data=login_data
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print("✅ Login successful!")
    
    # Step 2: Upload file
    print(f"📤 Uploading file: {file_path}...")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    # Prepare file upload
    file_name = os.path.basename(file_path)
    
    with open(file_path, "rb") as f:
        files = {"file": (file_name, f)}
        data = {
            "title": f"Test upload: {file_name}",
            "description": "This is a test file upload",
            "category_ids": "[]",
            "tag_names": json.dumps(["test", "upload"])
        }
        
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        upload_response = requests.post(
            f"{base_url}/resources/upload",
            files=files,
            data=data,
            headers=headers
        )
    
    if upload_response.status_code != 200:
        print(f"❌ Upload failed: {upload_response.text}")
        return
    
    resource = upload_response.json()
    print(f"✅ Upload successful! Resource ID: {resource['id']}")
    print(f"📄 Title: {resource['title']}")
    print(f"📄 Description: {resource['description']}")
    print(f"📄 File path: {resource['file_path']}")
    print(f"📄 File size: {resource['file_size']} bytes")
    print(f"📄 MIME type: {resource['mime_type']}")
    
    # Step 3: List resources
    print("\n📋 Listing resources...")
    
    list_response = requests.get(
        f"{base_url}/resources",
        headers=headers
    )
    
    if list_response.status_code != 200:
        print(f"❌ List failed: {list_response.text}")
        return
    
    resources = list_response.json()
    print(f"✅ Found {resources['total']} resources")
    
    # Print first resource
    if resources["resources"]:
        first = resources["resources"][0]
        print(f"📄 First resource: {first['title']} (ID: {first['id']})")

if __name__ == "__main__":
    # Create a test file if it doesn't exist
    test_file = "test_upload.txt"
    if not os.path.exists(test_file):
        with open(test_file, "w") as f:
            f.write("This is a test file for upload testing.")
    
    # Test with the user we know exists
    test_file_upload(
        email="m.bela@alustudent.com",
        password="password123",
        file_path=test_file
    )