from typing import List
from uuid import UUID
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.stock import StockItem, StockCostHistory, StockTransaction
from app.schemas.stock import (
    StockItemCreate, StockItemUpdate, StockItemResponse,
    StockCostHistoryCreate, StockCostHistoryResponse,
    RestockRequest, StockTransactionResponse, WasteRequest,
    StockTransactionWithItemResponse
)

router = APIRouter()

@router.get("/history", response_model=List[StockTransactionWithItemResponse])
async def get_all_stock_history(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stock history for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    # Join with StockItem to filter by cafe_id
    history = db.query(StockTransaction).join(StockItem).filter(
        StockItem.cafe_id == cafe_id
    ).order_by(StockTransaction.created_at.desc()).limit(100).all()
    
    # Map to response schema with item name
    result = []
    for trans in history:
        result.append(StockTransactionWithItemResponse(
            id=trans.id,
            stock_item_id=trans.stock_item_id,
            quantity_change=trans.quantity_change,
            transaction_type=trans.transaction_type,
            notes=trans.notes,
            created_at=trans.created_at,
            created_by=trans.created_by,
            stock_item_name=trans.stock_item.name
        ))
    
    return result

@router.get("", response_model=List[StockItemResponse])
async def get_stock_items(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stock items for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    items = db.query(StockItem).filter(StockItem.cafe_id == cafe_id).order_by(StockItem.name).all()
    
    # Attach current cost to each item
    result = []
    for item in items:
        # Get the most recent cost
        cost_entry = db.query(StockCostHistory).filter(
            StockCostHistory.stock_item_id == item.id,
            StockCostHistory.start_date <= date.today()
        ).order_by(StockCostHistory.start_date.desc()).first()
        
        item_dict = {
            "id": item.id,
            "cafe_id": item.cafe_id,
            "name": item.name,
            "unit_of_measure": item.unit_of_measure,
            "low_stock_threshold": item.low_stock_threshold,
            "current_quantity": item.current_quantity,
            "cost_per_unit": cost_entry.cost_per_unit if cost_entry else 0,
            "created_at": item.created_at
        }
        result.append(item_dict)
    
    return result

@router.post("", response_model=StockItemResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_item(
    cafe_id: UUID,
    item_data: StockItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new stock item"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Check if item with same name already exists
    existing_item = db.query(StockItem).filter(
        StockItem.cafe_id == cafe_id,
        StockItem.name == item_data.name
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=400,
            detail=f"عنصر بإسم '{item_data.name}' موجود بالفعل في المخزون"
        )
    
    new_item = StockItem(
        cafe_id=cafe_id,
        name=item_data.name,
        current_quantity=item_data.current_quantity,
        unit_of_measure=item_data.unit_of_measure,
        low_stock_threshold=item_data.low_stock_threshold
    )
    db.add(new_item)
    db.flush()
    
    # Create initial cost history
    cost_history = StockCostHistory(
        stock_item_id=new_item.id,
        cost_per_unit=item_data.cost_per_unit,
        start_date=date.today()
    )
    db.add(cost_history)

    # Create initial transaction if quantity > 0
    if item_data.current_quantity > 0:
        transaction = StockTransaction(
            stock_item_id=new_item.id,
            quantity_change=item_data.current_quantity,
            transaction_type='initial',
            notes='Initial stock creation',
            created_by=current_user.id
        )
        db.add(transaction)

    db.commit()
    db.refresh(new_item)
    
    return new_item

@router.put("/{item_id}", response_model=StockItemResponse)
async def update_stock_item(
    cafe_id: UUID,
    item_id: UUID,
    item_data: StockItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update stock item basic info (name, unit, low stock threshold)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    if item_data.name is not None:
        item.name = item_data.name
    if item_data.unit_of_measure is not None:
        item.unit_of_measure = item_data.unit_of_measure
    if item_data.low_stock_threshold is not None:
        item.low_stock_threshold = item_data.low_stock_threshold
    
    db.commit()
    db.refresh(item)
    
    # Get current cost from history
    current_cost = db.query(StockCostHistory).filter(
        StockCostHistory.stock_item_id == item_id
    ).order_by(StockCostHistory.start_date.desc()).first()
    
    response = StockItemResponse(
        id=item.id,
        cafe_id=item.cafe_id,
        name=item.name,
        unit_of_measure=item.unit_of_measure,
        current_quantity=item.current_quantity,
        low_stock_threshold=item.low_stock_threshold,
        cost_per_unit=current_cost.cost_per_unit if current_cost else Decimal("0"),
        created_at=item.created_at
    )
    
    return response

@router.put("/{item_id}/cost", response_model=StockCostHistoryResponse)
async def update_stock_cost(
    cafe_id: UUID,
    item_id: UUID,
    cost_data: StockCostHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update stock item cost (adds to history)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    new_cost = StockCostHistory(
        stock_item_id=item_id,
        cost_per_unit=cost_data.cost_per_unit,
        start_date=cost_data.start_date or date.today()
    )
    db.add(new_cost)
    db.commit()
    db.refresh(new_cost)
    
    return new_cost

@router.post("/{item_id}/restock")
async def restock_item(
    cafe_id: UUID,
    item_id: UUID,
    restock_data: RestockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add quantity to stock item"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    item.current_quantity += restock_data.quantity
    
    # Update cost if provided
    if restock_data.cost_per_unit is not None:
        # Check if cost actually changed to avoid duplicate entries for same day
        current_cost = db.query(StockCostHistory).filter(
            StockCostHistory.stock_item_id == item_id
        ).order_by(StockCostHistory.start_date.desc()).first()
        
        if not current_cost or current_cost.cost_per_unit != restock_data.cost_per_unit:
            new_cost = StockCostHistory(
                stock_item_id=item_id,
                cost_per_unit=restock_data.cost_per_unit,
                start_date=date.today()
            )
            db.add(new_cost)
    
    # Create transaction record
    transaction = StockTransaction(
        stock_item_id=item_id,
        quantity_change=restock_data.quantity,
        transaction_type='restock',
        notes=restock_data.notes,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    
    return {"message": "Stock updated successfully", "new_quantity": float(item.current_quantity)}

@router.post("/{item_id}/waste")
async def record_waste(
    cafe_id: UUID,
    item_id: UUID,
    waste_data: WasteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record waste for a stock item"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    if item.current_quantity < waste_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock to record waste")
    
    item.current_quantity -= waste_data.quantity
    
    # Create transaction record
    transaction = StockTransaction(
        stock_item_id=item_id,
        quantity_change=-waste_data.quantity,
        transaction_type='waste',
        notes=waste_data.reason,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    
    return {"message": "Waste recorded successfully", "new_quantity": float(item.current_quantity)}

@router.get("/{item_id}/history", response_model=List[StockTransactionResponse])
async def get_stock_history(
    cafe_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get stock history for an item"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
        
    history = db.query(StockTransaction).filter(
        StockTransaction.stock_item_id == item_id
    ).order_by(StockTransaction.created_at.desc()).all()
    
    return history

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock_item(
    cafe_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a stock item"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    item = db.query(StockItem).filter(
        StockItem.id == item_id,
        StockItem.cafe_id == cafe_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    db.delete(item)
    db.commit()
