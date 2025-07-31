"""
Resources API endpoints.
"""
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.db.database import get_db
from app.db.models import Resource, User, Category, Tag, resource_categories, resource_tags
from app.schemas import (
    Resource as ResourceSchema,
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceType,
    ResourceSearch
)
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.services.file_storage import file_storage

router = APIRouter()

@router.get("/", response_model=ResourceResponse)
async def list_resources(
    query: Optional[str] = None,
    category_ids: List[int] = Query(None),
    tag_ids: List[int] = Query(None),
    resource_type: Optional[ResourceType] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List resources with optional filtering.
    
    Args:
        query: Search query for title, description
        category_ids: Filter by category IDs
        tag_ids: Filter by tag IDs
        resource_type: Filter by resource type
        limit: Maximum number of resources to return
        offset: Number of resources to skip
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Paginated list of resources
    """
    # Base query
    resources_query = db.query(Resource)
    
    # Apply search filter if provided
    if query:
        search_filter = or_(
            Resource.title.ilike(f"%{query}%"),
            Resource.description.ilike(f"%{query}%")
        )
        resources_query = resources_query.filter(search_filter)
    
    # Apply category filter if provided
    if category_ids:
        resources_query = resources_query.join(resource_categories).filter(
            resource_categories.c.category_id.in_(category_ids)
        )
    
    # Apply tag filter if provided
    if tag_ids:
        resources_query = resources_query.join(resource_tags).filter(
            resource_tags.c.tag_id.in_(tag_ids)
        )
    
    # Apply resource type filter if provided
    if resource_type:
        resources_query = resources_query.filter(Resource.resource_type == resource_type)
    
    # Get total count
    total = resources_query.count()
    
    # Apply pagination
    resources = resources_query.order_by(Resource.created_at.desc()).offset(offset).limit(limit).all()
    
    # Determine if there are more resources
    has_more = (offset + limit) < total
    
    return {
        "resources": resources,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": has_more
    }

@router.post("/", response_model=ResourceSchema)
async def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new link resource.
    
    Args:
        resource: Resource data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created resource
    """
    # Validate resource type
    if resource.resource_type == ResourceType.FILE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /upload endpoint for file resources"
        )
    
    # Create resource
    db_resource = Resource(
        title=resource.title,
        description=resource.description,
        resource_type=resource.resource_type,
        url=resource.url,
        uploader_id=current_user.id
    )
    
    db.add(db_resource)
    db.flush()  # Flush to get the resource ID
    
    # Add categories
    if resource.category_ids:
        categories = db.query(Category).filter(Category.id.in_(resource.category_ids)).all()
        db_resource.categories = categories
    
    # Add tags
    if resource.tag_names:
        # Get existing tags
        existing_tags = db.query(Tag).filter(Tag.name.in_(resource.tag_names)).all()
        existing_tag_names = {tag.name for tag in existing_tags}
        
        # Create new tags
        new_tag_names = set(resource.tag_names) - existing_tag_names
        new_tags = [Tag(name=name) for name in new_tag_names]
        
        # Add all tags to resource
        db_resource.tags = existing_tags + new_tags
    
    db.commit()
    db.refresh(db_resource)
    
    return db_resource

@router.post("/upload", response_model=ResourceSchema)
async def upload_file_resource(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category_ids: str = Form("[]"),  # JSON string of category IDs
    tag_names: str = Form("[]"),  # JSON string of tag names
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a file resource.
    
    Args:
        file: Uploaded file
        title: Resource title
        description: Resource description
        category_ids: JSON string of category IDs
        tag_names: JSON string of tag names
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created resource
    """
    import json
    
    # Parse JSON strings
    try:
        category_ids = json.loads(category_ids)
        tag_names = json.loads(tag_names)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON format for category_ids or tag_names"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no filename"
        )
    
    # Save file
    file_path, file_size = await file_storage.save_file(file)
    
    # Create resource
    db_resource = Resource(
        title=title,
        description=description,
        resource_type=ResourceType.FILE,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        uploader_id=current_user.id
    )
    
    db.add(db_resource)
    db.flush()  # Flush to get the resource ID
    
    # Add categories
    if category_ids:
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        db_resource.categories = categories
    
    # Add tags
    if tag_names:
        # Get existing tags
        existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
        existing_tag_names = {tag.name for tag in existing_tags}
        
        # Create new tags
        new_tag_names = set(tag_names) - existing_tag_names
        new_tags = [Tag(name=name) for name in new_tag_names]
        
        # Add all tags to resource
        db_resource.tags = existing_tags + new_tags
    
    db.commit()
    db.refresh(db_resource)
    
    return db_resource

@router.get("/{resource_id}", response_model=ResourceSchema)
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a resource by ID.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Resource
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return resource

@router.put("/{resource_id}", response_model=ResourceSchema)
async def update_resource(
    resource_id: int,
    resource_update: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a resource.
    
    Args:
        resource_id: Resource ID
        resource_update: Resource update data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Updated resource
    """
    # Get resource
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if not db_resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if user is the uploader
    if db_resource.uploader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this resource"
        )
    
    # Update fields
    if resource_update.title is not None:
        db_resource.title = resource_update.title
    
    if resource_update.description is not None:
        db_resource.description = resource_update.description
    
    # Update categories
    if resource_update.category_ids is not None:
        categories = db.query(Category).filter(Category.id.in_(resource_update.category_ids)).all()
        db_resource.categories = categories
    
    # Update tags
    if resource_update.tag_names is not None:
        # Get existing tags
        existing_tags = db.query(Tag).filter(Tag.name.in_(resource_update.tag_names)).all()
        existing_tag_names = {tag.name for tag in existing_tags}
        
        # Create new tags
        new_tag_names = set(resource_update.tag_names) - existing_tag_names
        new_tags = [Tag(name=name) for name in new_tag_names]
        
        # Add all tags to resource
        db_resource.tags = existing_tags + new_tags
    
    db.commit()
    db.refresh(db_resource)
    
    return db_resource

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a resource.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
    """
    # Get resource
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if not db_resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if user is the uploader
    if db_resource.uploader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this resource"
        )
    
    # Delete file if it's a file resource
    if db_resource.resource_type == ResourceType.FILE and db_resource.file_path:
        file_storage.delete_file(db_resource.file_path)
    
    # Delete resource
    db.delete(db_resource)
    db.commit()

@router.get("/{resource_id}/download")
async def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a file resource.
    
    Args:
        resource_id: Resource ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        File response
    """
    from fastapi.responses import FileResponse
    
    # Get resource
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if it's a file resource
    if resource.resource_type != ResourceType.FILE or not resource.file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource is not a file or file path is missing"
        )
    
    # Check if file exists
    if not os.path.exists(resource.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get filename from file path
    filename = os.path.basename(resource.file_path)
    
    # Return file response
    return FileResponse(
        path=resource.file_path,
        filename=filename,
        media_type=resource.mime_type
    )