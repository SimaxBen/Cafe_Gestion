from typing import Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# Monthly Expense Schemas
class MonthlyExpenseBase(BaseModel):
    description: str
    amount: Decimal

class MonthlyExpenseCreate(MonthlyExpenseBase):
    month: date  # Should be first day of month

class MonthlyExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[Decimal] = None

class MonthlyExpenseResponse(MonthlyExpenseBase):
    id: UUID
    cafe_id: UUID
    month: date
    created_at: datetime
    
    class Config:
        from_attributes = True

# Daily Expense Schemas
class DailyExpenseBase(BaseModel):
    description: str
    amount: Decimal

class DailyExpenseCreate(DailyExpenseBase):
    date: date

class DailyExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[Decimal] = None

class DailyExpenseResponse(DailyExpenseBase):
    id: UUID
    cafe_id: UUID
    date: date
    created_at: datetime
    
    class Config:
        from_attributes = True
