from fastapi import APIRouter
from app.api.v1.endpoints import auth, cafes, stock, menu, staff, orders, expenses, reports, admin, categories, upload, waste

api_router = APIRouter()

# Auth endpoints (no cafe_id prefix)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Upload endpoint
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])

# Admin endpoints
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Cafe management
api_router.include_router(cafes.router, prefix="/cafes", tags=["cafes"])

# Cafe-specific endpoints
api_router.include_router(stock.router, prefix="/cafes/{cafe_id}/stock", tags=["stock"])
api_router.include_router(menu.router, prefix="/cafes/{cafe_id}/menu", tags=["menu"])
api_router.include_router(categories.router, prefix="/cafes/{cafe_id}/categories", tags=["categories"])
api_router.include_router(staff.router, prefix="/cafes/{cafe_id}/staff", tags=["staff"])
api_router.include_router(orders.router, prefix="/cafes/{cafe_id}/orders", tags=["orders"])
api_router.include_router(expenses.router, prefix="/cafes/{cafe_id}/expenses", tags=["expenses"])
api_router.include_router(reports.router, prefix="/cafes/{cafe_id}/reports", tags=["reports"])
api_router.include_router(waste.router, prefix="/cafes/{cafe_id}/waste", tags=["waste"])
