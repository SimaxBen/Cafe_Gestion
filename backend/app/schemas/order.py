from typing import List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

# Order Item Input
class OrderItemInput(BaseModel):
    menu_item_id: UUID
    quantity: int

# Order Create
class OrderCreate(BaseModel):
    staff_id: UUID
    items: List[OrderItemInput]
    timestamp: datetime = None  # If None, use current time

# Order Item Response
class OrderItemResponse(BaseModel):
    id: UUID
    menu_item_id: UUID
    menu_item_name: str
    quantity: int
    price_at_sale: Decimal
    cost_at_sale: Decimal
    
    class Config:
        from_attributes = True

# Order Response
class OrderResponse(BaseModel):
    id: UUID
    cafe_id: UUID
    staff_id: UUID
    staff_name: str
    timestamp: datetime
    items: List[OrderItemResponse]
    total_revenue: Decimal
    total_cost: Decimal
    
    class Config:
        from_attributes = True
