# Backend API Summary

## Complete CRUD Operations

All backend APIs now support full CRUD operations with proper historical tracking.

### Staff API (`/api/v1/staff`)

✅ **GET** `""` - List all staff members for a cafe
✅ **POST** `""` - Create new staff member (creates initial salary history)
✅ **PUT** `/{staff_id}` - Update staff basic info (name, role, email, phone)
✅ **PUT** `/{staff_id}/salary` - Update salary (creates new history record, does NOT modify old records)
✅ **DELETE** `/{staff_id}` - Delete staff member
✅ **GET** `/{staff_id}/salary-history` - Get salary history

**Historical Tracking:**
- Salaries stored in `staff_salary_history` with `daily_salary` (daily-based)
- Each salary update creates NEW record with `start_date`
- Old salary records preserved for historical costing

### Stock API (`/api/v1/stock`)

✅ **GET** `""` - List all stock items (includes current cost from history)
✅ **POST** `""` - Create new stock item (creates initial cost history)
✅ **PUT** `/{item_id}` - Update stock basic info (name, unit_of_measure, low_stock_threshold)
✅ **PUT** `/{item_id}/cost` - Update cost (creates new history record, only affects NEW restocking)
✅ **POST** `/{item_id}/restock` - Restock item (uses current cost at time of restock)
✅ **DELETE** `/{item_id}` - Delete stock item

**Historical Tracking:**
- Costs stored in `stock_cost_history` with `cost_per_unit` and `start_date`
- Each cost update creates NEW record
- Old costs preserved - existing stock keeps old cost, only NEW restocking uses new cost
- Stock response includes current `cost_per_unit` from latest history record

### Menu API (`/api/v1/menu`)

✅ **GET** `""` - List all menu items
✅ **POST** `""` - Create new menu item (creates initial price history)
✅ **PUT** `/{item_id}` - Update menu item basic info (name)
✅ **PUT** `/{item_id}/price` - Update sale price (creates new history record)
✅ **GET** `/{item_id}/recipe` - Get recipe ingredients
✅ **POST** `/{item_id}/recipe` - Add recipe ingredient
✅ **DELETE** `/{item_id}/recipe/{recipe_id}` - Remove recipe ingredient
✅ **DELETE** `/{item_id}` - Delete menu item

**Historical Tracking:**
- Prices stored in `menu_price_history` with `sale_price` and `start_date`
- Each price update creates NEW record
- Old prices preserved for order history

### Orders API (`/api/v1/orders`)

✅ **GET** `""` - List orders (with date filtering)
✅ **POST** `""` - Create order (stores `cost_at_sale`, `price_at_sale` at order time)
✅ **DELETE** `/{order_id}` - Delete order (RESTORES stock quantities)

**Historical Costing:**
- `calculate_menu_item_cost()` uses historical costs based on order date
- Each order item stores `cost_at_sale` and `price_at_sale` (frozen at order time)
- Deleting order restores stock via `delete_order_and_restock()`

### Expenses API (`/api/v1/expenses`)

✅ **GET** `/monthly` - List monthly expenses (with month filtering)
✅ **POST** `/monthly` - Create monthly expense
✅ **PUT** `/monthly/{expense_id}` - Update monthly expense
✅ **DELETE** `/monthly/{expense_id}` - Delete monthly expense

✅ **GET** `/daily` - List daily expenses (with date filtering)
✅ **POST** `/daily` - Create daily expense
✅ **PUT** `/daily/{expense_id}` - Update daily expense
✅ **DELETE** `/daily/{expense_id}` - Delete daily expense

### Reports API (`/api/v1/reports`)

✅ **GET** `/daily` - Daily report with revenue, costs, expenses, salaries, profit
✅ **GET** `/monthly` - Monthly summary report

## Key Features

### 1. Historical Tracking System
- **Staff Salaries**: Daily-based (`daily_salary` in `staff_salary_history`)
- **Stock Costs**: Per-unit basis, only affects NEW restocking
- **Menu Prices**: Sale prices tracked with start dates

### 2. Order Costing
- Orders calculate cost using historical data based on order date
- `cost_at_sale` and `price_at_sale` frozen at order time
- Past orders remain accurate even after price/cost changes

### 3. Stock Management
- Changing stock cost only affects FUTURE restocking
- Existing stock retains old cost basis
- Order deletion restores stock quantities

### 4. Complete CRUD
- All entities can be created, read, updated, and deleted
- Updates to prices/costs/salaries create history records (append-only)
- Updates to basic info modify the entity directly

## Testing Workflow

1. **Create items with initial prices:**
   ```
   POST /stock -> creates stock with cost $5
   POST /menu -> creates menu item with price $10
   ```

2. **Create orders (uses current prices):**
   ```
   POST /orders -> order stores cost=$5, price=$10
   ```

3. **Change prices:**
   ```
   PUT /stock/{id}/cost -> new cost $7 (creates history)
   PUT /menu/{id}/price -> new price $12 (creates history)
   ```

4. **Create new orders (uses NEW prices):**
   ```
   POST /orders -> order stores cost=$7, price=$12
   ```

5. **Verify old orders unchanged:**
   ```
   GET /orders -> first order still shows cost=$5, price=$10
   ```

6. **Delete order:**
   ```
   DELETE /orders/{id} -> stock quantity restored
   ```

## Frontend Integration

All frontend pages should now work with these updated endpoints:

- **StockPage**: Can update name/unit/threshold separately from cost
- **MenuPage**: Can update name separately from price
- **StaffPage**: Can update basic info separately from salary
- **ExpensesPage**: Can update descriptions and amounts
- **OrdersPage**: Delete restores stock
- **ReportsPage**: Gets historical data correctly

## Database Schema

All historical tables use this pattern:
```sql
CREATE TABLE {entity}_history (
    id UUID PRIMARY KEY,
    {entity}_id UUID REFERENCES {entity}(id),
    {value_field} NUMERIC(10,2),  -- e.g., daily_salary, cost_per_unit, sale_price
    start_date DATE NOT NULL,
    created_at TIMESTAMP
);
```

Queries use `ORDER BY start_date DESC LIMIT 1` to get current values.
