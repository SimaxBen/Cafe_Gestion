from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class MonthlyExpense(Base):
    __tablename__ = "monthly_expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    month = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 3), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="monthly_expenses")

class DailyExpense(Base):
    __tablename__ = "daily_expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 3), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="daily_expenses")
