from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

# Cafe Schemas
class CafeBase(BaseModel):
    name: str
    address: Optional[str] = None
    currency_symbol: str = "$"

class CafeCreate(CafeBase):
    pass

class CafeUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    currency_symbol: Optional[str] = None

class CafeResponse(CafeBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Cafe Role Schemas
class UserCafeRoleBase(BaseModel):
    role: str  # 'owner', 'manager', 'server'

class UserCafeRoleCreate(UserCafeRoleBase):
    user_id: UUID
    cafe_id: UUID

class UserCafeRoleResponse(UserCafeRoleBase):
    user_id: UUID
    cafe_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
