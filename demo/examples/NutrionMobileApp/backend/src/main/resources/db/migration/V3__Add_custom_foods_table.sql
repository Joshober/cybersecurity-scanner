-- Migration: Add custom_foods table for user-added foods
-- This allows users to save foods they manually enter that aren't in the database

CREATE TABLE IF NOT EXISTS custom_foods (
    id BIGSERIAL PRIMARY KEY,
    food_name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Nutrition information (per 100g, consistent with menu_items)
    calories_per_100g DOUBLE PRECISION,
    protein_per_100g DOUBLE PRECISION,
    carbs_per_100g DOUBLE PRECISION,
    fat_per_100g DOUBLE PRECISION,
    fiber_per_100g DOUBLE PRECISION,
    sugar_per_100g DOUBLE PRECISION,
    sodium_per_100g DOUBLE PRECISION,
    -- Optional metadata
    brand VARCHAR(255),
    category VARCHAR(255),
    search_keywords TEXT,
    -- User who added it (optional, for future user-specific foods)
    added_by_user_id BIGINT,
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    -- Foreign key to users (optional)
    CONSTRAINT fk_custom_foods_user FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on food_name for faster searches
CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(food_name);

-- Create index on search_keywords for full-text search
CREATE INDEX IF NOT EXISTS idx_custom_foods_keywords ON custom_foods USING gin(to_tsvector('english', COALESCE(search_keywords, '')));

-- Create unique constraint to prevent exact duplicates (same name and brand)
-- Using a function-based unique index to handle NULL brands properly
-- This prevents exact duplicates: same food_name AND same brand (including NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_foods_unique 
ON custom_foods(food_name, (COALESCE(brand, '')));

-- Add comments for documentation
COMMENT ON TABLE custom_foods IS 'User-added custom foods that are not in the menu or USDA database';
COMMENT ON COLUMN custom_foods.food_name IS 'Name of the food item';
COMMENT ON COLUMN custom_foods.calories_per_100g IS 'Calories per 100g (consistent with menu_items format)';
COMMENT ON COLUMN custom_foods.usage_count IS 'Number of times this food has been used';
COMMENT ON COLUMN custom_foods.search_keywords IS 'Additional keywords for searching (comma-separated)';

