-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity_change DECIMAL(10, 3) NOT NULL,
    transaction_type VARCHAR NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(stock_item_id);
