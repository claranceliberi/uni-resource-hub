"""
Categories API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Category, User, Resource, resource_categories
from app.schemas import (
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate
)
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all categories with resource counts.
    
    Args:
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of categories
    """
    categories = db.query(Category).all()
    return categories

@router.post("/", response_model=CategorySchema)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new category.
    
    Args:
        category: Category data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created category
    """
    # Check if category with same name already exists
    existing_category = db.query(Category).filter(Category.name == category.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    # Create new category
    db_category = Category(
        name=category.name,
        description=category.description,
        parent_id=category.parent_id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/{category_id}", response_model=CategorySchema)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a category by ID.
    
    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Category
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category

@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a category.
    
    Args:
        category_id: Category ID
        category_update: Category update data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Updated category
    """
    # Get category
    db_category = db.query(Category).filter(Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new name conflicts with existing category
    if category_update.name and category_update.name != db_category.name:
        existing_category = db.query(Category).filter(
            Category.name == category_update.name,
            Category.id != category_id
        ).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
    
    # Update fields
    if category_update.name is not None:
        db_category.name = category_update.name
    
    if category_update.description is not None:
        db_category.description = category_update.description
    
    if category_update.parent_id is not None:
        db_category.parent_id = category_update.parent_id
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a category.
    
    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user
    """
    # Get category
    db_category = db.query(Category).filter(Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category has resources
    resource_count = db.query(func.count(resource_categories.c.resource_id)).filter(
        resource_categories.c.category_id == category_id
    ).scalar()
    
    if resource_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {resource_count} resources. Please move or delete the resources first."
        )
    
    # Check if category has child categories
    child_count = db.query(func.count(Category.id)).filter(Category.parent_id == category_id).scalar()
    
    if child_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {child_count} child categories. Please delete child categories first."
        )
    
    # Delete category
    db.delete(db_category)
    db.commit()

@router.get("/{category_id}/resources")
async def get_category_resources(
    category_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get resources in a specific category.
    
    Args:
        category_id: Category ID
        limit: Maximum number of resources to return
        offset: Number of resources to skip
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of resources in the category
    """
    # Check if category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get resources in this category
    resources = db.query(Resource).join(resource_categories).filter(
        resource_categories.c.category_id == category_id
    ).offset(offset).limit(limit).all()
    
    # Get total count
    total = db.query(func.count(Resource.id)).join(resource_categories).filter(
        resource_categories.c.category_id == category_id
    ).scalar()
    
    return {
        "resources": resources,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total
    }