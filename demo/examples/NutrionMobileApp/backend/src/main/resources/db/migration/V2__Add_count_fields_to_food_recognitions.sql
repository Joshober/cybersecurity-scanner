-- Migration: Add count-based quantity fields to food_recognitions table
-- These fields support count-based food quantity tracking (e.g., "2 apples", "3 slices")
-- Version: 2
-- Date: 2025-01-09

-- Add detected_count column for storing the number of items detected
-- Using DO block to check if column exists before adding (for PostgreSQL compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_recognitions' 
        AND column_name = 'detected_count'
    ) THEN
        ALTER TABLE food_recognitions ADD COLUMN detected_count INTEGER;
    END IF;
END $$;

-- Add detected_unit column for storing the unit of measurement (e.g., "pieces", "slices", "cups")
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_recognitions' 
        AND column_name = 'detected_unit'
    ) THEN
        ALTER TABLE food_recognitions ADD COLUMN detected_unit VARCHAR(50);
    END IF;
END $$;

-- Add detected_size_label column for storing size descriptions (e.g., "small", "medium", "large")
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_recognitions' 
        AND column_name = 'detected_size_label'
    ) THEN
        ALTER TABLE food_recognitions ADD COLUMN detected_size_label VARCHAR(50);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN food_recognitions.detected_count IS 'Number of food items detected (for count-based tracking)';
COMMENT ON COLUMN food_recognitions.detected_unit IS 'Unit of measurement for count-based tracking (e.g., pieces, slices, cups)';
COMMENT ON COLUMN food_recognitions.detected_size_label IS 'Size label for detected items (e.g., small, medium, large)';

