from sqlalchemy import Column, ForeignKey, TIMESTAMP, text, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    staff_id = Column(UUID(as_uuid=True), ForeignKey('staff.id', ondelete='RESTRICT'), nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey('menu_items.id', ondelete='RESTRICT'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_sale = Column(Numeric(10, 3), nullable=False)
    cost_at_sale = Column(Numeric(10, 3), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
