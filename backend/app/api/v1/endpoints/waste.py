from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import date
from app.core import deps
from app.models.menu import MenuItem, MenuItemRecipe, MenuWaste
from app.models.stock import StockItem, StockTransaction, StockCostHistory
from app.schemas.waste import MenuWasteCreate, MenuWasteResponse

router = APIRouter()

@router.post("/menu", response_model=MenuWasteResponse)
def record_menu_waste(
    *,
    db: Session = Depends(deps.get_db),
    waste_in: MenuWasteCreate,
    current_user = Depends(deps.get_current_user),
    cafe_id: UUID
):
    # 1. Get Menu Item
    menu_item = db.query(MenuItem).filter(MenuItem.id == waste_in.menu_item_id, MenuItem.cafe_id == cafe_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    # 2. Get Recipe
    recipe_items = db.query(MenuItemRecipe).filter(MenuItemRecipe.menu_item_id == menu_item.id).all()
    
    total_cost = 0
    
    # 3. Process Ingredients
    for recipe_item in recipe_items:
        stock_item = db.query(StockItem).filter(StockItem.id == recipe_item.stock_item_id).first()
        if stock_item:
            quantity_needed = float(recipe_item.quantity_used) * waste_in.quantity
            
            # Get current cost
            cost_entry = db.query(StockCostHistory).filter(
                StockCostHistory.stock_item_id == stock_item.id,
                StockCostHistory.start_date <= date.today()
            ).order_by(StockCostHistory.start_date.desc()).first()
            
            cost_per_unit = float(cost_entry.cost_per_unit) if cost_entry else 0
            cost = cost_per_unit * quantity_needed
            total_cost += cost
            
            # Deduct Stock
            stock_item.current_quantity = float(stock_item.current_quantity) - quantity_needed
            
            # Record Transaction
            transaction = StockTransaction(
                stock_item_id=stock_item.id,
                quantity_change=-quantity_needed,
                transaction_type='waste',
                notes=f"Waste: {waste_in.quantity}x {menu_item.name} ({waste_in.reason or 'No reason'})",
                created_by=current_user.id
            )
            db.add(transaction)
            
    # 4. Create Waste Record
    waste_record = MenuWaste(
        cafe_id=cafe_id,
        menu_item_id=waste_in.menu_item_id,
        quantity=waste_in.quantity,
        total_cost=total_cost,
        reason=waste_in.reason,
        created_by=current_user.id
    )
    db.add(waste_record)
    db.commit()
    db.refresh(waste_record)
    
    return MenuWasteResponse(
        id=waste_record.id,
        cafe_id=waste_record.cafe_id,
        menu_item_id=waste_record.menu_item_id,
        quantity=waste_record.quantity,
        reason=waste_record.reason,
        total_cost=waste_record.total_cost,
        created_at=waste_record.created_at,
        menu_item_name=menu_item.name
    )

@router.get("/menu", response_model=List[MenuWasteResponse])
def get_menu_waste_history(
    *,
    db: Session = Depends(deps.get_db),
    cafe_id: UUID,
    skip: int = 0,
    limit: int = 100
):
    waste_records = db.query(MenuWaste).filter(MenuWaste.cafe_id == cafe_id).order_by(MenuWaste.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for record in waste_records:
        menu_item = db.query(MenuItem).filter(MenuItem.id == record.menu_item_id).first()
        results.append(MenuWasteResponse(
            id=record.id,
            cafe_id=record.cafe_id,
            menu_item_id=record.menu_item_id,
            quantity=record.quantity,
            reason=record.reason,
            total_cost=record.total_cost,
            created_at=record.created_at,
            menu_item_name=menu_item.name if menu_item else "Unknown"
        ))
        
    return results
