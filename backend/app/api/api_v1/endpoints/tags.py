"""
Tags API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Tag, User, Resource, resource_tags
from app.schemas import Tag as TagSchema
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[TagSchema])
async def list_tags(
    search: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all tags with optional search.
    
    Args:
        search: Optional search query for tag names
        limit: Maximum number of tags to return
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of tags
    """
    query = db.query(Tag)
    
    if search:
        query = query.filter(Tag.name.ilike(f"%{search}%"))
    
    tags = query.order_by(Tag.name).limit(limit).all()
    return tags

@router.post("/", response_model=TagSchema)
async def create_tag(
    tag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new tag.
    
    Args:
        tag_name: Tag name
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created tag
    """
    # Normalize tag name (lowercase, strip whitespace)
    normalized_name = tag_name.strip().lower()
    
    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag name cannot be empty"
        )
    
    # Check if tag already exists
    existing_tag = db.query(Tag).filter(Tag.name == normalized_name).first()
    if existing_tag:
        return existing_tag  # Return existing tag instead of error
    
    # Create new tag
    db_tag = Tag(name=normalized_name)
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag

@router.get("/{tag_id}", response_model=TagSchema)
async def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a tag by ID.
    
    Args:
        tag_id: Tag ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Tag
    """
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    return tag

@router.put("/{tag_id}", response_model=TagSchema)
async def update_tag(
    tag_id: int,
    tag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a tag.
    
    Args:
        tag_id: Tag ID
        tag_name: New tag name
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Updated tag
    """
    # Get tag
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Normalize new tag name
    normalized_name = tag_name.strip().lower()
    
    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag name cannot be empty"
        )
    
    # Check if new name conflicts with existing tag
    if normalized_name != db_tag.name:
        existing_tag = db.query(Tag).filter(
            Tag.name == normalized_name,
            Tag.id != tag_id
        ).first()
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this name already exists"
            )
    
    # Update tag name
    db_tag.name = normalized_name
    
    db.commit()
    db.refresh(db_tag)
    
    return db_tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a tag.
    
    Args:
        tag_id: Tag ID
        db: Database session
        current_user: Current authenticated user
    """
    # Get tag
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check if tag is used by any resources
    resource_count = db.query(func.count(resource_tags.c.resource_id)).filter(
        resource_tags.c.tag_id == tag_id
    ).scalar()
    
    if resource_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete tag used by {resource_count} resources. Please remove the tag from resources first."
        )
    
    # Delete tag
    db.delete(db_tag)
    db.commit()

@router.get("/{tag_id}/resources")
async def get_tag_resources(
    tag_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get resources with a specific tag.
    
    Args:
        tag_id: Tag ID
        limit: Maximum number of resources to return
        offset: Number of resources to skip
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of resources with the tag
    """
    # Check if tag exists
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Get resources with this tag
    resources = db.query(Resource).join(resource_tags).filter(
        resource_tags.c.tag_id == tag_id
    ).offset(offset).limit(limit).all()
    
    # Get total count
    total = db.query(func.count(Resource.id)).join(resource_tags).filter(
        resource_tags.c.tag_id == tag_id
    ).scalar()
    
    return {
        "resources": resources,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total
    }

@router.post("/bulk", response_model=List[TagSchema])
async def create_tags_bulk(
    tag_names: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create multiple tags at once.
    
    Args:
        tag_names: List of tag names
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of created/existing tags
    """
    # Normalize tag names
    normalized_names = [name.strip().lower() for name in tag_names if name.strip()]
    
    if not normalized_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid tag name is required"
        )
    
    # Get existing tags
    existing_tags = db.query(Tag).filter(Tag.name.in_(normalized_names)).all()
    existing_names = {tag.name for tag in existing_tags}
    
    # Create new tags
    new_names = set(normalized_names) - existing_names
    new_tags = [Tag(name=name) for name in new_names]
    
    if new_tags:
        db.add_all(new_tags)
        db.commit()
        for tag in new_tags:
            db.refresh(tag)
    
    # Return all tags (existing + new)
    all_tags = existing_tags + new_tags
    return all_tags