from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.category import MenuCategory
from app.schemas.category import (
    MenuCategoryCreate, MenuCategoryUpdate, MenuCategoryResponse
)

router = APIRouter()

@router.get("", response_model=List[MenuCategoryResponse])
async def get_categories(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all menu categories for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    categories = db.query(MenuCategory).filter(
        MenuCategory.cafe_id == cafe_id
    ).order_by(MenuCategory.display_order, MenuCategory.name).all()
    
    return categories

@router.post("", response_model=MenuCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    cafe_id: UUID,
    category_data: MenuCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new menu category"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Check if category with same name already exists
    existing = db.query(MenuCategory).filter(
        MenuCategory.cafe_id == cafe_id,
        MenuCategory.name == category_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    new_category = MenuCategory(
        cafe_id=cafe_id,
        name=category_data.name,
        name_ar=category_data.name_ar,
        icon=category_data.icon,
        color_from=category_data.color_from,
        color_to=category_data.color_to,
        bg_light=category_data.bg_light,
        border_color=category_data.border_color,
        display_order=category_data.display_order
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category

@router.put("/{category_id}", response_model=MenuCategoryResponse)
async def update_category(
    cafe_id: UUID,
    category_id: UUID,
    category_data: MenuCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a menu category"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    category = db.query(MenuCategory).filter(
        MenuCategory.id == category_id,
        MenuCategory.cafe_id == cafe_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    cafe_id: UUID,
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a menu category"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    category = db.query(MenuCategory).filter(
        MenuCategory.id == category_id,
        MenuCategory.cafe_id == cafe_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if any menu items are using this category
    if category.menu_items:
        # Set category_id to NULL for all items in this category
        for item in category.menu_items:
            item.category_id = None
    
    db.delete(category)
    db.commit()
