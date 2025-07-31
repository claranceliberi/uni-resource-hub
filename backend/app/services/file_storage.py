"""
File storage service for handling file uploads.
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import BinaryIO, Optional, Tuple

from fastapi import UploadFile

class FileStorageService:
    """
    Service for handling file storage operations.
    
    This is a local file storage implementation. In production, this would be
    replaced with a cloud storage service like AWS S3.
    """
    
    def __init__(self, upload_dir: str = "uploads"):
        """
        Initialize the file storage service.
        
        Args:
            upload_dir: Directory where files will be stored
        """
        self.upload_dir = upload_dir
        self._ensure_upload_dir_exists()
    
    def _ensure_upload_dir_exists(self):
        """Ensure the upload directory exists."""
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate a unique filename to avoid collisions.
        
        Args:
            original_filename: Original filename
            
        Returns:
            Unique filename
        """
        # Get file extension
        ext = os.path.splitext(original_filename)[1].lower()
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        return unique_filename
    
    async def save_file(self, file: UploadFile) -> Tuple[str, int]:
        """
        Save an uploaded file to storage.
        
        Args:
            file: Uploaded file
            
        Returns:
            Tuple of (file_path, file_size)
        """
        # Generate unique filename
        unique_filename = self._generate_unique_filename(file.filename)
        
        # Create full path
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save file
        file_size = 0
        with open(file_path, "wb") as buffer:
            # Read file in chunks to handle large files
            chunk_size = 1024 * 1024  # 1MB chunks
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                buffer.write(chunk)
                file_size += len(chunk)
        
        return file_path, file_size
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if file was deleted, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False
    
    def get_file_path(self, filename: str) -> str:
        """
        Get the full path to a file.
        
        Args:
            filename: Filename
            
        Returns:
            Full path to the file
        """
        return os.path.join(self.upload_dir, filename)


# Create a singleton instance
file_storage = FileStorageService()