from typing import Optional
from uuid import UUID
from datetime import date
from decimal import Decimal
from pydantic import BaseModel

# Daily Report Schema
class DailyReportResponse(BaseModel):
    date: date
    total_revenue: Decimal
    total_cogs: Decimal
    gross_profit: Decimal
    costs: dict  # Contains breakdown of costs
    net_profit: Decimal

# Monthly Report Schema
class MonthlyReportResponse(BaseModel):
    month: date
    total_revenue: Decimal
    total_cogs: Decimal
    gross_profit: Decimal
    costs: dict  # Contains breakdown of costs
    net_profit: Decimal
    daily_reports: list[dict] = []
