from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('menu_categories.id', ondelete='SET NULL'), nullable=True)
    name = Column(String, nullable=False)
    image_url = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="menu_items")
    category = relationship("MenuCategory", back_populates="menu_items")
    price_history = relationship("MenuPriceHistory", back_populates="menu_item", cascade="all, delete-orphan")
    recipe = relationship("MenuItemRecipe", back_populates="menu_item", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="menu_item")

class MenuPriceHistory(Base):
    __tablename__ = "menu_price_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey('menu_items.id', ondelete='CASCADE'), nullable=False)
    sale_price = Column(Numeric(10, 3), nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="price_history")

class MenuItemRecipe(Base):
    __tablename__ = "menu_item_recipe"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey('menu_items.id', ondelete='CASCADE'), nullable=False)
    stock_item_id = Column(UUID(as_uuid=True), ForeignKey('stock_items.id', ondelete='CASCADE'), nullable=False)
    quantity_used = Column(Numeric(10, 3), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="recipe")
    stock_item = relationship("StockItem", back_populates="recipe_uses")

class MenuWaste(Base):
    __tablename__ = "menu_waste"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey('menu_items.id', ondelete='CASCADE'), nullable=False)
    quantity = Column(Numeric(10, 3), nullable=False)
    total_cost = Column(Numeric(10, 3), nullable=False)
    reason = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Relationships
    menu_item = relationship("MenuItem")
    user = relationship("User")
