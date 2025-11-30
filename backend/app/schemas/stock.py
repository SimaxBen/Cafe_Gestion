from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# Stock Item Schemas
class StockItemBase(BaseModel):
    name: str
    unit_of_measure: str
    low_stock_threshold: Decimal = Decimal("0")

class StockItemCreate(StockItemBase):
    current_quantity: Decimal = Decimal("0")
    cost_per_unit: Decimal

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    unit_of_measure: Optional[str] = None
    low_stock_threshold: Optional[Decimal] = None

class StockItemResponse(StockItemBase):
    id: UUID
    cafe_id: UUID
    current_quantity: Decimal
    cost_per_unit: Decimal  # Current cost
    created_at: datetime
    
    class Config:
        from_attributes = True

# Stock Cost History Schemas
class StockCostHistoryCreate(BaseModel):
    cost_per_unit: Decimal
    start_date: date = None  # If None, use today

class StockCostHistoryResponse(BaseModel):
    id: UUID
    stock_item_id: UUID
    cost_per_unit: Decimal
    start_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True

# Restock Request
class RestockRequest(BaseModel):
    quantity: Decimal
    cost_per_unit: Optional[Decimal] = None
    notes: Optional[str] = None

# Waste Request
class WasteRequest(BaseModel):
    quantity: Decimal
    reason: str

class StockTransactionResponse(BaseModel):
    id: UUID
    stock_item_id: UUID
    quantity_change: Decimal
    transaction_type: str
    notes: Optional[str] = None
    created_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True

class StockTransactionWithItemResponse(StockTransactionResponse):
    stock_item_name: str
