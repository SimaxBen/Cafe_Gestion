# Pricing and Costing Logic

## ✅ Daily Salary System

**Salaries are stored on a DAILY basis**, not monthly.

- Table: `staff_salary_history`
- Field: `daily_salary` (Numeric 10,3)
- When calculating costs for reports, the system sums up daily salaries for each day
- Salary history tracks changes over time with `start_date`

**Example:**
```
Staff: Ahmed
- From 2025-01-01: daily_salary = $50.00
- From 2025-02-01: daily_salary = $55.00 (raised)

Monthly cost calculation (January):
31 days × $50 = $1,550.00
```

## ✅ Historical Stock Cost Tracking

**Stock item costs are tracked historically**. When you change the price of a stock item, it only affects NEW purchases/orders, NOT existing inventory.

### How it works:

1. **Stock Cost History Table** (`stock_cost_history`)
   - Tracks all cost changes with `start_date`
   - When cost changes, a new record is added with today's date

2. **Order Cost Calculation**
   - When an order is created, the system looks up the cost that was valid on that specific date
   - Function: `calculate_menu_item_cost(db, menu_item_id, effective_date)`
   - Finds the most recent cost entry where `start_date <= order_date`

3. **Order Items Store Historical Data**
   - Each `order_item` stores `price_at_sale` and `cost_at_sale`
   - This preserves the exact profit/cost at the time of sale
   - Even if prices change later, past orders maintain their original values

### Example Scenario:

```
Stock Item: Coffee Beans (1kg)
- Jan 1-14: $10.00/kg
- Jan 15+: $12.00/kg (price increased)

Order created on Jan 10:
- Uses cost = $10.00/kg
- Stored in order_items.cost_at_sale = 10.00

Order created on Jan 20:
- Uses cost = $12.00/kg
- Stored in order_items.cost_at_sale = 12.00

Reports for January will correctly show:
- Orders 1-14: Used $10.00 cost
- Orders 15-31: Used $12.00 cost
```

## ✅ Menu Price History

Same logic applies to menu item prices:

- Table: `menu_price_history`
- When price changes, new record added with `start_date`
- Orders use the price that was valid on the order date
- Stored in `order_items.price_at_sale`

## Database Design Benefits

1. **Accurate Historical Reporting**
   - Calculate profit for any date range using actual costs/prices at that time
   - No guessing or approximation

2. **Audit Trail**
   - Complete history of all price and cost changes
   - Can answer "What was the cost on X date?"

3. **Fair Pricing**
   - New stock costs don't retroactively affect existing inventory
   - Previous orders maintain their original profit margins

## API Endpoints

### Stock Management

- `GET /cafes/{cafe_id}/stock` - Returns current cost for each item
- `PUT /cafes/{cafe_id}/stock/{item_id}/cost` - Add new cost entry (doesn't modify old data)
- `POST /cafes/{cafe_id}/stock/{item_id}/restock` - Add quantity (doesn't change cost)

### Staff Management

- `GET /cafes/{cafe_id}/staff` - Shows current daily salary
- `PUT /cafes/{cafe_id}/staff/{staff_id}/salary` - Add new salary entry with start_date
- `GET /cafes/{cafe_id}/staff/{staff_id}/salary-history` - View all salary changes

### Orders

- `POST /cafes/{cafe_id}/orders` - Creates order, automatically captures current prices and costs
- All cost calculations use `calculate_menu_item_cost()` which respects cost history

### Reports

- `GET /cafes/{cafe_id}/reports/daily?date=YYYY-MM-DD` - Daily profit using historical costs
- `GET /cafes/{cafe_id}/reports/monthly?month=YYYY-MM-01` - Monthly profit summing all daily costs
