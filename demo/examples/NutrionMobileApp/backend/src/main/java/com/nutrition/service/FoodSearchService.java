package com.nutrition.service;

import com.nutrition.model.MenuItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FoodSearchService {
    
    private static final Logger logger = LoggerFactory.getLogger(FoodSearchService.class);
    
    @Autowired
    private SimpleMenuIngestService menuIngestService;
    
    @Autowired(required = false)
    private UsdaFoodDataService usdaFoodDataService;
    
    @Autowired(required = false)
    private OpenRouterService openRouterService;
    
    @Autowired(required = false)
    private CustomFoodService customFoodService;
    
    /**
     * Search result DTO
     */
    public static class FoodSearchResult {
        private String foodName;
        private String source; // "menu" or "database"
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
        private Double fiber;
        private Double sugar;
        private Double sodium;
        private Map<String, Object> metadata; // Additional info like location, mealType for menu items
        
        public FoodSearchResult(String foodName, String source) {
            this.foodName = foodName;
            this.source = source;
            this.metadata = new HashMap<>();
        }
        
        // Getters and setters
        public String getFoodName() { return foodName; }
        public void setFoodName(String foodName) { this.foodName = foodName; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public Double getCalories() { return calories; }
        public void setCalories(Double calories) { this.calories = calories; }
        
        public Double getProtein() { return protein; }
        public void setProtein(Double protein) { this.protein = protein; }
        
        public Double getCarbs() { return carbs; }
        public void setCarbs(Double carbs) { this.carbs = carbs; }
        
        public Double getFat() { return fat; }
        public void setFat(Double fat) { this.fat = fat; }
        
        public Double getFiber() { return fiber; }
        public void setFiber(Double fiber) { this.fiber = fiber; }
        
        public Double getSugar() { return sugar; }
        public void setSugar(Double sugar) { this.sugar = sugar; }
        
        public Double getSodium() { return sodium; }
        public void setSodium(Double sodium) { this.sodium = sodium; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
    
    /**
     * Search both menu items and general food database
     * Priority: Menu items first, then general database
     */
    public List<FoodSearchResult> searchFoods(String query, String location, String mealType) {
        List<FoodSearchResult> results = new ArrayList<>();
        
        if (query == null || query.trim().isEmpty()) {
            logger.warn("Empty query provided to searchFoods");
            return results;
        }
        
        // Step 1: Search menu items first
        try {
            if (menuIngestService == null) {
                logger.warn("MenuIngestService is not available");
            } else {
                List<MenuItem> menuItems = menuIngestService.searchMenuItems(query, location, mealType);
                if (menuItems != null) {
                    for (MenuItem item : menuItems) {
                        if (item == null || item.getName() == null) {
                            continue;
                        }
                        FoodSearchResult result = new FoodSearchResult(item.getName(), "menu");
                        // MenuItem stores nutrition per 100g, so we'll use those values
                        // Frontend can calculate actual values based on quantity
                        result.setCalories(item.getCaloriesPer100g());
                        result.setProtein(item.getProteinPer100g());
                        result.setCarbs(item.getCarbsPer100g());
                        result.setFat(item.getFatPer100g());
                        result.setFiber(item.getFiberPer100g());
                        // MenuItem doesn't have sugar/sodium per 100g, leave null
                        result.setSugar(null);
                        result.setSodium(null);
                        
                        // Add metadata
                        Map<String, Object> metadata = new HashMap<>();
                        if (location != null) {
                            metadata.put("location", location);
                        }
                        if (mealType != null) {
                            metadata.put("mealType", mealType);
                        }
                        if (item.getCategory() != null) {
                            metadata.put("category", item.getCategory());
                        }
                        if (item.getId() != null) {
                            metadata.put("menuItemId", item.getId());
                        }
                        result.setMetadata(metadata);
                        
                        results.add(result);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error searching menu items: {}", e.getMessage(), e);
        }
        
        // Step 2: Search custom foods (user-added foods)
        try {
            if (customFoodService != null) {
                List<com.nutrition.model.CustomFood> customFoods = 
                    customFoodService.searchCustomFoods(query);
                
                for (com.nutrition.model.CustomFood customFood : customFoods) {
                    FoodSearchResult result = new FoodSearchResult(
                        customFood.getFoodName(), 
                        "custom"
                    );
                    result.setCalories(customFood.getCaloriesPer100g());
                    result.setProtein(customFood.getProteinPer100g());
                    result.setCarbs(customFood.getCarbsPer100g());
                    result.setFat(customFood.getFatPer100g());
                    result.setFiber(customFood.getFiberPer100g());
                    result.setSugar(customFood.getSugarPer100g());
                    result.setSodium(customFood.getSodiumPer100g());
                    
                    // Add metadata
                    Map<String, Object> metadata = new HashMap<>();
                    if (customFood.getBrand() != null) {
                        metadata.put("brand", customFood.getBrand());
                    }
                    if (customFood.getCategory() != null) {
                        metadata.put("category", customFood.getCategory());
                    }
                    if (customFood.getId() != null) {
                        metadata.put("customFoodId", customFood.getId());
                    }
                    result.setMetadata(metadata);
                    
                    results.add(result);
                }
            }
        } catch (Exception e) {
            logger.warn("Error searching custom foods: {}", e.getMessage(), e);
        }
        
        // Step 3: Search USDA FoodData Central API (if no menu results or query is generic)
        if (results.isEmpty() || query.length() > 3) {
            try {
                if (usdaFoodDataService != null) {
                    List<UsdaFoodDataService.FoodSearchResult> usdaResults = 
                        usdaFoodDataService.searchFoods(query, 10);
                    
                    // Convert USDA results to our format
                    for (UsdaFoodDataService.FoodSearchResult usdaResult : usdaResults) {
                        FoodSearchResult result = new FoodSearchResult(
                            usdaResult.getFoodName(), 
                            "database"
                        );
                        result.setCalories(usdaResult.getCalories());
                        result.setProtein(usdaResult.getProtein());
                        result.setCarbs(usdaResult.getCarbs());
                        result.setFat(usdaResult.getFat());
                        result.setFiber(usdaResult.getFiber());
                        result.setSugar(usdaResult.getSugar());
                        result.setSodium(usdaResult.getSodium());
                        result.setMetadata(usdaResult.getMetadata());
                        results.add(result);
                    }
                }
            } catch (Exception e) {
                logger.warn("Error searching USDA database: {}", e.getMessage());
            }
        }
        
        // Step 3: If still no results, try OpenRouter chat API as fallback
        if (results.isEmpty() && openRouterService != null && openRouterService.isEnabled()) {
            try {
                OpenRouterService.FoodSearchResult chatResult = 
                    openRouterService.searchFoodNutrition(query);
                
                if (chatResult != null) {
                    FoodSearchResult result = new FoodSearchResult(
                        chatResult.getFoodName(),
                        "chat"
                    );
                    result.setCalories(chatResult.getCalories());
                    result.setProtein(chatResult.getProtein());
                    result.setCarbs(chatResult.getCarbs());
                    result.setFat(chatResult.getFat());
                    result.setFiber(chatResult.getFiber());
                    result.setSugar(chatResult.getSugar());
                    result.setSodium(chatResult.getSodium());
                    result.setMetadata(chatResult.getMetadata());
                    results.add(result);
                    
                    logger.info("OpenRouter chat found nutrition data for: {}", query);
                }
            } catch (Exception e) {
                logger.warn("Error searching with OpenRouter chat: {}", e.getMessage());
            }
        }
        
        // Step 4: Enrich results with missing nutrition info from OpenRouter
        // If any result is missing nutrition info, fetch it from OpenRouter and save to custom foods
        if (openRouterService != null && openRouterService.isEnabled()) {
            for (FoodSearchResult result : results) {
                // Check if nutrition info is missing
                boolean hasNutritionInfo = result.getCalories() != null || 
                                         result.getProtein() != null || 
                                         result.getCarbs() != null || 
                                         result.getFat() != null;
                
                if (!hasNutritionInfo && result.getFoodName() != null) {
                    try {
                        logger.info("Result '{}' missing nutrition info, fetching from OpenRouter", result.getFoodName());
                        
                        // Fetch nutrition info from OpenRouter
                        OpenRouterService.FoodSearchResult chatResult = 
                            openRouterService.searchFoodNutrition(result.getFoodName());
                        
                        if (chatResult != null && 
                            (chatResult.getCalories() != null || chatResult.getProtein() != null)) {
                            
                            // Update the result with nutrition info
                            result.setCalories(chatResult.getCalories());
                            result.setProtein(chatResult.getProtein());
                            result.setCarbs(chatResult.getCarbs());
                            result.setFat(chatResult.getFat());
                            result.setFiber(chatResult.getFiber());
                            result.setSugar(chatResult.getSugar());
                            result.setSodium(chatResult.getSodium());
                            
                            // Try to save to custom foods (if available) so we don't need to ask OpenRouter again
                            // If custom foods service isn't available or table doesn't exist, just continue
                            if (customFoodService != null) {
                                try {
                                    // Extract brand from food name if possible
                                    String brand = extractBrandFromFoodName(result.getFoodName());
                                    
                                    customFoodService.saveCustomFood(
                                        result.getFoodName(),
                                        chatResult.getCalories(),
                                        chatResult.getProtein(),
                                        chatResult.getCarbs(),
                                        chatResult.getFat(),
                                        chatResult.getFiber(),
                                        chatResult.getSugar(),
                                        chatResult.getSodium(),
                                        brand,
                                        null, // category
                                        null  // description
                                    );
                                    
                                    logger.info("Saved nutrition info for '{}' to custom foods database", result.getFoodName());
                                } catch (IllegalStateException e) {
                                    // Table doesn't exist yet - migration hasn't run
                                    // This is OK, we'll just enrich the result without saving
                                    logger.debug("Custom foods table not available, skipping save for '{}'", result.getFoodName());
                                } catch (Exception e) {
                                    // Other error saving - log but don't fail
                                    logger.warn("Failed to save '{}' to custom foods (will still enrich result): {}", 
                                               result.getFoodName(), e.getMessage());
                                }
                            }
                        }
                    } catch (Exception e) {
                        logger.warn("Error enriching result '{}' with OpenRouter: {}", 
                                   result.getFoodName(), e.getMessage());
                    }
                }
            }
        }
        
        long menuCount = results.stream().filter(r -> "menu".equals(r.getSource())).count();
        long databaseCount = results.stream().filter(r -> "database".equals(r.getSource())).count();
        long customCount = results.stream().filter(r -> "custom".equals(r.getSource())).count();
        long chatCount = results.stream().filter(r -> "chat".equals(r.getSource())).count();
        
        logger.info("Food search for '{}' returned {} results ({} menu, {} custom, {} database, {} chat)", 
                   query, results.size(), menuCount, customCount, databaseCount, chatCount);
        
        return results;
    }
    
    /**
     * Extract brand name from food name (e.g., "Pizza Hut 12 inch pepperoni pizza" -> "Pizza Hut")
     */
    private String extractBrandFromFoodName(String foodName) {
        if (foodName == null) return null;
        
        String[] brandPatterns = {
            "pizza hut", "domino", "papa john", "mcdonald", "burger king",
            "wendy", "subway", "kfc", "taco bell", "chipotle", "starbucks",
            "dunkin", "panera", "olive garden", "applebees", "outback"
        };
        
        String foodNameLower = foodName.toLowerCase();
        for (String brand : brandPatterns) {
            if (foodNameLower.contains(brand)) {
                // Capitalize first letter of each word
                String[] words = brand.split(" ");
                StringBuilder capitalized = new StringBuilder();
                for (String word : words) {
                    if (capitalized.length() > 0) capitalized.append(" ");
                    capitalized.append(word.substring(0, 1).toUpperCase())
                               .append(word.substring(1));
                }
                return capitalized.toString();
            }
        }
        
        return null;
    }
}

