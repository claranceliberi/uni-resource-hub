from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, resources, categories, tags, bookmarks

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(bookmarks.router, prefix="/bookmarks", tags=["bookmarks"])
