from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# Staff Schemas
class StaffBase(BaseModel):
    name: str
    role: str  # 'server', 'barista', 'manager'
    email: Optional[str] = None
    phone: Optional[str] = None

class StaffCreate(StaffBase):
    daily_salary: Decimal

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class StaffResponse(StaffBase):
    id: UUID
    cafe_id: UUID
    is_active: bool
    created_at: datetime
    current_salary: Optional[Decimal] = None
    hire_date: Optional[date] = None
    
    class Config:
        from_attributes = True

# Staff Salary History Schemas
class StaffSalaryHistoryCreate(BaseModel):
    daily_salary: Decimal
    start_date: Optional[date] = None  # If None, use today

class StaffSalaryHistoryResponse(BaseModel):
    id: UUID
    staff_id: UUID
    daily_salary: Decimal
    start_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True
