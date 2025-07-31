from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AccountStatus(str, Enum):
    """User account status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class ResourceType(str, Enum):
    """Resource type."""
    FILE = "FILE"
    LINK = "LINK"

# User Schemas
class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    """Schema for user creation (registration)."""
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @field_validator('email')
    @classmethod
    def validate_alu_email(cls, v):
        if not v.endswith('@alustudent.com'):
            raise ValueError('Email must be a valid ALU email address')
        return v

class UserUpdate(BaseModel):
    """Schema for user updates."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserInDB(UserBase):
    """User schema as stored in database."""
    id: int
    account_status: AccountStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserInDB):
    """Public user schema (excludes sensitive data)."""
    pass

# Authentication Schemas
class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None

class UserLogin(BaseModel):
    """User login credentials."""
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    """Password reset schema."""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation."""
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# Category Schemas
class CategoryBase(BaseModel):
    """Base category schema."""
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    """Schema for category creation."""
    pass

class CategoryUpdate(BaseModel):
    """Schema for category updates."""
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None

class Category(CategoryBase):
    """Category schema with ID."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Tag Schemas
class TagBase(BaseModel):
    """Base tag schema."""
    name: str

class TagCreate(TagBase):
    """Schema for tag creation."""
    pass

class Tag(TagBase):
    """Tag schema with ID."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    """Base resource schema."""
    title: str
    description: Optional[str] = None
    resource_type: ResourceType

class ResourceCreate(ResourceBase):
    """Schema for resource creation."""
    url: Optional[str] = None  # For external links
    category_ids: Optional[List[int]] = []
    tag_names: Optional[List[str]] = []
    
    @field_validator('url')
    @classmethod
    def validate_url_for_link_type(cls, v, info):
        if info.data.get('resource_type') == ResourceType.LINK and not v:
            raise ValueError('URL is required for link resources')
        return v

class ResourceUpdate(BaseModel):
    """Schema for resource updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    category_ids: Optional[List[int]] = None
    tag_names: Optional[List[str]] = None

class Resource(ResourceBase):
    """Complete resource schema."""
    id: int
    upload_date: datetime
    file_path: Optional[str] = None
    url: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploader_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related objects
    uploader: User
    categories: List[Category] = []
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

# Bookmark Schemas
class BookmarkBase(BaseModel):
    """Base bookmark schema."""
    resource_id: int

class BookmarkCreate(BookmarkBase):
    """Schema for bookmark creation."""
    pass

class Bookmark(BookmarkBase):
    """Complete bookmark schema."""
    id: int
    user_id: int
    bookmark_date: datetime
    resource: Resource
    
    class Config:
        from_attributes = True

# Search and Filter Schemas
class ResourceSearch(BaseModel):
    """Resource search parameters."""
    query: Optional[str] = None
    category_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    resource_type: Optional[ResourceType] = None
    uploader_id: Optional[int] = None
    limit: int = 20
    offset: int = 0

class ResourceResponse(BaseModel):
    """Paginated resource response."""
    resources: List[Resource]
    total: int
    limit: int
    offset: int
    has_more: bool
