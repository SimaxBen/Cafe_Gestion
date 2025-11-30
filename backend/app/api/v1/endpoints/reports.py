from typing import List
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import calendar
from app.core.database import get_db
from app.core.deps import get_current_user, verify_cafe_access
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.staff import Staff, StaffSalaryHistory
from app.models.expense import MonthlyExpense, DailyExpense
from app.schemas.report import DailyReportResponse, MonthlyReportResponse

router = APIRouter()

def get_daily_salary_cost(db: Session, cafe_id: UUID, target_date: date) -> Decimal:
    """Calculate total salary cost for a specific day"""
    total_salary = Decimal("0")
    
    staff_members = db.query(Staff).filter(
        Staff.cafe_id == cafe_id,
        Staff.is_active == True
    ).all()
    
    for staff in staff_members:
        # Get most recent salary valid for this date
        salary = db.query(StaffSalaryHistory).filter(
            StaffSalaryHistory.staff_id == staff.id,
            StaffSalaryHistory.start_date <= target_date
        ).order_by(StaffSalaryHistory.start_date.desc()).first()
        
        if salary:
            total_salary += salary.daily_salary
    
    return total_salary

def get_monthly_salary_cost(db: Session, cafe_id: UUID, month_date: date) -> Decimal:
    """Calculate total salary cost for an entire month"""
    total_salary = Decimal("0")
    days_in_month = calendar.monthrange(month_date.year, month_date.month)[1]
    
    # Sum up daily salaries for each day of the month
    for day in range(1, days_in_month + 1):
        current_date = month_date.replace(day=day)
        total_salary += get_daily_salary_cost(db, cafe_id, current_date)
    
    return total_salary

@router.get("/daily", response_model=DailyReportResponse)
async def get_daily_report(
    cafe_id: UUID,
    date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive daily profit report"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    # Define day boundaries
    start_of_day = datetime.combine(date, datetime.min.time())
    end_of_day = datetime.combine(date, datetime.max.time())
    
    # 1. Get Revenue and COGS
    order_items = db.query(OrderItem).join(Order).filter(
        Order.cafe_id == cafe_id,
        Order.timestamp >= start_of_day,
        Order.timestamp <= end_of_day
    ).all()
    
    total_revenue = sum(item.price_at_sale * item.quantity for item in order_items)
    total_cogs = sum(item.cost_at_sale * item.quantity for item in order_items)
    gross_profit = total_revenue - total_cogs
    
    # 2. Get Daily Salaries
    total_salaries = get_daily_salary_cost(db, cafe_id, date)
    
    # 3. Get Daily Expenses
    daily_expenses_sum = db.query(func.sum(DailyExpense.amount)).filter(
        DailyExpense.cafe_id == cafe_id,
        DailyExpense.date == date
    ).scalar() or Decimal("0")
    
    # 4. Get Pro-rated Monthly Expenses
    days_in_month = calendar.monthrange(date.year, date.month)[1]
    month_start = date.replace(day=1)
    
    monthly_expenses_sum = db.query(func.sum(MonthlyExpense.amount)).filter(
        MonthlyExpense.cafe_id == cafe_id,
        MonthlyExpense.month == month_start
    ).scalar() or Decimal("0")
    
    pro_rated_monthly = monthly_expenses_sum / Decimal(str(days_in_month))
    
    # 5. Calculate Net Profit
    total_costs = total_salaries + daily_expenses_sum + pro_rated_monthly
    net_profit = gross_profit - total_costs
    
    return DailyReportResponse(
        date=date,
        total_revenue=total_revenue,
        total_cogs=total_cogs,
        gross_profit=gross_profit,
        costs={
            "salaries": float(total_salaries),
            "daily_expenses": float(daily_expenses_sum),
            "pro_rated_monthly_expenses": float(pro_rated_monthly),
            "total_costs": float(total_costs)
        },
        net_profit=net_profit
    )

@router.get("/monthly", response_model=MonthlyReportResponse)
async def get_monthly_report(
    cafe_id: UUID,
    month: date,  # Should be first day of month
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive monthly profit report"""
    await verify_cafe_access(cafe_id, current_user, db)
    
    # Ensure month is first day
    month_start = month.replace(day=1)
    
    # Calculate end of month
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
    
    start_of_month = datetime.combine(month_start, datetime.min.time())
    end_of_month = datetime.combine(month_end, datetime.max.time())
    
    # 1. Get Revenue and COGS
    order_items = db.query(OrderItem).join(Order).filter(
        Order.cafe_id == cafe_id,
        Order.timestamp >= start_of_month,
        Order.timestamp <= end_of_month
    ).all()
    
    total_revenue = sum(item.price_at_sale * item.quantity for item in order_items)
    total_cogs = sum(item.cost_at_sale * item.quantity for item in order_items)
    gross_profit = total_revenue - total_cogs
    
    # 2. Get Monthly Salaries
    total_salaries = get_monthly_salary_cost(db, cafe_id, month_start)
    
    # 3. Get Monthly Expenses
    monthly_expenses_sum = db.query(func.sum(MonthlyExpense.amount)).filter(
        MonthlyExpense.cafe_id == cafe_id,
        MonthlyExpense.month == month_start
    ).scalar() or Decimal("0")
    
    # 4. Calculate Net Profit
    total_costs = total_salaries + monthly_expenses_sum
    net_profit = gross_profit - total_costs

    # 5. Calculate Daily Breakdown
    daily_stats = {}
    days_in_month = calendar.monthrange(month_start.year, month_start.month)[1]
    
    # Initialize all days
    for day in range(1, days_in_month + 1):
        current_date = month_start.replace(day=day)
        daily_stats[current_date] = {
            "revenue": Decimal("0"),
            "cogs": Decimal("0")
        }

    # Aggregate revenue/cogs from orders
    for item in order_items:
        order_date = item.order.timestamp.date()
        if order_date in daily_stats:
            daily_stats[order_date]["revenue"] += item.price_at_sale * item.quantity
            daily_stats[order_date]["cogs"] += item.cost_at_sale * item.quantity

    daily_reports_list = []
    for day in range(1, days_in_month + 1):
        current_date = month_start.replace(day=day)
        stats = daily_stats[current_date]
        
        # Get daily costs
        daily_salary = get_daily_salary_cost(db, cafe_id, current_date)
        daily_expense = db.query(func.sum(DailyExpense.amount)).filter(
            DailyExpense.cafe_id == cafe_id,
            DailyExpense.date == current_date
        ).scalar() or Decimal("0")
        
        # Gross Profit
        gross = stats["revenue"] - stats["cogs"]
        
        # Net Profit (Daily) - excluding monthly pro-rated for chart clarity, or include it?
        # Let's include pro-rated monthly expenses to match the total monthly profit logic roughly
        pro_rated_monthly = monthly_expenses_sum / Decimal(str(days_in_month))
        net = gross - daily_salary - daily_expense - pro_rated_monthly
        
        daily_reports_list.append({
            "date": current_date,
            "revenue": stats["revenue"],
            "profit": net
        })
    
    return MonthlyReportResponse(
        month=month_start,
        total_revenue=total_revenue,
        total_cogs=total_cogs,
        gross_profit=gross_profit,
        costs={
            "salaries": float(total_salaries),
            "monthly_expenses": float(monthly_expenses_sum),
            "total_costs": float(total_costs)
        },
        net_profit=net_profit,
        daily_reports=daily_reports_list
    )
