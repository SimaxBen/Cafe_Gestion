from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.expense import MonthlyExpense, DailyExpense
from app.schemas.expense import (
    MonthlyExpenseCreate, MonthlyExpenseUpdate, MonthlyExpenseResponse,
    DailyExpenseCreate, DailyExpenseUpdate, DailyExpenseResponse
)

router = APIRouter()

# Monthly Expenses
@router.get("/monthly", response_model=List[MonthlyExpenseResponse])
async def get_monthly_expenses(
    cafe_id: UUID,
    month: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly expenses for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    query = db.query(MonthlyExpense).filter(MonthlyExpense.cafe_id == cafe_id)
    
    if month:
        month_start = month.replace(day=1)
        query = query.filter(MonthlyExpense.month == month_start)
    
    expenses = query.order_by(MonthlyExpense.month.desc()).all()
    return expenses

@router.post("/monthly", response_model=MonthlyExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_monthly_expense(
    cafe_id: UUID,
    expense_data: MonthlyExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new monthly expense"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    new_expense = MonthlyExpense(
        cafe_id=cafe_id,
        month=expense_data.month.replace(day=1),  # Ensure first day of month
        description=expense_data.description,
        amount=expense_data.amount
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense

@router.put("/monthly/{expense_id}", response_model=MonthlyExpenseResponse)
async def update_monthly_expense(
    cafe_id: UUID,
    expense_id: UUID,
    expense_data: MonthlyExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a monthly expense"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    expense = db.query(MonthlyExpense).filter(
        MonthlyExpense.id == expense_id,
        MonthlyExpense.cafe_id == cafe_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense_data.description is not None:
        expense.description = expense_data.description
    if expense_data.amount is not None:
        expense.amount = expense_data.amount
    if expense_data.month is not None:
        expense.month = expense_data.month.replace(day=1)
    
    db.commit()
    db.refresh(expense)
    
    return expense

@router.delete("/monthly/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monthly_expense(
    cafe_id: UUID,
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a monthly expense"""
    await verify_cafe_access(cafe_id, current_user, db, required_role="manager")
    
    expense = db.query(MonthlyExpense).filter(
        MonthlyExpense.id == expense_id,
        MonthlyExpense.cafe_id == cafe_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()

# Daily Expenses
@router.get("/daily", response_model=List[DailyExpenseResponse])
async def get_daily_expenses(
    cafe_id: UUID,
    date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily expenses for a cafe"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    query = db.query(DailyExpense).filter(DailyExpense.cafe_id == cafe_id)
    
    if date:
        query = query.filter(DailyExpense.date == date)
    
    expenses = query.order_by(DailyExpense.date.desc()).all()
    return expenses

@router.post("/daily", response_model=DailyExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_expense(
    cafe_id: UUID,
    expense_data: DailyExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new daily expense"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    new_expense = DailyExpense(
        cafe_id=cafe_id,
        date=expense_data.date,
        description=expense_data.description,
        amount=expense_data.amount
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense

@router.put("/daily/{expense_id}", response_model=DailyExpenseResponse)
async def update_daily_expense(
    cafe_id: UUID,
    expense_id: UUID,
    expense_data: DailyExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a daily expense"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    expense = db.query(DailyExpense).filter(
        DailyExpense.id == expense_id,
        DailyExpense.cafe_id == cafe_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense_data.description is not None:
        expense.description = expense_data.description
    if expense_data.amount is not None:
        expense.amount = expense_data.amount
    if expense_data.date is not None:
        expense.date = expense_data.date
    
    db.commit()
    db.refresh(expense)
    
    return expense

@router.delete("/daily/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_expense(
    cafe_id: UUID,
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a daily expense"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    expense = db.query(DailyExpense).filter(
        DailyExpense.id == expense_id,
        DailyExpense.cafe_id == cafe_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
