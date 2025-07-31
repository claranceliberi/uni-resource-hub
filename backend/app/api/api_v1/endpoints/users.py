"""
Users API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import User, Resource, Bookmark
from app.schemas import (
    User as UserSchema,
    UserUpdate
)
from app.db.models import AccountStatus
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's profile.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_current_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user's profile.
    
    Args:
        user_update: User update data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Updated user profile
    """
    # Check if new email conflicts with existing user
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update fields
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    
    if user_update.email is not None:
        current_user.email = user_update.email
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/me/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Change current user's password.
    
    Args:
        current_password: Current password
        new_password: New password
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    # Verify current password
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(new_password)
    
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/me/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's statistics.
    
    Args:
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        User statistics
    """
    # Count user's uploaded resources
    uploaded_resources = db.query(func.count(Resource.id)).filter(
        Resource.uploader_id == current_user.id
    ).scalar()
    
    # Count user's bookmarks
    bookmarks_count = db.query(func.count(Bookmark.id)).filter(
        Bookmark.user_id == current_user.id
    ).scalar()
    
    # Count file vs link resources
    from app.db.models import ResourceType
    
    file_resources = db.query(func.count(Resource.id)).filter(
        Resource.uploader_id == current_user.id,
        Resource.resource_type == ResourceType.FILE
    ).scalar()
    
    link_resources = db.query(func.count(Resource.id)).filter(
        Resource.uploader_id == current_user.id,
        Resource.resource_type == ResourceType.LINK
    ).scalar()
    
    return {
        "uploaded_resources": uploaded_resources,
        "bookmarks": bookmarks_count,
        "file_resources": file_resources,
        "link_resources": link_resources,
        "account_created": current_user.created_at
    }

@router.get("/me/resources")
async def get_user_resources(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's uploaded resources.
    
    Args:
        limit: Maximum number of resources to return
        offset: Number of resources to skip
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        User's uploaded resources
    """
    resources = db.query(Resource).filter(
        Resource.uploader_id == current_user.id
    ).order_by(Resource.created_at.desc()).offset(offset).limit(limit).all()
    
    total = db.query(func.count(Resource.id)).filter(
        Resource.uploader_id == current_user.id
    ).scalar()
    
    return {
        "resources": resources,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total
    }

@router.get("/me/recent-activity")
async def get_user_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's recent activity.
    
    Args:
        limit: Maximum number of activities to return
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Recent activity
    """
    # Get recent uploads
    recent_uploads = db.query(Resource).filter(
        Resource.uploader_id == current_user.id
    ).order_by(Resource.created_at.desc()).limit(limit // 2).all()
    
    # Get recent bookmarks
    recent_bookmarks = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id
    ).order_by(Bookmark.bookmark_date.desc()).limit(limit // 2).all()
    
    # Format activity
    activities = []
    
    for resource in recent_uploads:
        activities.append({
            "type": "upload",
            "action": f"Uploaded '{resource.title}'",
            "timestamp": resource.created_at,
            "resource_id": resource.id
        })
    
    for bookmark in recent_bookmarks:
        activities.append({
            "type": "bookmark",
            "action": f"Bookmarked '{bookmark.resource.title}'",
            "timestamp": bookmark.bookmark_date,
            "resource_id": bookmark.resource_id
        })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "activities": activities[:limit]
    }