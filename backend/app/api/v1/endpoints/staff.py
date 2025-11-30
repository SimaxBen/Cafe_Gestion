from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.staff import Staff, StaffSalaryHistory
from app.schemas.staff import (
    StaffCreate, StaffUpdate, StaffResponse,
    StaffSalaryHistoryCreate, StaffSalaryHistoryResponse
)

router = APIRouter()

@router.get("", response_model=List[StaffResponse])
async def get_staff(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all staff for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    staff_list = db.query(Staff).filter(Staff.cafe_id == cafe_id).order_by(Staff.name).all()
    
    # Add current_salary and hire_date from salary history
    result = []
    for staff_member in staff_list:
        # Get current salary (most recent salary history)
        current_salary_record = db.query(StaffSalaryHistory).filter(
            StaffSalaryHistory.staff_id == staff_member.id
        ).order_by(StaffSalaryHistory.start_date.desc()).first()
        
        # Get hire date (earliest salary history)
        hire_date_record = db.query(StaffSalaryHistory).filter(
            StaffSalaryHistory.staff_id == staff_member.id
        ).order_by(StaffSalaryHistory.start_date.asc()).first()
        
        staff_dict = {
            "id": staff_member.id,
            "cafe_id": staff_member.cafe_id,
            "name": staff_member.name,
            "role": staff_member.role,
            "email": staff_member.email,
            "phone": staff_member.phone,
            "is_active": staff_member.is_active,
            "created_at": staff_member.created_at,
            "current_salary": current_salary_record.daily_salary if current_salary_record else None,
            "hire_date": hire_date_record.start_date if hire_date_record else staff_member.created_at.date()
        }
        result.append(StaffResponse(**staff_dict))
    
    return result

@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    cafe_id: UUID,
    staff_data: StaffCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new staff member"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    # Check if staff with same email already exists (if email provided)
    if staff_data.email:
        existing_staff = db.query(Staff).filter(
            Staff.cafe_id == cafe_id,
            Staff.email == staff_data.email
        ).first()
        
        if existing_staff:
            raise HTTPException(
                status_code=400,
                detail=f"موظف بالبريد الإلكتروني '{staff_data.email}' موجود بالفعل"
            )
    
    new_staff = Staff(
        cafe_id=cafe_id,
        name=staff_data.name,
        role=staff_data.role,
        email=staff_data.email,
        phone=staff_data.phone
    )
    db.add(new_staff)
    db.flush()
    
    # Create initial salary
    salary = StaffSalaryHistory(
        staff_id=new_staff.id,
        daily_salary=staff_data.daily_salary,
        start_date=date.today()
    )
    db.add(salary)
    db.commit()
    db.refresh(new_staff)
    
    return new_staff

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    cafe_id: UUID,
    staff_id: UUID,
    staff_data: StaffUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update staff member basic info (name, role, email, phone)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    staff = db.query(Staff).filter(
        Staff.id == staff_id,
        Staff.cafe_id == cafe_id
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.role is not None:
        staff.role = staff_data.role
    if staff_data.email is not None:
        staff.email = staff_data.email
    if staff_data.phone is not None:
        staff.phone = staff_data.phone
    
    db.commit()
    db.refresh(staff)
    
    return staff

@router.put("/{staff_id}/salary", response_model=StaffSalaryHistoryResponse)
async def update_staff_salary(
    cafe_id: UUID,
    staff_id: UUID,
    salary_data: StaffSalaryHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update staff salary (adds to history)"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    staff = db.query(Staff).filter(
        Staff.id == staff_id,
        Staff.cafe_id == cafe_id
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    new_salary = StaffSalaryHistory(
        staff_id=staff_id,
        daily_salary=salary_data.daily_salary,
        start_date=salary_data.start_date or date.today()
    )
    db.add(new_salary)
    db.commit()
    db.refresh(new_salary)
    
    return new_salary

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    cafe_id: UUID,
    staff_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a staff member"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    staff = db.query(Staff).filter(
        Staff.id == staff_id,
        Staff.cafe_id == cafe_id
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    db.delete(staff)
    db.commit()
