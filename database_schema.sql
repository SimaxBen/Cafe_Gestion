-- =====================================================
-- Cafe Management System - PostgreSQL Database Schema
-- Multi-Tenant Architecture with Historical Tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE MULTI-TENANCY TABLES
-- =====================================================

-- Users table (Authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cafes table
CREATE TABLE cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    currency_symbol TEXT DEFAULT '$',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Cafe relationship with roles
CREATE TABLE user_cafe_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'server')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, cafe_id)
);

-- =====================================================
-- STAFF MANAGEMENT TABLES
-- =====================================================

-- Staff table (employees)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,  -- Custom roles allowed: 'barista', 'server', 'cleaner', or any custom value
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff salary history (for historical salary tracking)
CREATE TABLE staff_salary_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    daily_salary NUMERIC(10, 3) NOT NULL CHECK (daily_salary >= 0),
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (staff_id, start_date)
);

-- =====================================================
-- INVENTORY & STOCK MANAGEMENT TABLES
-- =====================================================

-- Stock items table
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    current_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
    unit_of_measure TEXT NOT NULL,
    low_stock_threshold NUMERIC(10, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cafe_id, name)
);

-- Stock transactions table (NEW)
CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity_change DECIMAL(10, 3) NOT NULL,
    transaction_type VARCHAR NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Stock cost history (for historical cost tracking)
CREATE TABLE stock_cost_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    cost_per_unit NUMERIC(10, 3) NOT NULL CHECK (cost_per_unit >= 0),
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (stock_item_id, start_date)
);

-- =====================================================
-- MENU MANAGEMENT TABLES
-- =====================================================

-- Menu items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cafe_id, name)
);

-- Menu price history (for historical price tracking)
CREATE TABLE menu_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    sale_price NUMERIC(10, 3) NOT NULL CHECK (sale_price >= 0),
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (menu_item_id, start_date)
);

-- Menu item recipes (links menu items to stock items)
CREATE TABLE menu_item_recipe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity_used NUMERIC(10, 3) NOT NULL CHECK (quantity_used > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (menu_item_id, stock_item_id)
);

-- =====================================================
-- SALES & ORDER TABLES
-- =====================================================

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale NUMERIC(10, 3) NOT NULL,
    cost_at_sale NUMERIC(10, 3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXPENSE MANAGEMENT TABLES
-- =====================================================

-- Monthly expenses table
CREATE TABLE monthly_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 3) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily expenses table (NEW)
CREATE TABLE daily_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 3) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUPPLIER & PURCHASE ORDER TABLES (ADVANCED FEATURES)
-- =====================================================

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cafe_id, name)
);

-- Purchase orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ
);

-- Purchase order items table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(10, 3) NOT NULL CHECK (quantity_ordered > 0),
    cost_per_unit NUMERIC(10, 3) NOT NULL CHECK (cost_per_unit >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User and cafe indexes
CREATE INDEX idx_cafes_owner_id ON cafes(owner_id);
CREATE INDEX idx_user_cafe_roles_user_id ON user_cafe_roles(user_id);
CREATE INDEX idx_user_cafe_roles_cafe_id ON user_cafe_roles(cafe_id);

-- Staff indexes
CREATE INDEX idx_staff_cafe_id ON staff(cafe_id);
CREATE INDEX idx_staff_salary_history_staff_id ON staff_salary_history(staff_id);
CREATE INDEX idx_staff_salary_history_start_date ON staff_salary_history(start_date);

-- Stock indexes
CREATE INDEX idx_stock_items_cafe_id ON stock_items(cafe_id);
CREATE INDEX idx_stock_transactions_item_id ON stock_transactions(stock_item_id);
CREATE INDEX idx_stock_cost_history_stock_item_id ON stock_cost_history(stock_item_id);
CREATE INDEX idx_stock_cost_history_start_date ON stock_cost_history(start_date);

-- Menu indexes
CREATE INDEX idx_menu_items_cafe_id ON menu_items(cafe_id);
CREATE INDEX idx_menu_price_history_menu_item_id ON menu_price_history(menu_item_id);
CREATE INDEX idx_menu_price_history_start_date ON menu_price_history(start_date);
CREATE INDEX idx_menu_item_recipe_menu_item_id ON menu_item_recipe(menu_item_id);
CREATE INDEX idx_menu_item_recipe_stock_item_id ON menu_item_recipe(stock_item_id);

-- Order indexes
CREATE INDEX idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX idx_orders_staff_id ON orders(staff_id);
CREATE INDEX idx_orders_timestamp ON orders(timestamp);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Expense indexes
CREATE INDEX idx_monthly_expenses_cafe_id ON monthly_expenses(cafe_id);
CREATE INDEX idx_monthly_expenses_month ON monthly_expenses(month);
CREATE INDEX idx_daily_expenses_cafe_id ON daily_expenses(cafe_id);
CREATE INDEX idx_daily_expenses_date ON daily_expenses(date);

-- Supplier indexes
CREATE INDEX idx_suppliers_cafe_id ON suppliers(cafe_id);
CREATE INDEX idx_purchase_orders_cafe_id ON purchase_orders(cafe_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to decrement stock (used when items are sold)
CREATE OR REPLACE FUNCTION decrement_stock(
    item_id UUID,
    amount_to_reduce NUMERIC
) RETURNS VOID AS $$
BEGIN
    UPDATE stock_items
    SET current_quantity = current_quantity - amount_to_reduce
    WHERE id = item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', item_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment stock (used when restocking or undoing orders)
CREATE OR REPLACE FUNCTION increment_stock(
    item_id UUID,
    amount_to_add NUMERIC
) RETURNS VOID AS $$
BEGIN
    UPDATE stock_items
    SET current_quantity = current_quantity + amount_to_add
    WHERE id = item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', item_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for cafes (users can only see cafes they have access to)
CREATE POLICY cafes_access_policy ON cafes
    FOR ALL
    USING (
        id IN (
            SELECT cafe_id FROM user_cafe_roles
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- Note: Additional RLS policies should be created for each table based on your security requirements
-- The above is just an example to show the pattern

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a sample user
-- INSERT INTO users (email, full_name, password_hash) VALUES
-- ('admin@cafe.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LS2LYBz1FZ1W');
-- Password: 'admin123' (hashed with bcrypt)

-- Insert a sample cafe
-- INSERT INTO cafes (name, address, owner_id) VALUES
-- ('Downtown Cafe', '123 Main St, City', (SELECT id FROM users WHERE email = 'admin@cafe.com'));

-- =====================================================
-- END OF SCHEMA
-- =====================================================
