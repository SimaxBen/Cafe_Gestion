from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.menu import MenuItem, MenuPriceHistory, MenuItemRecipe
from app.models.stock import StockItem
from app.schemas.menu import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    MenuPriceHistoryCreate, MenuPriceHistoryResponse,
    MenuItemRecipeCreate, MenuItemRecipeResponse, MenuItemRecipeDetail
)

router = APIRouter()

@router.get("", response_model=List[MenuItemResponse])
async def get_menu_items(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all menu items for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).order_by(MenuItem.name).all()
    
    # Add current sale price to each item
    result = []
    for item in items:
        latest_price = db.query(MenuPriceHistory).filter(
            MenuPriceHistory.menu_item_id == item.id
        ).order_by(MenuPriceHistory.start_date.desc()).first()
        
        item_dict = {
            'id': item.id,
            'cafe_id': item.cafe_id,
            'name': item.name,
            'category_id': item.category_id,
            'image_url': item.image_url,
            'sale_price': latest_price.sale_price if latest_price else 0,
            'created_at': item.created_at
        }
        result.append(item_dict)
    
    return result

@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    cafe_id: UUID,
    item_data: MenuItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new menu item"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Check if item with same name already exists
    existing_item = db.query(MenuItem).filter(
        MenuItem.cafe_id == cafe_id,
        MenuItem.name == item_data.name
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=400,
            detail=f"صنف بإسم '{item_data.name}' موجود بالفعل في القائمة"
        )
    
    new_item = MenuItem(
        cafe_id=cafe_id,
        name=item_data.name,
        category_id=item_data.category_id,
        image_url=item_data.image_url
    )
    db.add(new_item)
    db.flush()
    
    # Create initial price
    price_history = MenuPriceHistory(
        menu_item_id=new_item.id,
        sale_price=item_data.sale_price,
        start_date=date.today()
    )
    db.add(price_history)
    db.commit()
    db.refresh(new_item)
    
    # Return with sale_price
    result = {
        'id': new_item.id,
        'cafe_id': new_item.cafe_id,
        'name': new_item.name,
        'category_id': new_item.category_id,
        'image_url': new_item.image_url,
        'sale_price': item_data.sale_price,
        'created_at': new_item.created_at
    }
    return result

@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    cafe_id: UUID,
    item_id: UUID,
    item_data: MenuItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update menu item basic info (name, category)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    if item_data.name is not None:
        item.name = item_data.name
    
    if item_data.category_id is not None:
        item.category_id = item_data.category_id
    
    if item_data.image_url is not None:
        item.image_url = item_data.image_url
    
    # Get current price for response
    latest_price = db.query(MenuPriceHistory).filter(
        MenuPriceHistory.menu_item_id == item.id
    ).order_by(MenuPriceHistory.start_date.desc()).first()
    
    db.commit()
    db.refresh(item)
    
    # Return with sale_price
    result = {
        'id': item.id,
        'cafe_id': item.cafe_id,
        'name': item.name,
        'category_id': item.category_id,
        'image_url': item.image_url,
        'sale_price': latest_price.sale_price if latest_price else 0,
        'created_at': item.created_at
    }
    return result

@router.put("/{item_id}/price", response_model=MenuPriceHistoryResponse)
async def update_menu_item_price(
    cafe_id: UUID,
    item_id: UUID,
    price_data: MenuPriceHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update menu item price (adds to history)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    new_price = MenuPriceHistory(
        menu_item_id=item_id,
        sale_price=price_data.sale_price,
        start_date=price_data.start_date or date.today()
    )
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    
    return new_price

@router.get("/{item_id}/recipe", response_model=List[MenuItemRecipeDetail])
async def get_menu_item_recipe(
    cafe_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recipe for a menu item"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    recipe_items = db.query(MenuItemRecipe).filter(
        MenuItemRecipe.menu_item_id == item_id
    ).all()
    
    result = []
    for recipe_item in recipe_items:
        stock_item = db.query(StockItem).filter(
            StockItem.id == recipe_item.stock_item_id
        ).first()
        
        result.append(MenuItemRecipeDetail(
            id=recipe_item.id,
            menu_item_id=recipe_item.menu_item_id,
            stock_item_id=recipe_item.stock_item_id,
            quantity_used=recipe_item.quantity_used,
            created_at=recipe_item.created_at,
            stock_item_name=stock_item.name if stock_item else "Unknown",
            unit_of_measure=stock_item.unit_of_measure if stock_item else ""
        ))
    
    return result

@router.post("/{item_id}/recipe", response_model=MenuItemRecipeResponse, status_code=status.HTTP_201_CREATED)
async def add_recipe_ingredient(
    cafe_id: UUID,
    item_id: UUID,
    recipe_data: MenuItemRecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an ingredient to a menu item's recipe"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Verify menu item belongs to cafe
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.cafe_id == cafe_id
    ).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify stock item belongs to same cafe
    stock_item = db.query(StockItem).filter(
        StockItem.id == recipe_data.stock_item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not stock_item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    # Create recipe entry
    new_recipe = MenuItemRecipe(
        menu_item_id=item_id,
        stock_item_id=recipe_data.stock_item_id,
        quantity_used=recipe_data.quantity_used
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    
    return new_recipe

@router.delete("/{item_id}/recipe/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe_ingredient(
    cafe_id: UUID,
    item_id: UUID,
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a recipe ingredient"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Verify menu item belongs to cafe
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.cafe_id == cafe_id
    ).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Find and delete the recipe ingredient
    recipe_ingredient = db.query(MenuItemRecipe).filter(
        MenuItemRecipe.id == recipe_id,
        MenuItemRecipe.menu_item_id == item_id
    ).first()
    
    if not recipe_ingredient:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")
    
    db.delete(recipe_ingredient)
    db.commit()

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    cafe_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a menu item"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(item)
    db.commit()
