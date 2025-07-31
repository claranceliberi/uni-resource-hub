from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, verify_token
from app.db.database import get_db
from app.db.models import User
from app.schemas import UserCreate, User as UserSchema, Token, UserLogin

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)  # Convert string to int
    except Exception:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user (not suspended/inactive).
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user account is inactive
    """
    # Accept all Enum and string representations for account_status, case-insensitive
    status_str = str(current_user.account_status).lower()
    if "active" not in status_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user account"
        )
    return current_user

@router.post("/register", response_model=UserSchema)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (FR 1.1).
    
    Args:
        user_data: User registration data
        db: Database session
        
    Returns:
        User: Created user
        
    Raises:
        HTTPException: If email already exists
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    User login endpoint (FR 1.2) - OAuth2 compatible.
    
    Args:
        form_data: OAuth2 form data (username=email, password)
        db: Database session
        
    Returns:
        Token: JWT access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    print(f"[DEBUG] Login attempt: username={form_data.username}, password={form_data.password}")
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        print("[DEBUG] No user found with that email.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    password_ok = verify_password(form_data.password, user.password_hash)
    print(f"[DEBUG] Password valid: {password_ok}")
    if not password_ok:
        print(f"[DEBUG] Password check failed for user {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Accept all Enum and string representations for account_status, case-insensitive
    status_str = str(user.account_status).lower()
    if "active" not in status_str:
        print(f"[DEBUG] User {form_data.username} is not active: {user.account_status}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not active"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    print(f"[DEBUG] Login successful for user {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login_json(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    User login endpoint (FR 1.2) - JSON compatible.
    
    Args:
        user_credentials: User login credentials
        db: Database session
        
    Returns:
        Token: JWT access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not active"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current user information
    """
    return current_user

@router.post("/logout")
async def logout():
    """
    User logout endpoint (FR 1.4).
    
    Note: With JWT tokens, logout is typically handled client-side
    by removing the token. For enhanced security, you could implement
    a token blacklist.
    
    Returns:
        dict: Logout confirmation message
    """
    return {"message": "Successfully logged out"}

# TODO: Implement password reset functionality (FR 1.3)
# This would require email service integration
