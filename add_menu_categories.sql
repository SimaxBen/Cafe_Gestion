-- Add menu categories table
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    icon TEXT DEFAULT '',
    color_from TEXT DEFAULT 'blue-400',
    color_to TEXT DEFAULT 'blue-600',
    bg_light TEXT DEFAULT 'blue-50',
    border_color TEXT DEFAULT 'blue-300',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cafe_id, name)
);

-- Add category_id to menu_items
ALTER TABLE menu_items ADD COLUMN category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_categories_cafe_id ON menu_categories(cafe_id);

-- Trigger for updated_at
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
