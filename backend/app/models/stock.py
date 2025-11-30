from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class StockItem(Base):
    __tablename__ = "stock_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    current_quantity = Column(Numeric(10, 3), nullable=False, default=0)
    unit_of_measure = Column(String, nullable=False)
    low_stock_threshold = Column(Numeric(10, 3), default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="stock_items")
    cost_history = relationship("StockCostHistory", back_populates="stock_item", cascade="all, delete-orphan")
    recipe_uses = relationship("MenuItemRecipe", back_populates="stock_item", cascade="all, delete-orphan")
    transactions = relationship("StockTransaction", back_populates="stock_item", cascade="all, delete-orphan")

class StockCostHistory(Base):
    __tablename__ = "stock_cost_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_item_id = Column(UUID(as_uuid=True), ForeignKey('stock_items.id', ondelete='CASCADE'), nullable=False)
    cost_per_unit = Column(Numeric(10, 3), nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    stock_item = relationship("StockItem", back_populates="cost_history")

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_item_id = Column(UUID(as_uuid=True), ForeignKey('stock_items.id', ondelete='CASCADE'), nullable=False)
    quantity_change = Column(Numeric(10, 3), nullable=False)
    transaction_type = Column(String, nullable=False) # 'restock', 'usage', 'adjustment', 'initial'
    notes = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Relationships
    stock_item = relationship("StockItem", back_populates="transactions")
    user = relationship("User")
