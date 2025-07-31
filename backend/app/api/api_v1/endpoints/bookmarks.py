"""
Bookmarks API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Bookmark, User, Resource
from app.schemas import (
    Bookmark as BookmarkSchema,
    BookmarkCreate
)
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[BookmarkSchema])
async def list_bookmarks(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List user's bookmarks.
    
    Args:
        limit: Maximum number of bookmarks to return
        offset: Number of bookmarks to skip
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of user's bookmarks
    """
    bookmarks = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id
    ).order_by(Bookmark.bookmark_date.desc()).offset(offset).limit(limit).all()
    
    return bookmarks

@router.post("/", response_model=BookmarkSchema)
async def create_bookmark(
    bookmark: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new bookmark.
    
    Args:
        bookmark: Bookmark data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created bookmark
    """
    # Check if resource exists
    resource = db.query(Resource).filter(Resource.id == bookmark.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if bookmark already exists
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.resource_id == bookmark.resource_id
    ).first()
    
    if existing_bookmark:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource is already bookmarked"
        )
    
    # Create new bookmark
    db_bookmark = Bookmark(
        user_id=current_user.id,
        resource_id=bookmark.resource_id
    )
    
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    
    return db_bookmark

@router.get("/{bookmark_id}", response_model=BookmarkSchema)
async def get_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a bookmark by ID.
    
    Args:
        bookmark_id: Bookmark ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Bookmark
    """
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    return bookmark

@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a bookmark.
    
    Args:
        bookmark_id: Bookmark ID
        db: Database session
        current_user: Current authenticated user
    """
    # Get bookmark
    db_bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    # Delete bookmark
    db.delete(db_bookmark)
    db.commit()

@router.delete("/resource/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark_by_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a bookmark by resource ID.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
    """
    # Get bookmark
    db_bookmark = db.query(Bookmark).filter(
        Bookmark.resource_id == resource_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    # Delete bookmark
    db.delete(db_bookmark)
    db.commit()

@router.get("/check/{resource_id}")
async def check_bookmark(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if a resource is bookmarked by the current user.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Bookmark status
    """
    bookmark = db.query(Bookmark).filter(
        Bookmark.resource_id == resource_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    return {
        "bookmarked": bookmark is not None,
        "bookmark_id": bookmark.id if bookmark else None
    }

@router.post("/toggle/{resource_id}")
async def toggle_bookmark(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Toggle bookmark status for a resource.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Bookmark status and action taken
    """
    # Check if resource exists
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if bookmark exists
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.resource_id == resource_id
    ).first()
    
    if existing_bookmark:
        # Remove bookmark
        db.delete(existing_bookmark)
        db.commit()
        return {
            "bookmarked": False,
            "action": "removed",
            "message": "Bookmark removed"
        }
    else:
        # Add bookmark
        new_bookmark = Bookmark(
            user_id=current_user.id,
            resource_id=resource_id
        )
        db.add(new_bookmark)
        db.commit()
        db.refresh(new_bookmark)
        
        return {
            "bookmarked": True,
            "action": "added",
            "bookmark_id": new_bookmark.id,
            "message": "Bookmark added"
        }

@router.get("/stats")
async def get_bookmark_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bookmark statistics for the current user.
    
    Args:
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Bookmark statistics
    """
    total_bookmarks = db.query(func.count(Bookmark.id)).filter(
        Bookmark.user_id == current_user.id
    ).scalar()
    
    # Get bookmarks by resource type
    file_bookmarks = db.query(func.count(Bookmark.id)).join(Resource).filter(
        Bookmark.user_id == current_user.id,
        Resource.resource_type == "file"
    ).scalar()
    
    link_bookmarks = db.query(func.count(Bookmark.id)).join(Resource).filter(
        Bookmark.user_id == current_user.id,
        Resource.resource_type == "link"
    ).scalar()
    
    return {
        "total_bookmarks": total_bookmarks,
        "file_bookmarks": file_bookmarks,
        "link_bookmarks": link_bookmarks
    }