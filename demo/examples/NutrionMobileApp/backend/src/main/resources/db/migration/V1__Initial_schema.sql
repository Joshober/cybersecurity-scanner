-- Initial database schema for Nutrition App
-- This migration will be automatically applied by Flyway

-- Create nutrition_plans table first (no dependencies)
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age VARCHAR(50),
    sex VARCHAR(50),
    height VARCHAR(50),
    weight VARCHAR(50),
    formula_written VARCHAR(255),
    factor_name VARCHAR(255),
    factor_value VARCHAR(255),
    daily_calories VARCHAR(50),
    carbohydrates_g VARCHAR(50),
    proteins_g VARCHAR(50),
    fats_g VARCHAR(50),
    hydration VARCHAR(50),
    boron_mg VARCHAR(50),
    calcium_mg VARCHAR(50),
    iron_mg VARCHAR(50),
    selenium_ug VARCHAR(50),
    zinc_mg VARCHAR(50),
    sodium_mg VARCHAR(50)
);

-- Create users table (depends on nutrition_plans)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    weight VARCHAR(50),
    height VARCHAR(50),
    activity_level VARCHAR(50),
    vegan BOOLEAN DEFAULT FALSE,
    vegetarian BOOLEAN DEFAULT FALSE,
    daily_calories VARCHAR(50),
    carbohydrates_g VARCHAR(50),
    proteins_g VARCHAR(50),
    fats_g VARCHAR(50),
    boron_mg VARCHAR(50),
    calcium_mg VARCHAR(50),
    iron_mg VARCHAR(50),
    selenium_ug VARCHAR(50),
    zinc_mg VARCHAR(50),
    sodium_mg VARCHAR(50),
    nutrition_plan_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_users_nutrition_plan FOREIGN KEY (nutrition_plan_id) REFERENCES nutrition_plans(id)
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    meal_type VARCHAR(50),
    calories_per_100g DOUBLE PRECISION,
    protein_per_100g DOUBLE PRECISION,
    carbs_per_100g DOUBLE PRECISION,
    fat_per_100g DOUBLE PRECISION,
    fiber_per_100g DOUBLE PRECISION,
    feature_vector TEXT,
    prior_probability DOUBLE PRECISION,
    density_g_per_cm3 DOUBLE PRECISION,
    allergens VARCHAR(1000),
    ingredients VARCHAR(2000),
    search_keywords TEXT,
    lucene_doc_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create user_meals table
CREATE TABLE IF NOT EXISTS user_meals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    meal_date TIMESTAMP NOT NULL,
    meal_type VARCHAR(50),
    total_calories DOUBLE PRECISION,
    total_protein DOUBLE PRECISION,
    total_carbs DOUBLE PRECISION,
    total_fat DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_user_meals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create food_recognitions table
CREATE TABLE IF NOT EXISTS food_recognitions (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT,
    user_meal_id BIGINT,
    detected_food_name VARCHAR(255) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    is_from_menu BOOLEAN NOT NULL DEFAULT FALSE,
    segmentation_mask TEXT,
    bounding_box TEXT,
    estimated_area_pixels INTEGER,
    estimated_volume_cm3 DOUBLE PRECISION,
    estimated_weight_grams DOUBLE PRECISION,
    plate_radius_pixels INTEGER,
    estimated_depth_cm DOUBLE PRECISION,
    model_version VARCHAR(255),
    inference_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_recognitions_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    CONSTRAINT fk_food_recognitions_user_meal FOREIGN KEY (user_meal_id) REFERENCES user_meals(id) ON DELETE CASCADE
);

-- Create nutrition_entries table
CREATE TABLE IF NOT EXISTS nutrition_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    calories DOUBLE PRECISION,
    protein DOUBLE PRECISION,
    carbs DOUBLE PRECISION,
    fat DOUBLE PRECISION,
    fiber DOUBLE PRECISION,
    sugar DOUBLE PRECISION,
    sodium DOUBLE PRECISION,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_nutrition_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create nutrition_estimates table
CREATE TABLE IF NOT EXISTS nutrition_estimates (
    id BIGSERIAL PRIMARY KEY,
    food_recognition_id BIGINT NOT NULL,
    nutrient_name VARCHAR(255) NOT NULL,
    amount_per_100g DOUBLE PRECISION,
    estimated_amount DOUBLE PRECISION,
    unit VARCHAR(50),
    confidence_score DOUBLE PRECISION,
    source VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nutrition_estimates_food_recognition FOREIGN KEY (food_recognition_id) REFERENCES food_recognitions(id) ON DELETE CASCADE
);

-- Create portion_analyses table
CREATE TABLE IF NOT EXISTS portion_analyses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_path VARCHAR(500),
    food_items TEXT,
    confidence_scores TEXT,
    portion_sizes TEXT,
    estimated_calories DOUBLE PRECISION,
    estimated_protein DOUBLE PRECISION,
    estimated_carbs DOUBLE PRECISION,
    estimated_fat DOUBLE PRECISION,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_portion_analyses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create meal_of_day collection table (for UserMeals entity)
CREATE TABLE IF NOT EXISTS meal_of_day (
    user_meals_id BIGINT NOT NULL,
    meal VARCHAR(255),
    CONSTRAINT fk_meal_of_day_user_meals FOREIGN KEY (user_meals_id) REFERENCES user_meals(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_menu_items_location_date ON menu_items(location, date);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_user_meals_user_id ON user_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meals_meal_date ON user_meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_food_recognitions_user_meal_id ON food_recognitions(user_meal_id);
CREATE INDEX IF NOT EXISTS idx_food_recognitions_menu_item_id ON food_recognitions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_id ON nutrition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_entry_date ON nutrition_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_estimates_food_recognition_id ON nutrition_estimates(food_recognition_id);
CREATE INDEX IF NOT EXISTS idx_portion_analyses_user_id ON portion_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_portion_analyses_analysis_date ON portion_analyses(analysis_date);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE nutrition_plans IS 'Nutrition plans that can be assigned to users';
COMMENT ON TABLE menu_items IS 'Menu items from dining halls';
COMMENT ON TABLE user_meals IS 'User meal records with nutrition totals';
COMMENT ON TABLE food_recognitions IS 'Food recognition results from ML models';
COMMENT ON TABLE nutrition_entries IS 'Daily nutrition tracking entries';
COMMENT ON TABLE nutrition_estimates IS 'Detailed nutrition estimates for recognized foods';
COMMENT ON TABLE portion_analyses IS 'Portion size analysis results';
