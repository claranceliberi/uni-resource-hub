from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.init_db import init_db

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    application = FastAPI(
        title="UniResource Hub API",
        description="A centralized platform for managing and accessing academic learning resources for ALU students",
        version="1.0.0",
        docs_url="/docs",  # Enable docs in production for testing
        redoc_url="/redoc",  # Enable redoc in production for testing
    )

    # CORS settings - temporarily allow all origins
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Must be False with allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )



    # Include API router
    application.include_router(api_router, prefix="/api/v1")

    return application

app = create_application()

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "UniResource Hub API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway."""
    return {"status": "healthy"}
