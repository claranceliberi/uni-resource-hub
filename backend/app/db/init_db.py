from app.db.database import engine, Base
from app.db.models import User, Resource, Category, Tag, Bookmark

def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This function creates all tables defined in the models
    if they don't already exist.
    """
    Base.metadata.create_all(bind=engine)

def create_initial_data() -> None:
    """
    Create initial data for the application.
    
    This includes default categories like courses and modules
    that are commonly used at ALU.
    """
    from app.db.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if categories already exist
        existing_categories = db.query(Category).first()
        if existing_categories:
            return
        
        # Create default categories
        default_categories = [
            {"name": "Computer Science", "description": "Computer Science related resources"},
            {"name": "Business", "description": "Business and Entrepreneurship resources"},
            {"name": "Engineering", "description": "Engineering related resources"},
            {"name": "Liberal Arts", "description": "Liberal Arts and Humanities resources"},
            {"name": "Mathematics", "description": "Mathematics and Statistics resources"},
            {"name": "Science", "description": "Natural Sciences resources"},
            {"name": "General", "description": "General academic resources"},
        ]
        
        for cat_data in default_categories:
            category = Category(**cat_data)
            db.add(category)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
