# Import all models here for easy access
from app.models.user import User
from app.models.cafe import Cafe, UserCafeRole
from app.models.category import MenuCategory
from app.models.staff import Staff, StaffSalaryHistory
from app.models.stock import StockItem, StockCostHistory
from app.models.menu import MenuItem, MenuPriceHistory, MenuItemRecipe
from app.models.order import Order, OrderItem
from app.models.expense import MonthlyExpense, DailyExpense
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem

__all__ = [
    "User",
    "Cafe",
    "UserCafeRole",
    "MenuCategory",
    "Staff",
    "StaffSalaryHistory",
    "StockItem",
    "StockCostHistory",
    "MenuItem",
    "MenuPriceHistory",
    "MenuItemRecipe",
    "Order",
    "OrderItem",
    "MonthlyExpense",
    "DailyExpense",
    "Supplier",
    "PurchaseOrder",
    "PurchaseOrderItem",
]
