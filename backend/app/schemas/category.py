from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class MenuCategoryBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    icon: Optional[str] = '🍽️'
    color_from: Optional[str] = 'blue-400'
    color_to: Optional[str] = 'blue-600'
    bg_light: Optional[str] = 'blue-50'
    border_color: Optional[str] = 'blue-300'
    display_order: Optional[int] = 0

class MenuCategoryCreate(MenuCategoryBase):
    pass

class MenuCategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    icon: Optional[str] = None
    color_from: Optional[str] = None
    color_to: Optional[str] = None
    bg_light: Optional[str] = None
    border_color: Optional[str] = None
    display_order: Optional[int] = None

class MenuCategoryResponse(MenuCategoryBase):
    id: UUID
    cafe_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
