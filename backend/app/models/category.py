from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class MenuCategory(Base):
    __tablename__ = "menu_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    name_ar = Column(String)
    icon = Column(String, default='🍽️')
    color_from = Column(String, default='blue-400')
    color_to = Column(String, default='blue-600')
    bg_light = Column(String, default='blue-50')
    border_color = Column(String, default='blue-300')
    display_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="menu_categories")
    menu_items = relationship("MenuItem", back_populates="category")
