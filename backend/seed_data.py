#!/usr/bin/env python3
"""
Seed script to add sample data to the database.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db.models import Category, Tag, Resource, ResourceType
from app.core.security import get_password_hash

def seed_categories():
    """Add sample categories."""
    db = SessionLocal()
    
    categories = [
        {"name": "Computer Science", "description": "Programming, algorithms, data structures, and software engineering"},
        {"name": "Mathematics", "description": "Calculus, statistics, linear algebra, and mathematical concepts"},
        {"name": "Programming", "description": "Web development, mobile apps, and programming languages"},
        {"name": "Physics", "description": "Classical mechanics, quantum physics, and thermodynamics"},
        {"name": "Chemistry", "description": "Organic chemistry, inorganic chemistry, and chemical reactions"},
        {"name": "Biology", "description": "Cell biology, genetics, ecology, and life sciences"},
        {"name": "Literature", "description": "Classic and modern literature, poetry, and writing"},
        {"name": "History", "description": "World history, historical events, and civilizations"}
    ]
    
    print("🌱 Seeding categories...")
    for cat_data in categories:
        # Check if category already exists
        existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            print(f"  ✅ Added category: {cat_data['name']}")
        else:
            print(f"  ⏭️  Category already exists: {cat_data['name']}")
    
    db.commit()
    db.close()

def seed_tags():
    """Add sample tags."""
    db = SessionLocal()
    
    tags = [
        "Python", "JavaScript", "React", "Machine Learning", "AI", "Data Science",
        "Web Development", "Mobile Development", "Algorithms", "Data Structures",
        "Statistics", "Calculus", "Linear Algebra", "Physics", "Chemistry",
        "Biology", "Literature", "History", "Tutorial", "Guide", "Reference",
        "Beginner", "Advanced", "Research", "Project"
    ]
    
    print("\n🏷️  Seeding tags...")
    for tag_name in tags:
        # Check if tag already exists
        existing = db.query(Tag).filter(Tag.name == tag_name.lower()).first()
        if not existing:
            tag = Tag(name=tag_name.lower())
            db.add(tag)
            print(f"  ✅ Added tag: {tag_name}")
        else:
            print(f"  ⏭️  Tag already exists: {tag_name}")
    
    db.commit()
    db.close()

def seed_sample_resources():
    """Add sample resources."""
    db = SessionLocal()
    
    # Get the user (assuming we have the test user)
    from app.db.models import User
    user = db.query(User).filter(User.email == "m.bela@alustudent.com").first()
    if not user:
        print("❌ No user found to assign resources to")
        db.close()
        return
    
    # Get some categories and tags
    cs_category = db.query(Category).filter(Category.name == "Computer Science").first()
    math_category = db.query(Category).filter(Category.name == "Mathematics").first()
    prog_category = db.query(Category).filter(Category.name == "Programming").first()
    
    python_tag = db.query(Tag).filter(Tag.name == "python").first()
    ml_tag = db.query(Tag).filter(Tag.name == "machine learning").first()
    tutorial_tag = db.query(Tag).filter(Tag.name == "tutorial").first()
    
    sample_resources = [
        {
            "title": "Python Programming Guide",
            "description": "Comprehensive guide to Python programming for beginners",
            "resource_type": ResourceType.LINK,
            "url": "https://docs.python.org/3/tutorial/",
            "uploader_id": user.id,
            "categories": [cs_category, prog_category] if cs_category and prog_category else [],
            "tags": [python_tag, tutorial_tag] if python_tag and tutorial_tag else []
        },
        {
            "title": "Machine Learning Fundamentals",
            "description": "Introduction to machine learning concepts and algorithms",
            "resource_type": ResourceType.LINK,
            "url": "https://www.coursera.org/learn/machine-learning",
            "uploader_id": user.id,
            "categories": [cs_category] if cs_category else [],
            "tags": [ml_tag, python_tag] if ml_tag and python_tag else []
        },
        {
            "title": "Statistics for Data Science",
            "description": "Essential statistics concepts for data science applications",
            "resource_type": ResourceType.LINK,
            "url": "https://www.khanacademy.org/math/statistics-probability",
            "uploader_id": user.id,
            "categories": [math_category] if math_category else [],
            "tags": [tutorial_tag] if tutorial_tag else []
        }
    ]
    
    print("\n📚 Seeding sample resources...")
    for res_data in sample_resources:
        # Check if resource already exists
        existing = db.query(Resource).filter(Resource.title == res_data["title"]).first()
        if not existing:
            categories = res_data.pop("categories", [])
            tags = res_data.pop("tags", [])
            
            resource = Resource(**res_data)
            db.add(resource)
            db.flush()  # Get the ID
            
            # Add relationships
            resource.categories = categories
            resource.tags = tags
            
            print(f"  ✅ Added resource: {res_data['title']}")
        else:
            print(f"  ⏭️  Resource already exists: {res_data['title']}")
    
    db.commit()
    db.close()

def main():
    """Run all seed functions."""
    print("🌱 Starting database seeding...\n")
    
    try:
        seed_categories()
        seed_tags()
        seed_sample_resources()
        
        print("\n🎉 Database seeding completed successfully!")
        print("\nYou can now:")
        print("1. Test the backend endpoints with real data")
        print("2. Connect the frontend to see actual content")
        print("3. Test the full application workflow")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()