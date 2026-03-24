package com.nutrition.service;

import com.nutrition.model.MenuItem;
import com.nutrition.repository.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SimpleQuantifyService {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleQuantifyService.class);
    
    // Validation constants
    private static final double MAX_WEIGHT_GRAMS = 1000.0; // Maximum reasonable weight per food item
    private static final double MAX_CALORIES_PER_ITEM = 1500.0; // Maximum calories per food item
    private static final double MIN_CALORIES_PER_ITEM = 5.0; // Minimum calories per food item
    private static final double MIN_CALORIES_PER_100G = 50.0; // Minimum reasonable calories per 100g
    private static final double MAX_CALORIES_PER_100G = 600.0; // Maximum reasonable calories per 100g
    private static final double MIN_PIXELS_PER_CM = 0.1; // Minimum pixels per cm (validation)
    private static final double MAX_PIXELS_PER_CM = 1000.0; // Maximum pixels per cm (validation)
    
    @Autowired
    private MenuItemRepository menuItemRepository;
    
    private final double defaultDensity = 0.65; // More accurate default based on average food density
    
    // Updated food densities based on USDA and research data
    private final Map<String, Double> foodDensities = new java.util.HashMap<>();
    {
        // Grains and starches
        foodDensities.put("rice", 0.85);          // Cooked rice
        foodDensities.put("pasta", 0.65);         // Cooked pasta
        foodDensities.put("bread", 0.25);         // Bread
        foodDensities.put("potato", 0.70);        // Cooked potatoes
        
        // Proteins
        foodDensities.put("meat", 1.05);          // Cooked meat
        foodDensities.put("chicken", 1.00);       // Cooked chicken
        foodDensities.put("beef", 1.10);          // Cooked beef
        foodDensities.put("fish", 0.95);          // Cooked fish
        foodDensities.put("bacon", 0.40);         // Cooked bacon
        
        // Vegetables
        foodDensities.put("vegetables", 0.40);    // General vegetables
        foodDensities.put("salad", 0.20);         // Leafy greens
        foodDensities.put("broccoli", 0.35);      // Broccoli
        foodDensities.put("carrot", 0.65);        // Carrots
        
        // Eggs
        foodDensities.put("egg", 0.55);           // Scrambled eggs
        foodDensities.put("scrambled", 0.55);     // Scrambled eggs
    }
    
    /**
     * Convert area to volume to grams using food densities
     */
    public QuantificationResult quantifyFood(
            String foodName, 
            double areaPixels, 
            double depthCm, 
            double pixelsPerCm,
            String location,
            String mealType) {
        
        try {
            // Validate pixelsPerCm parameter
            if (pixelsPerCm <= MIN_PIXELS_PER_CM || pixelsPerCm > MAX_PIXELS_PER_CM) {
                logger.warn("Invalid pixelsPerCm value: {} for food: {}. Using default estimate.", pixelsPerCm, foodName);
                pixelsPerCm = 10.0; // Default fallback: 10 pixels per cm
            }
            
            // Validate depth
            if (depthCm <= 0 || depthCm > 20.0) {
                logger.warn("Invalid depthCm value: {} for food: {}. Using default estimate.", depthCm, foodName);
                depthCm = 2.0; // Default fallback: 2cm
            }
            
            // Calculate area in cm²
            double areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
            
            // Validate area calculation
            if (areaCm2 <= 0 || areaCm2 > 10000.0) { // Max 10000 cm² = 1 m² (unrealistic for food)
                logger.warn("Unrealistic area calculation: {} cm² for food: {}. Area pixels: {}, pixelsPerCm: {}", 
                           areaCm2, foodName, areaPixels, pixelsPerCm);
            }
            
            // Calculate volume in cm³
            double volumeCm3 = areaCm2 * depthCm;
            
            // Validate volume calculation
            if (volumeCm3 > 10000.0) { // Max 10000 cm³ = 10L (unrealistic for single food item)
                logger.warn("Unrealistic volume calculation: {} cm³ for food: {}. Capping to reasonable maximum.", 
                           volumeCm3, foodName);
                volumeCm3 = 10000.0;
            }
            
            // Get food density
            double density = getFoodDensity(foodName, location, mealType);
            
            // Calculate weight in grams
            double weightGrams = volumeCm3 * density;
            
            // Cap weight to maximum reasonable value
            if (weightGrams > MAX_WEIGHT_GRAMS) {
                logger.warn("Weight {}g exceeds maximum {}g for food: {}. Capping to maximum.", 
                           weightGrams, MAX_WEIGHT_GRAMS, foodName);
                weightGrams = MAX_WEIGHT_GRAMS;
            }
            
            // Ensure minimum weight (at least 1g)
            if (weightGrams < 1.0) {
                logger.warn("Weight {}g is too small for food: {}. Setting to minimum 1g.", weightGrams, foodName);
                weightGrams = 1.0;
            }
            
            // Get nutritional information
            NutritionalInfo nutritionalInfo = getNutritionalInfo(foodName, weightGrams, location, mealType);
            
            QuantificationResult result = new QuantificationResult();
            result.setFoodName(foodName);
            result.setAreaPixels(areaPixels);
            result.setAreaCm2(areaCm2);
            result.setDepthCm(depthCm);
            result.setVolumeCm3(volumeCm3);
            result.setDensityGPerCm3(density);
            result.setWeightGrams(weightGrams);
            result.setNutritionalInfo(nutritionalInfo);
            result.setConfidence(calculateQuantificationConfidence(foodName, density, volumeCm3));
            
            logger.info("Quantified {}: {}g (area: {}cm², volume: {}cm³, density: {}g/cm³)", 
                       foodName, weightGrams, areaCm2, volumeCm3, density);
            
            return result;
            
        } catch (Exception e) {
            logger.error("Failed to quantify food: {}", foodName, e);
            return createMockQuantificationResult(foodName, areaPixels, depthCm);
        }
    }
    
    /**
     * Get food density from database or defaults
     */
    private double getFoodDensity(String foodName, String location, String mealType) {
        // First, try to find in menu items
        List<MenuItem> menuItems = menuItemRepository.findByNameContainingIgnoreCase(foodName);
        for (MenuItem item : menuItems) {
            if (item.getDensityGPerCm3() != null) {
                return item.getDensityGPerCm3();
            }
        }
        
        // Then try predefined densities
        String lowerFoodName = foodName.toLowerCase();
        for (Map.Entry<String, Double> entry : foodDensities.entrySet()) {
            if (lowerFoodName.contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }
        
        // Use default density
        return defaultDensity;
    }
    
    /**
     * Get nutritional information for quantified food
     */
    private NutritionalInfo getNutritionalInfo(String foodName, double weightGrams, String location, String mealType) {
        NutritionalInfo info = new NutritionalInfo();
        
        // Try to find in menu items first
        List<MenuItem> menuItems = menuItemRepository.findByNameContainingIgnoreCase(foodName);
        MenuItem bestMatch = null;
        
        for (MenuItem item : menuItems) {
            if (item.getCaloriesPer100g() != null) {
                // Validate calories per 100g is reasonable
                double caloriesPer100g = item.getCaloriesPer100g();
                if (caloriesPer100g < MIN_CALORIES_PER_100G || caloriesPer100g > MAX_CALORIES_PER_100G) {
                    logger.warn("MenuItem '{}' has unrealistic caloriesPer100g: {}. Expected range: {}-{}. Skipping this item.", 
                               item.getName(), caloriesPer100g, MIN_CALORIES_PER_100G, MAX_CALORIES_PER_100G);
                    continue; // Skip this item and look for another
                }
                bestMatch = item;
                break;
            }
        }
        
        if (bestMatch != null) {
            // Use menu item nutritional data
            double factor = weightGrams / 100.0; // Convert to per-100g basis
            
            double calories = bestMatch.getCaloriesPer100g() * factor;
            double protein = bestMatch.getProteinPer100g() != null ? bestMatch.getProteinPer100g() * factor : 0.0;
            double carbs = bestMatch.getCarbsPer100g() != null ? bestMatch.getCarbsPer100g() * factor : 0.0;
            double fat = bestMatch.getFatPer100g() != null ? bestMatch.getFatPer100g() * factor : 0.0;
            double fiber = bestMatch.getFiberPer100g() != null ? bestMatch.getFiberPer100g() * factor : 0.0;
            
            // Cap calories to maximum
            if (calories > MAX_CALORIES_PER_ITEM) {
                logger.warn("Calories {} kcal exceed maximum {} kcal for food: {}. Capping to maximum.", 
                           calories, MAX_CALORIES_PER_ITEM, foodName);
                calories = MAX_CALORIES_PER_ITEM;
            }
            
            // Ensure minimum calories
            if (calories < MIN_CALORIES_PER_ITEM) {
                logger.warn("Calories {} kcal are too low for food: {}. Setting to minimum {} kcal.", 
                           calories, foodName, MIN_CALORIES_PER_ITEM);
                calories = MIN_CALORIES_PER_ITEM;
            }
            
            info.setCalories(calories);
            info.setProtein(Math.max(0.0, protein));
            info.setCarbs(Math.max(0.0, carbs));
            info.setFat(Math.max(0.0, fat));
            info.setFiber(Math.max(0.0, fiber));
            info.setSource("menu_item");
            info.setConfidence(0.9);
            
        } else {
            // Use estimated nutritional data
            info = getEstimatedNutritionalInfo(foodName, weightGrams);
        }
        
        return info;
    }
    
    /**
     * Get estimated nutritional information from heuristics
     */
    private NutritionalInfo getEstimatedNutritionalInfo(String foodName, double weightGrams) {
        NutritionalInfo info = new NutritionalInfo();
        String lowerFoodName = foodName.toLowerCase();
        
        double calories;
        double protein;
        double carbs;
        double fat;
        double fiber;
        
        // Simple heuristics based on food type
        if (lowerFoodName.contains("chicken") || lowerFoodName.contains("meat")) {
            calories = 165.0 * weightGrams / 100.0;
            protein = 31.0 * weightGrams / 100.0;
            carbs = 0.0;
            fat = 3.6 * weightGrams / 100.0;
            fiber = 0.0;
        } else if (lowerFoodName.contains("rice") || lowerFoodName.contains("pasta")) {
            calories = 130.0 * weightGrams / 100.0;
            protein = 2.7 * weightGrams / 100.0;
            carbs = 28.0 * weightGrams / 100.0;
            fat = 0.3 * weightGrams / 100.0;
            fiber = 0.4 * weightGrams / 100.0;
        } else if (lowerFoodName.contains("vegetable") || lowerFoodName.contains("salad")) {
            calories = 25.0 * weightGrams / 100.0;
            protein = 1.0 * weightGrams / 100.0;
            carbs = 5.0 * weightGrams / 100.0;
            fat = 0.2 * weightGrams / 100.0;
            fiber = 2.0 * weightGrams / 100.0;
        } else if (lowerFoodName.contains("bread")) {
            calories = 265.0 * weightGrams / 100.0;
            protein = 9.0 * weightGrams / 100.0;
            carbs = 49.0 * weightGrams / 100.0;
            fat = 3.2 * weightGrams / 100.0;
            fiber = 2.7 * weightGrams / 100.0;
        } else {
            // Default values
            calories = 100.0 * weightGrams / 100.0;
            protein = 5.0 * weightGrams / 100.0;
            carbs = 15.0 * weightGrams / 100.0;
            fat = 2.0 * weightGrams / 100.0;
            fiber = 1.0 * weightGrams / 100.0;
        }
        
        // Cap calories to maximum
        if (calories > MAX_CALORIES_PER_ITEM) {
            logger.warn("Estimated calories {} kcal exceed maximum {} kcal for food: {}. Capping to maximum.", 
                       calories, MAX_CALORIES_PER_ITEM, foodName);
            calories = MAX_CALORIES_PER_ITEM;
        }
        
        // Ensure minimum calories
        if (calories < MIN_CALORIES_PER_ITEM) {
            calories = MIN_CALORIES_PER_ITEM;
        }
        
        info.setCalories(calories);
        info.setProtein(Math.max(0.0, protein));
        info.setCarbs(Math.max(0.0, carbs));
        info.setFat(Math.max(0.0, fat));
        info.setFiber(Math.max(0.0, fiber));
        info.setSource("estimated");
        info.setConfidence(0.6);
        
        return info;
    }
    
    /**
     * Calculate confidence in quantification
     */
    private double calculateQuantificationConfidence(String foodName, double density, double volumeCm3) {
        double confidence = 0.5; // Base confidence
        
        // Boost confidence if we have density data
        if (density != defaultDensity) {
            confidence += 0.2;
        }
        
        // Boost confidence for reasonable volume estimates
        if (volumeCm3 > 1.0 && volumeCm3 < 1000.0) {
            confidence += 0.2;
        }
        
        // Boost confidence for known foods
        if (isKnownFood(foodName)) {
            confidence += 0.1;
        }
        
        return Math.min(1.0, confidence);
    }
    
    /**
     * Check if food is in our known foods list
     */
    private boolean isKnownFood(String foodName) {
        String lowerFoodName = foodName.toLowerCase();
        
        String[] knownFoods = {
            "chicken", "beef", "pork", "fish", "rice", "pasta", "bread", "potato",
            "carrot", "broccoli", "lettuce", "tomato", "onion", "apple", "banana",
            "pizza", "burger", "sandwich", "salad", "soup", "cheese", "milk", "egg"
        };
        
        for (String knownFood : knownFoods) {
            if (lowerFoodName.contains(knownFood)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Create mock quantification result for testing
     */
    private QuantificationResult createMockQuantificationResult(String foodName, double areaPixels, double depthCm) {
        QuantificationResult result = new QuantificationResult();
        
        result.setFoodName(foodName);
        result.setAreaPixels(areaPixels);
        result.setAreaCm2(areaPixels / 100.0); // Assume 10 pixels per cm
        result.setDepthCm(depthCm);
        result.setVolumeCm3(result.getAreaCm2() * depthCm);
        result.setDensityGPerCm3(1.0);
        result.setWeightGrams(result.getVolumeCm3() * result.getDensityGPerCm3());
        result.setConfidence(0.7);
        
        // Mock nutritional info
        NutritionalInfo info = new NutritionalInfo();
        info.setCalories(150.0);
        info.setProtein(10.0);
        info.setCarbs(20.0);
        info.setFat(5.0);
        info.setFiber(2.0);
        info.setSource("mock");
        info.setConfidence(0.5);
        
        result.setNutritionalInfo(info);
        
        return result;
    }
    
    /**
     * Batch quantify multiple food items
     */
    public List<QuantificationResult> quantifyMultipleFoods(List<FoodItem> foodItems, double pixelsPerCm) {
        List<QuantificationResult> results = new ArrayList<>();
        
        for (FoodItem item : foodItems) {
            QuantificationResult result = quantifyFood(
                item.getFoodName(),
                item.getAreaPixels(),
                item.getDepthCm(),
                pixelsPerCm,
                item.getLocation(),
                item.getMealType()
            );
            results.add(result);
        }
        
        return results;
    }
    
    // Inner classes
    public static class QuantificationResult {
        private String foodName;
        private double areaPixels;
        private double areaCm2;
        private double depthCm;
        private double volumeCm3;
        private double densityGPerCm3;
        private double weightGrams;
        private NutritionalInfo nutritionalInfo;
        private double confidence;
        
        public String getFoodName() { return foodName; }
        public void setFoodName(String foodName) { this.foodName = foodName; }
        public double getAreaPixels() { return areaPixels; }
        public void setAreaPixels(double areaPixels) { this.areaPixels = areaPixels; }
        public double getAreaCm2() { return areaCm2; }
        public void setAreaCm2(double areaCm2) { this.areaCm2 = areaCm2; }
        public double getDepthCm() { return depthCm; }
        public void setDepthCm(double depthCm) { this.depthCm = depthCm; }
        public double getVolumeCm3() { return volumeCm3; }
        public void setVolumeCm3(double volumeCm3) { this.volumeCm3 = volumeCm3; }
        public double getDensityGPerCm3() { return densityGPerCm3; }
        public void setDensityGPerCm3(double densityGPerCm3) { this.densityGPerCm3 = densityGPerCm3; }
        public double getWeightGrams() { return weightGrams; }
        public void setWeightGrams(double weightGrams) { this.weightGrams = weightGrams; }
        public NutritionalInfo getNutritionalInfo() { return nutritionalInfo; }
        public void setNutritionalInfo(NutritionalInfo nutritionalInfo) { this.nutritionalInfo = nutritionalInfo; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
    
    public static class NutritionalInfo {
        private double calories;
        private double protein;
        private double carbs;
        private double fat;
        private double fiber;
        private String source;
        private double confidence;
        
        public double getCalories() { return calories; }
        public void setCalories(double calories) { this.calories = calories; }
        public double getProtein() { return protein; }
        public void setProtein(double protein) { this.protein = protein; }
        public double getCarbs() { return carbs; }
        public void setCarbs(double carbs) { this.carbs = carbs; }
        public double getFat() { return fat; }
        public void setFat(double fat) { this.fat = fat; }
        public double getFiber() { return fiber; }
        public void setFiber(double fiber) { this.fiber = fiber; }
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
    
    public static class FoodItem {
        private String foodName;
        private double areaPixels;
        private double depthCm;
        private String location;
        private String mealType;
        
        public FoodItem(String foodName, double areaPixels, double depthCm, String location, String mealType) {
            this.foodName = foodName;
            this.areaPixels = areaPixels;
            this.depthCm = depthCm;
            this.location = location;
            this.mealType = mealType;
        }
        
        public String getFoodName() { return foodName; }
        public double getAreaPixels() { return areaPixels; }
        public double getDepthCm() { return depthCm; }
        public String getLocation() { return location; }
        public String getMealType() { return mealType; }
    }
}
