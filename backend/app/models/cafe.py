from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Cafe(Base):
    __tablename__ = "cafes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    address = Column(String)
    currency_symbol = Column(String, default='$')
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    owner = relationship("User", back_populates="owned_cafes")
    user_roles = relationship("UserCafeRole", back_populates="cafe")
    staff = relationship("Staff", back_populates="cafe")
    stock_items = relationship("StockItem", back_populates="cafe")
    menu_items = relationship("MenuItem", back_populates="cafe")
    menu_categories = relationship("MenuCategory", back_populates="cafe")
    orders = relationship("Order", back_populates="cafe")
    monthly_expenses = relationship("MonthlyExpense", back_populates="cafe")
    daily_expenses = relationship("DailyExpense", back_populates="cafe")
    suppliers = relationship("Supplier", back_populates="cafe")

class UserCafeRole(Base):
    __tablename__ = "user_cafe_roles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), primary_key=True)
    role = Column(String, nullable=False)  # 'owner', 'manager', 'server'
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    user = relationship("User", back_populates="cafe_roles")
    cafe = relationship("Cafe", back_populates="user_roles")
