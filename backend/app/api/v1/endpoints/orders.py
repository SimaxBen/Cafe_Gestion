from typing import List
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.staff import Staff
from app.models.menu import MenuItem, MenuItemRecipe, MenuPriceHistory
from app.models.stock import StockItem, StockCostHistory
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse

router = APIRouter()

def calculate_menu_item_cost(db: Session, menu_item_id: UUID, effective_date: date) -> float:
    """Calculate cost of goods for a menu item on a specific date"""
    recipe_items = db.query(MenuItemRecipe).filter(
        MenuItemRecipe.menu_item_id == menu_item_id
    ).all()
    
    total_cost = 0.0
    for ingredient in recipe_items:
        # Get cost for this stock item on the effective date
        cost_entry = db.query(StockCostHistory).filter(
            StockCostHistory.stock_item_id == ingredient.stock_item_id,
            StockCostHistory.start_date <= effective_date
        ).order_by(StockCostHistory.start_date.desc()).first()
        
        if cost_entry:
            total_cost += float(ingredient.quantity_used * cost_entry.cost_per_unit)
    
    return total_cost

@router.get("", response_model=List[OrderResponse])
async def get_orders(
    cafe_id: UUID,
    date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get orders for a cafe, optionally filtered by date"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    query = db.query(Order).filter(Order.cafe_id == cafe_id)
    
    if date:
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        query = query.filter(
            Order.timestamp >= start_of_day,
            Order.timestamp <= end_of_day
        )
    
    orders = query.order_by(Order.timestamp.desc()).all()
    
    # Format response
    response = []
    for order in orders:
        items = []
        total_revenue = 0
        total_cost = 0
        
        for item in order.items:
            items.append(OrderItemResponse(
                id=item.id,
                menu_item_id=item.menu_item_id,
                menu_item_name=item.menu_item.name,
                quantity=item.quantity,
                price_at_sale=item.price_at_sale,
                cost_at_sale=item.cost_at_sale
            ))
            total_revenue += item.price_at_sale * item.quantity
            total_cost += item.cost_at_sale * item.quantity
        
        response.append(OrderResponse(
            id=order.id,
            cafe_id=order.cafe_id,
            staff_id=order.staff_id,
            staff_name=order.staff.name,
            timestamp=order.timestamp,
            items=items,
            total_revenue=total_revenue,
            total_cost=total_cost
        ))
    
    return response

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    cafe_id: UUID,
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order (daily sales report)"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    # Verify staff belongs to this cafe
    staff = db.query(Staff).filter(
        Staff.id == order_data.staff_id,
        Staff.cafe_id == cafe_id
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found in this cafe")
    
    # Create order
    order_timestamp = order_data.timestamp or datetime.now()
    sale_date = order_timestamp.date()
    
    new_order = Order(
        cafe_id=cafe_id,
        staff_id=order_data.staff_id,
        timestamp=order_timestamp
    )
    db.add(new_order)
    db.flush()
    
    # Process each item
    total_revenue = 0
    total_cost = 0
    items_response = []
    
    for item_input in order_data.items:
        # Get current price for this item
        price_entry = db.query(MenuPriceHistory).filter(
            MenuPriceHistory.menu_item_id == item_input.menu_item_id,
            MenuPriceHistory.start_date <= sale_date
        ).order_by(MenuPriceHistory.start_date.desc()).first()
        
        if not price_entry:
            raise HTTPException(
                status_code=400,
                detail=f"No price found for menu item {item_input.menu_item_id}"
            )
        
        # Calculate cost
        cost_per_item = calculate_menu_item_cost(db, item_input.menu_item_id, sale_date)
        
        # Create order item
        order_item = OrderItem(
            order_id=new_order.id,
            menu_item_id=item_input.menu_item_id,
            quantity=item_input.quantity,
            price_at_sale=price_entry.sale_price,
            cost_at_sale=cost_per_item
        )
        db.add(order_item)
        db.flush()  # Generate ID before using it
        
        # Decrement stock
        recipe_items = db.query(MenuItemRecipe).filter(
            MenuItemRecipe.menu_item_id == item_input.menu_item_id
        ).all()
        
        for ingredient in recipe_items:
            stock_item = db.query(StockItem).filter(
                StockItem.id == ingredient.stock_item_id
            ).first()
            
            if stock_item:
                total_to_reduce = ingredient.quantity_used * item_input.quantity
                stock_item.current_quantity -= total_to_reduce
                db.add(stock_item)
        
        # Add to totals
        total_revenue += price_entry.sale_price * item_input.quantity
        total_cost += cost_per_item * item_input.quantity
        
        # Get menu item name
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_input.menu_item_id).first()
        
        items_response.append(OrderItemResponse(
            id=order_item.id,
            menu_item_id=item_input.menu_item_id,
            menu_item_name=menu_item.name if menu_item else "Unknown",
            quantity=item_input.quantity,
            price_at_sale=price_entry.sale_price,
            cost_at_sale=cost_per_item
        ))
    
    db.commit()
    db.refresh(new_order)
    
    return OrderResponse(
        id=new_order.id,
        cafe_id=cafe_id,
        staff_id=order_data.staff_id,
        staff_name=staff.name,
        timestamp=order_timestamp,
        items=items_response,
        total_revenue=total_revenue,
        total_cost=total_cost
    )

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_and_restock(
    cafe_id: UUID,
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an order and restore stock (UNDO feature)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    try:
        # Get the order
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.cafe_id == cafe_id
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Begin transaction - restore stock for each item
        for item in order.items:
            recipe_items = db.query(MenuItemRecipe).filter(
                MenuItemRecipe.menu_item_id == item.menu_item_id
            ).all()
            
            for ingredient in recipe_items:
                stock_item = db.query(StockItem).filter(
                    StockItem.id == ingredient.stock_item_id
                ).first()
                
                if stock_item:
                    total_to_restore = ingredient.quantity_used * item.quantity
                    stock_item.current_quantity += total_to_restore
                    db.add(stock_item)
        
        # Delete the order (cascade will delete order_items)
        db.delete(order)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete order and restore stock: {str(e)}"
        )
