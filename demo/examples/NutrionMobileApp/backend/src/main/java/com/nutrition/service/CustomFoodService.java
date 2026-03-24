package com.nutrition.service;

import com.nutrition.model.CustomFood;
import com.nutrition.repository.CustomFoodRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing custom foods (user-added foods not in menu or USDA database)
 */
@Service
public class CustomFoodService {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomFoodService.class);
    
    @Autowired
    private CustomFoodRepository customFoodRepository;
    
    /**
     * Save or update a custom food
     * If a food with the same name and brand exists, it updates usage count
     * Otherwise, creates a new entry
     */
    @Transactional
    public CustomFood saveCustomFood(String foodName, Double caloriesPer100g, 
                                     Double proteinPer100g, Double carbsPer100g, 
                                     Double fatPer100g, Double fiberPer100g,
                                     Double sugarPer100g, Double sodiumPer100g,
                                     String brand, String category, String description) {
        
        if (foodName == null || foodName.trim().isEmpty()) {
            throw new IllegalArgumentException("Food name cannot be empty");
        }
        
        try {
            // Check if food already exists (by name and brand)
            Optional<CustomFood> existing = customFoodRepository.findByFoodNameAndBrand(
                foodName.trim(), brand != null ? brand.trim() : null);
            
            if (existing.isPresent()) {
                // Update existing food and increment usage
                CustomFood food = existing.get();
                food.setLastUsedAt(LocalDateTime.now());
                food.setUsageCount(food.getUsageCount() + 1);
                
                // Update nutrition values if provided (allow refinement)
                if (caloriesPer100g != null) food.setCaloriesPer100g(caloriesPer100g);
                if (proteinPer100g != null) food.setProteinPer100g(proteinPer100g);
                if (carbsPer100g != null) food.setCarbsPer100g(carbsPer100g);
                if (fatPer100g != null) food.setFatPer100g(fatPer100g);
                if (fiberPer100g != null) food.setFiberPer100g(fiberPer100g);
                if (sugarPer100g != null) food.setSugarPer100g(sugarPer100g);
                if (sodiumPer100g != null) food.setSodiumPer100g(sodiumPer100g);
                if (category != null) food.setCategory(category);
                if (description != null) food.setDescription(description);
                
                logger.info("Updated existing custom food: {} (usage count: {})", 
                           foodName, food.getUsageCount());
                return customFoodRepository.save(food);
            } else {
                // Create new custom food
                CustomFood food = new CustomFood(foodName.trim());
                food.setCaloriesPer100g(caloriesPer100g);
                food.setProteinPer100g(proteinPer100g);
                food.setCarbsPer100g(carbsPer100g);
                food.setFatPer100g(fatPer100g);
                food.setFiberPer100g(fiberPer100g);
                food.setSugarPer100g(sugarPer100g);
                food.setSodiumPer100g(sodiumPer100g);
                food.setBrand(brand != null ? brand.trim() : null);
                food.setCategory(category);
                food.setDescription(description);
                food.setUsageCount(1);
                food.setLastUsedAt(LocalDateTime.now());
                
                // Generate search keywords from food name and brand
                String keywords = generateSearchKeywords(foodName, brand);
                food.setSearchKeywords(keywords);
                
                logger.info("Created new custom food: {}", foodName);
                return customFoodRepository.save(food);
            }
        } catch (org.springframework.dao.DataAccessException e) {
            // If table doesn't exist yet (migration hasn't run), log and rethrow
            if (e.getMessage() != null && e.getMessage().contains("does not exist")) {
                logger.warn("Custom foods table does not exist yet. Migration V3 may not have run. Error: {}", e.getMessage());
                throw new IllegalStateException("Custom foods feature is not available yet. Please wait for database migration to complete.", e);
            }
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error saving custom food: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Search custom foods by query
     */
    public List<CustomFood> searchCustomFoods(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        return customFoodRepository.searchCustomFoods(query.trim());
    }
    
    /**
     * Generate search keywords from food name and brand
     */
    private String generateSearchKeywords(String foodName, String brand) {
        StringBuilder keywords = new StringBuilder();
        
        if (foodName != null) {
            keywords.append(foodName.toLowerCase());
            // Add individual words for better search
            String[] words = foodName.toLowerCase().split("\\s+");
            for (String word : words) {
                if (word.length() > 2) { // Skip very short words
                    keywords.append(", ").append(word);
                }
            }
        }
        
        if (brand != null && !brand.trim().isEmpty()) {
            keywords.append(", ").append(brand.toLowerCase());
        }
        
        return keywords.toString();
    }
}

