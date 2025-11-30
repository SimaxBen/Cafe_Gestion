from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.cafe import Cafe, UserCafeRole
from app.schemas.cafe import CafeCreate, CafeUpdate, CafeResponse

router = APIRouter()

@router.get("", response_model=List[CafeResponse])
async def get_user_cafes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all cafes the user has access to"""
    user_cafe_roles = db.query(UserCafeRole).filter(
        UserCafeRole.user_id == current_user.id
    ).all()
    
    cafe_ids = [role.cafe_id for role in user_cafe_roles]
    cafes = db.query(Cafe).filter(Cafe.id.in_(cafe_ids)).all()
    
    return cafes

@router.post("", response_model=CafeResponse, status_code=status.HTTP_201_CREATED)
async def create_cafe(
    cafe_data: CafeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new cafe"""
    new_cafe = Cafe(
        name=cafe_data.name,
        address=cafe_data.address,
        currency_symbol=cafe_data.currency_symbol,
        owner_id=current_user.id
    )
    db.add(new_cafe)
    db.flush()
    
    # Create owner role
    owner_role = UserCafeRole(
        user_id=current_user.id,
        cafe_id=new_cafe.id,
        role='owner'
    )
    db.add(owner_role)
    db.commit()
    db.refresh(new_cafe)
    
    return new_cafe

@router.get("/{cafe_id}", response_model=CafeResponse)
async def get_cafe(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    return cafe

@router.put("/{cafe_id}", response_model=CafeResponse)
async def update_cafe(
    cafe_id: UUID,
    cafe_data: CafeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cafe details"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="owner")
    
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    update_data = cafe_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cafe, field, value)
    
    db.commit()
    db.refresh(cafe)
    
    return cafe
