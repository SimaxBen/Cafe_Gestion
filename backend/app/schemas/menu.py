from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    category_id: Optional[UUID] = None
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    sale_price: Decimal

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    image_url: Optional[str] = None

class MenuItemResponse(MenuItemBase):
    id: UUID
    cafe_id: UUID
    category_id: Optional[UUID] = None
    image_url: Optional[str] = None
    sale_price: Optional[Decimal] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Menu Price History Schemas
class MenuPriceHistoryCreate(BaseModel):
    sale_price: Decimal
    start_date: Optional[date] = None  # If None, use today

class MenuPriceHistoryResponse(BaseModel):
    id: UUID
    menu_item_id: UUID
    sale_price: Decimal
    start_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True

# Menu Item Recipe Schemas
class MenuItemRecipeCreate(BaseModel):
    stock_item_id: UUID
    quantity_used: Decimal

class MenuItemRecipeResponse(BaseModel):
    id: UUID
    menu_item_id: UUID
    stock_item_id: UUID
    quantity_used: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class MenuItemRecipeDetail(MenuItemRecipeResponse):
    stock_item_name: str
    unit_of_measure: str
