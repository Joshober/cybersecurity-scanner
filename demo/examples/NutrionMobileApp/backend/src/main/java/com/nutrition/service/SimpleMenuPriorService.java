package com.nutrition.service;

import com.nutrition.model.MenuItem;
import com.nutrition.repository.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SimpleMenuPriorService {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleMenuPriorService.class);
    
    @Autowired
    private MenuItemRepository menuItemRepository;
    
    private static final double DEFAULT_ALPHA = 0.1; // Smoothing parameter
    private static final double MENU_ITEM_BOOST = 0.3; // Boost for items on current menu
    
    /**
     * Get prior probabilities for food items based on menu data
     */
    @Cacheable(value = "menuPriors", key = "#location + '_' + #date + '_' + #mealType")
    public Map<String, Double> getPriorProbabilities(String location, LocalDateTime date, String mealType) {
        try {
            logger.info("Calculating prior probabilities for location: {}, date: {}, mealType: {}", location, date, mealType);
            
            // Get current menu items
            List<MenuItem> currentMenuItems = menuItemRepository.findByLocationAndDateAndMealType(
                location, date.toLocalDate(), mealType);
            
            // Get historical menu items for this location and meal type
            List<MenuItem> historicalItems = menuItemRepository.findByLocationAndMealType(location, mealType);
            
            // Calculate priors
            Map<String, Double> priors = calculatePriors(currentMenuItems, historicalItems, location, mealType);
            
            logger.info("Calculated prior probabilities for {} food items", priors.size());
            return priors;
            
        } catch (Exception e) {
            logger.error("Failed to calculate prior probabilities", e);
            return getDefaultPriors();
        }
    }
    
    /**
     * Calculate prior probabilities using menu data
     */
    private Map<String, Double> calculatePriors(List<MenuItem> currentMenuItems, List<MenuItem> historicalItems, 
                                               String location, String mealType) {
        Map<String, Double> priors = new HashMap<>();
        
        // Create food name mappings (normalize names)
        Map<String, String> foodNameMapping = createFoodNameMapping();
        
        // Count occurrences of each food type
        Map<String, Integer> foodCounts = new HashMap<>();
        Map<String, Integer> currentMenuCounts = new HashMap<>();
        
        // Count historical occurrences
        for (MenuItem item : historicalItems) {
            String normalizedName = normalizeFoodName(item.getName(), foodNameMapping);
            foodCounts.put(normalizedName, foodCounts.getOrDefault(normalizedName, 0) + 1);
        }
        
        // Count current menu occurrences
        for (MenuItem item : currentMenuItems) {
            String normalizedName = normalizeFoodName(item.getName(), foodNameMapping);
            currentMenuCounts.put(normalizedName, currentMenuCounts.getOrDefault(normalizedName, 0) + 1);
        }
        
        // Calculate priors with smoothing
        int totalItems = historicalItems.size();
        int totalCurrentItems = currentMenuItems.size();
        
        for (String foodName : foodCounts.keySet()) {
            // Historical frequency
            double historicalFreq = (double) foodCounts.get(foodName) / totalItems;
            
            // Current menu boost
            double currentMenuFreq = 0.0;
            if (currentMenuCounts.containsKey(foodName)) {
                currentMenuFreq = (double) currentMenuCounts.get(foodName) / totalCurrentItems;
            }
            
            // Combine with smoothing
            double prior = (historicalFreq * (1 - MENU_ITEM_BOOST)) + 
                          (currentMenuFreq * MENU_ITEM_BOOST) + 
                          DEFAULT_ALPHA;
            
            priors.put(foodName, prior);
        }
        
        // Add common foods that might not be in menu
        addCommonFoodPriors(priors, location, mealType);
        
        // Normalize probabilities
        return normalizeProbabilities(priors);
    }
    
    /**
     * Create mapping for food name normalization
     */
    private Map<String, String> createFoodNameMapping() {
        Map<String, String> mapping = new HashMap<>();
        
        // Common food name variations
        mapping.put("chicken breast", "chicken");
        mapping.put("grilled chicken", "chicken");
        mapping.put("fried chicken", "chicken");
        mapping.put("chicken thigh", "chicken");
        mapping.put("chicken wing", "chicken");
        
        mapping.put("ground beef", "beef");
        mapping.put("beef steak", "beef");
        mapping.put("roast beef", "beef");
        mapping.put("beef burger", "beef");
        
        mapping.put("white rice", "rice");
        mapping.put("brown rice", "rice");
        mapping.put("fried rice", "rice");
        mapping.put("rice pilaf", "rice");
        
        mapping.put("spaghetti", "pasta");
        mapping.put("penne", "pasta");
        mapping.put("macaroni", "pasta");
        mapping.put("fettuccine", "pasta");
        
        mapping.put("white bread", "bread");
        mapping.put("whole wheat bread", "bread");
        mapping.put("sourdough bread", "bread");
        mapping.put("bagel", "bread");
        
        mapping.put("iceberg lettuce", "lettuce");
        mapping.put("romaine lettuce", "lettuce");
        mapping.put("mixed greens", "lettuce");
        
        mapping.put("cherry tomato", "tomato");
        mapping.put("beefsteak tomato", "tomato");
        mapping.put("roma tomato", "tomato");
        
        return mapping;
    }
    
    /**
     * Normalize food name using mapping
     */
    private String normalizeFoodName(String foodName, Map<String, String> mapping) {
        String lowerName = foodName.toLowerCase().trim();
        
        // Check for exact matches first
        if (mapping.containsKey(lowerName)) {
            return mapping.get(lowerName);
        }
        
        // Check for partial matches
        for (Map.Entry<String, String> entry : mapping.entrySet()) {
            if (lowerName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // Return original name if no mapping found
        return lowerName;
    }
    
    /**
     * Add priors for common foods not in menu
     */
    private void addCommonFoodPriors(Map<String, Double> priors, String location, String mealType) {
        Map<String, Double> commonFoods = getCommonFoodPriors(mealType);
        
        for (Map.Entry<String, Double> entry : commonFoods.entrySet()) {
            String foodName = entry.getKey();
            double commonPrior = entry.getValue();
            
            // Only add if not already present or if common prior is higher
            if (!priors.containsKey(foodName) || priors.get(foodName) < commonPrior) {
                priors.put(foodName, commonPrior);
            }
        }
    }
    
    /**
     * Get common food priors based on meal type
     */
    private Map<String, Double> getCommonFoodPriors(String mealType) {
        Map<String, Double> commonFoods = new HashMap<>();
        
        if ("breakfast".equals(mealType)) {
            commonFoods.put("egg", 0.8);
            commonFoods.put("bacon", 0.6);
            commonFoods.put("pancake", 0.5);
            commonFoods.put("oatmeal", 0.4);
            commonFoods.put("cereal", 0.3);
            commonFoods.put("toast", 0.3);
            commonFoods.put("muffin", 0.2);
            commonFoods.put("bagel", 0.2);
        } else if ("lunch".equals(mealType)) {
            commonFoods.put("sandwich", 0.7);
            commonFoods.put("salad", 0.6);
            commonFoods.put("soup", 0.5);
            commonFoods.put("pizza", 0.4);
            commonFoods.put("burger", 0.4);
            commonFoods.put("pasta", 0.3);
            commonFoods.put("wrap", 0.3);
            commonFoods.put("quesadilla", 0.2);
        } else if ("dinner".equals(mealType)) {
            commonFoods.put("chicken", 0.8);
            commonFoods.put("beef", 0.6);
            commonFoods.put("fish", 0.5);
            commonFoods.put("pasta", 0.4);
            commonFoods.put("rice", 0.4);
            commonFoods.put("potato", 0.3);
            commonFoods.put("vegetable", 0.3);
            commonFoods.put("salad", 0.2);
        } else {
            // General foods
            commonFoods.put("chicken", 0.5);
            commonFoods.put("beef", 0.4);
            commonFoods.put("rice", 0.4);
            commonFoods.put("pasta", 0.3);
            commonFoods.put("bread", 0.3);
            commonFoods.put("vegetable", 0.3);
            commonFoods.put("salad", 0.2);
            commonFoods.put("soup", 0.2);
        }
        
        return commonFoods;
    }
    
    /**
     * Normalize probabilities to sum to 1
     */
    private Map<String, Double> normalizeProbabilities(Map<String, Double> priors) {
        double sum = priors.values().stream().mapToDouble(Double::doubleValue).sum();
        
        if (sum > 0) {
            return priors.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue() / sum
                    ));
        }
        
        return priors;
    }
    
    /**
     * Get default priors when calculation fails
     */
    private Map<String, Double> getDefaultPriors() {
        Map<String, Double> defaultPriors = new HashMap<>();
        
        // Common foods with equal probability
        String[] commonFoods = {
            "chicken", "beef", "fish", "rice", "pasta", "bread", "vegetable", 
            "salad", "soup", "pizza", "burger", "sandwich", "potato", "egg"
        };
        
        double defaultPrior = 1.0 / commonFoods.length;
        for (String food : commonFoods) {
            defaultPriors.put(food, defaultPrior);
        }
        
        return defaultPriors;
    }
    
    /**
     * Get prior probability for a specific food item
     */
    public double getPriorProbability(String foodName, String location, LocalDateTime date, String mealType) {
        Map<String, Double> priors = getPriorProbabilities(location, date, mealType);
        
        // Try exact match first
        if (priors.containsKey(foodName.toLowerCase())) {
            return priors.get(foodName.toLowerCase());
        }
        
        // Try partial match
        for (Map.Entry<String, Double> entry : priors.entrySet()) {
            if (foodName.toLowerCase().contains(entry.getKey()) || 
                entry.getKey().contains(foodName.toLowerCase())) {
                return entry.getValue();
            }
        }
        
        // Return default prior
        return DEFAULT_ALPHA;
    }
    
    /**
     * Update priors based on user feedback
     */
    public void updatePriors(String foodName, String location, String mealType, boolean wasCorrect) {
        try {
            logger.info("Updating priors for food: {}, location: {}, mealType: {}, correct: {}", 
                       foodName, location, mealType, wasCorrect);
            
            // In a real implementation, this would update a user-specific prior model
            // For now, we'll just log the feedback
            
            if (wasCorrect) {
                logger.debug("Positive feedback for food recognition: {}", foodName);
            } else {
                logger.debug("Negative feedback for food recognition: {}", foodName);
            }
            
        } catch (Exception e) {
            logger.error("Failed to update priors", e);
        }
    }
    
    /**
     * Get top N most likely foods for a location and meal type
     */
    public List<String> getTopFoods(String location, LocalDateTime date, String mealType, int topN) {
        Map<String, Double> priors = getPriorProbabilities(location, date, mealType);
        
        return priors.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topN)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}
