from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="suppliers")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id', ondelete='RESTRICT'), nullable=False)
    status = Column(String, nullable=False, default='draft')  # 'draft', 'sent', 'received'
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    received_at = Column(TIMESTAMP(timezone=True))
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    stock_item_id = Column(UUID(as_uuid=True), ForeignKey('stock_items.id', ondelete='RESTRICT'), nullable=False)
    quantity_ordered = Column(Numeric(10, 3), nullable=False)
    cost_per_unit = Column(Numeric(10, 3), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
