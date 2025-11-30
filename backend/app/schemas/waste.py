from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class MenuWasteBase(BaseModel):
    menu_item_id: UUID
    quantity: float
    reason: Optional[str] = None

class MenuWasteCreate(MenuWasteBase):
    pass

class MenuWasteResponse(MenuWasteBase):
    id: UUID
    cafe_id: UUID
    total_cost: float
    created_at: datetime
    menu_item_name: str

    class Config:
        from_attributes = True
