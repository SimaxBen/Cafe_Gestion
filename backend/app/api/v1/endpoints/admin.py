from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.cafe import Cafe, UserCafeRole
from app.schemas.user import UserResponse
from app.schemas.cafe import CafeCreate, CafeResponse
from pydantic import BaseModel, EmailStr

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin access"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

class UserCreateByAdmin(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class CafeAssignment(BaseModel):
    cafe_id: UUID
    user_id: UUID
    role: str  # "owner" or "manager"

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).all()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateByAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    from app.core.security import get_password_hash
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        is_admin=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/cafes", response_model=List[CafeResponse])
async def get_all_cafes(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all cafes (admin only)"""
    cafes = db.query(Cafe).all()
    return cafes

@router.post("/cafes", response_model=CafeResponse, status_code=status.HTTP_201_CREATED)
async def create_cafe(
    cafe_data: CafeCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new cafe (admin only)"""
    new_cafe = Cafe(
        name=cafe_data.name,
        address=cafe_data.address,
        currency_symbol=cafe_data.currency_symbol or "$",
        owner_id=admin.id  # Admin creates it initially
    )
    db.add(new_cafe)
    db.flush()
    
    # Create admin role for the cafe so admin can see it
    admin_role = UserCafeRole(
        user_id=admin.id,
        cafe_id=new_cafe.id,
        role='owner'
    )
    db.add(admin_role)
    db.commit()
    db.refresh(new_cafe)
    
    return new_cafe

@router.post("/assign-cafe", status_code=status.HTTP_200_OK)
async def assign_cafe_to_user(
    assignment: CafeAssignment,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign a cafe to a user with a specific role (admin only)"""
    # Verify cafe exists
    cafe = db.query(Cafe).filter(Cafe.id == assignment.cafe_id).first()
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found"
        )
    
    # Verify user exists
    user = db.query(User).filter(User.id == assignment.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if assignment already exists
    existing_role = db.query(UserCafeRole).filter(
        UserCafeRole.user_id == assignment.user_id,
        UserCafeRole.cafe_id == assignment.cafe_id
    ).first()
    
    if existing_role:
        # Update existing role
        existing_role.role = assignment.role
    else:
        # Create new role assignment
        new_role = UserCafeRole(
            user_id=assignment.user_id,
            cafe_id=assignment.cafe_id,
            role=assignment.role
        )
        db.add(new_role)
    
    # If assigning as owner, update cafe owner_id
    if assignment.role == "owner":
        cafe.owner_id = assignment.user_id
    
    db.commit()
    
    return {"message": f"User assigned to cafe as {assignment.role}"}

@router.delete("/assign-cafe", status_code=status.HTTP_200_OK)
async def remove_cafe_assignment(
    assignment: CafeAssignment,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Remove a user's access to a cafe (admin only)"""
    role = db.query(UserCafeRole).filter(
        UserCafeRole.user_id == assignment.user_id,
        UserCafeRole.cafe_id == assignment.cafe_id
    ).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    db.delete(role)
    db.commit()
    
    return {"message": "User removed from cafe"}

@router.get("/cafe/{cafe_id}/users", response_model=List[dict])
async def get_cafe_users(
    cafe_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users assigned to a cafe (admin only)"""
    roles = db.query(UserCafeRole).filter(UserCafeRole.cafe_id == cafe_id).all()
    
    result = []
    for role in roles:
        user = db.query(User).filter(User.id == role.user_id).first()
        if user:
            result.append({
                "user_id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": role.role
            })
    
    return result
