from sqlalchemy import Column, String, ForeignKey, Boolean, TIMESTAMP, text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'server', 'barista', 'manager'
    email = Column(String)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    cafe = relationship("Cafe", back_populates="staff")
    salary_history = relationship("StaffSalaryHistory", back_populates="staff")
    orders = relationship("Order", back_populates="staff")

class StaffSalaryHistory(Base):
    __tablename__ = "staff_salary_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    daily_salary = Column(Numeric(10, 3), nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    
    # Relationships
    staff = relationship("Staff", back_populates="salary_history")
