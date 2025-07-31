from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Table, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from app.db.database import Base

# Association table for many-to-many relationship between resources and tags
resource_tags = Table(
    "resource_tags",
    Base.metadata,
    Column("resource_id", Integer, ForeignKey("resources.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

# Association table for many-to-many relationship between resources and categories
resource_categories = Table(
    "resource_categories", 
    Base.metadata,
    Column("resource_id", Integer, ForeignKey("resources.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)

class AccountStatus(Enum):
    """User account status enumeration."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class ResourceType(Enum):
    """Resource type enumeration."""
    FILE = "FILE"
    LINK = "LINK"

class User(Base):
    """
    User model representing ALU students and staff.
    
    Attributes as per SRS Class Diagram:
    - userID, email, passwordHash, firstName, lastName, accountStatus
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)  # userID in SRS
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # passwordHash in SRS
    first_name = Column(String(100), nullable=False)  # firstName in SRS
    last_name = Column(String(100), nullable=False)  # lastName in SRS
    account_status = Column(SQLEnum(AccountStatus), default=AccountStatus.ACTIVE)  # accountStatus in SRS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    uploaded_resources = relationship("Resource", back_populates="uploader", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    """
    Category model for organizing resources (Course, Module, Topic).
    
    Attributes as per SRS Class Diagram:
    - categoryID, name
    """
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)  # categoryID in SRS
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # For hierarchical categories
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    parent = relationship("Category", remote_side=[id])
    children = relationship("Category")
    resources = relationship("Resource", secondary=resource_categories, back_populates="categories")

class Tag(Base):
    """
    Tag model for flexible resource tagging.
    
    Attributes as per SRS Class Diagram:
    - tagID, name
    """
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)  # tagID in SRS
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resources = relationship("Resource", secondary=resource_tags, back_populates="tags")

class Resource(Base):
    """
    Resource model representing uploaded files and external links.
    
    Attributes as per SRS Class Diagram:
    - resourceID, title, description, uploadDate, resourceType, filePath/url, uploaderID
    """
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)  # resourceID in SRS
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())  # uploadDate in SRS
    resource_type = Column(SQLEnum(ResourceType), nullable=False)  # resourceType in SRS
    file_path = Column(String(500), nullable=True)  # filePath in SRS (for uploaded files)
    url = Column(String(500), nullable=True)  # url in SRS (for external links)
    file_size = Column(Integer, nullable=True)  # in bytes
    mime_type = Column(String(100), nullable=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # uploaderID in SRS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_resources")
    categories = relationship("Category", secondary=resource_categories, back_populates="resources")
    tags = relationship("Tag", secondary=resource_tags, back_populates="resources")
    bookmarks = relationship("Bookmark", back_populates="resource", cascade="all, delete-orphan")

class Bookmark(Base):
    """
    Bookmark model for user's saved resources.
    
    Attributes as per SRS Class Diagram:
    - bookmarkID, userID, resourceID, bookmarkDate
    """
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)  # bookmarkID in SRS
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # userID in SRS
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)  # resourceID in SRS
    bookmark_date = Column(DateTime(timezone=True), server_default=func.now())  # bookmarkDate in SRS
    
    # Relationships
    user = relationship("User", back_populates="bookmarks")
    resource = relationship("Resource", back_populates="bookmarks")
    
    # Ensure unique bookmark per user-resource pair
    __table_args__ = ({"schema": None},)
