package com.nutrition.controller;

import com.nutrition.model.MenuItem;
import com.nutrition.service.SimpleMenuIngestService;
import com.nutrition.service.SimpleMenuPriorService;
import com.nutrition.service.FoodSearchService;
import com.nutrition.service.CustomFoodService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/menu")
public class MenuController {
    
    private static final Logger logger = LoggerFactory.getLogger(MenuController.class);
    
    @Autowired
    private SimpleMenuIngestService menuIngestService;
    
    @Autowired
    private SimpleMenuPriorService menuPriorService;
    
    @Autowired
    private FoodSearchService foodSearchService;
    
    @Autowired(required = false)
    private CustomFoodService customFoodService;
    
    /**
     * Ingest menu data from Sodexo API
     */
    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> ingestMenu(
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam(required = false) String mealType) {
        
        try {
            logger.info("Ingesting menu for location: {}, date: {}, mealType: {}", location, date, mealType);
            
            var result = menuIngestService.ingestMenu(location, date, mealType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("location", result.getLocation());
            response.put("date", result.getDate());
            response.put("mealType", result.getMealType());
            response.put("itemsIngested", result.getItemsIngested());
            response.put("itemsProcessed", result.getItemsProcessed());
            
            logger.info("Menu ingestion completed: {} items ingested", result.getItemsIngested());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to ingest menu", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to ingest menu: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get menu items for a specific location and date
     */
    @GetMapping("/items")
    public ResponseEntity<Map<String, Object>> getMenuItems(
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) String category) {
        
        try {
            logger.info("Getting menu items for location: {}, date: {}, mealType: {}, category: {}", 
                       location, date, mealType, category);
            
            List<MenuItem> menuItems = menuIngestService.getMenuItems(location, date, mealType);
            
            // Filter by category if specified
            if (category != null && !category.isEmpty()) {
                menuItems = menuItems.stream()
                    .filter(item -> category.equalsIgnoreCase(item.getCategory()))
                    .toList();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("location", location);
            response.put("date", date);
            response.put("mealType", mealType);
            response.put("category", category);
            response.put("itemCount", menuItems.size());
            response.put("menuItems", menuItems);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get menu items", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get menu items: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get prior probabilities for menu items
     */
    @GetMapping("/priors")
    public ResponseEntity<Map<String, Object>> getPriorProbabilities(
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam(required = false) String mealType) {
        
        try {
            logger.info("Getting prior probabilities for location: {}, date: {}, mealType: {}", 
                       location, date, mealType);
            
            Map<String, Double> priors = menuPriorService.getPriorProbabilities(location, date, mealType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("location", location);
            response.put("date", date);
            response.put("mealType", mealType);
            response.put("priorProbabilities", priors);
            response.put("itemCount", priors.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get prior probabilities", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get prior probabilities: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Search menu items
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMenuItems(
            @RequestParam String query,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String mealType) {
        
        try {
            logger.info("Searching menu items with query: {}, location: {}, mealType: {}", query, location, mealType);
            
            List<MenuItem> results = menuIngestService.searchMenuItems(query, location, mealType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("location", location);
            response.put("mealType", mealType);
            response.put("results", results);
            response.put("resultCount", results.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to search menu items", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to search menu items: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Search foods (both menu items and general database)
     */
    @GetMapping("/search-foods")
    public ResponseEntity<Map<String, Object>> searchFoods(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String mealType) {
        
        try {
            if (query == null || query.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("query", query);
                response.put("location", location);
                response.put("mealType", mealType);
                response.put("results", new ArrayList<>());
                response.put("resultCount", 0);
                return ResponseEntity.ok(response);
            }
            
            logger.info("Searching foods with query: {}, location: {}, mealType: {}", query, location, mealType);
            
            if (foodSearchService == null) {
                logger.error("FoodSearchService is not available");
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Food search service is not available");
                return ResponseEntity.internalServerError().body(response);
            }
            
            List<FoodSearchService.FoodSearchResult> results = foodSearchService.searchFoods(query, location, mealType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("query", query);
            response.put("location", location);
            response.put("mealType", mealType);
            response.put("results", results);
            response.put("resultCount", results != null ? results.size() : 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to search foods", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to search foods: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Save a custom food (user-added food not in menu or database)
     */
    @PostMapping("/save-custom-food")
    public ResponseEntity<Map<String, Object>> saveCustomFood(
            @RequestParam String foodName,
            @RequestParam(required = false) Double caloriesPer100g,
            @RequestParam(required = false) Double proteinPer100g,
            @RequestParam(required = false) Double carbsPer100g,
            @RequestParam(required = false) Double fatPer100g,
            @RequestParam(required = false) Double fiberPer100g,
            @RequestParam(required = false) Double sugarPer100g,
            @RequestParam(required = false) Double sodiumPer100g,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String description) {
        
        try {
            if (customFoodService == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Custom food service is not available");
                return ResponseEntity.internalServerError().body(response);
            }
            
            logger.info("Saving custom food: {}", foodName);
            
            var customFood = customFoodService.saveCustomFood(
                foodName, caloriesPer100g, proteinPer100g, carbsPer100g,
                fatPer100g, fiberPer100g, sugarPer100g, sodiumPer100g,
                brand, category, description
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Custom food saved successfully");
            response.put("foodId", customFood.getId());
            response.put("foodName", customFood.getFoodName());
            response.put("usageCount", customFood.getUsageCount());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            // Table doesn't exist yet - migration hasn't run
            logger.warn("Custom foods table not available: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Custom foods feature is not available yet. Database migration is pending.");
            response.put("error", "MIGRATION_PENDING");
            return ResponseEntity.status(503).body(response); // Service Unavailable
        } catch (Exception e) {
            logger.error("Failed to save custom food: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to save custom food: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get top foods for a location and meal type
     */
    @GetMapping("/top-foods")
    public ResponseEntity<Map<String, Object>> getTopFoods(
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam(required = false) String mealType,
            @RequestParam(defaultValue = "10") int topN) {
        
        try {
            logger.info("Getting top {} foods for location: {}, date: {}, mealType: {}", 
                       topN, location, date, mealType);
            
            List<String> topFoods = menuPriorService.getTopFoods(location, date, mealType, topN);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("location", location);
            response.put("date", date);
            response.put("mealType", mealType);
            response.put("topN", topN);
            response.put("topFoods", topFoods);
            response.put("foodCount", topFoods.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get top foods", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get top foods: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Proxy endpoint for Sodexo API calls
     * This endpoint handles direct calls to the Sodexo API and returns the response
     */
    @GetMapping("/sodexo/{locationId}")
    public ResponseEntity<Map<String, Object>> getSodexoMenu(
            @PathVariable String locationId,
            @RequestParam String date) {
        
        try {
            logger.info("Fetching Sodexo menu for location: {}, date: {}", locationId, date);
            
            // Use the existing menu ingest service to fetch from Sodexo
            LocalDateTime dateTime = LocalDateTime.parse(date + "T00:00:00");
            var result = menuIngestService.ingestMenu(locationId, dateTime, null);
            
            if (result.isSuccess()) {
                // Get the menu items that were ingested
                List<MenuItem> menuItems = menuIngestService.getMenuItems(locationId, dateTime, null);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("locationId", locationId);
                response.put("date", date);
                response.put("menuItems", menuItems);
                response.put("itemCount", menuItems.size());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", result.getMessage());
                response.put("locationId", locationId);
                response.put("date", date);
                
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            logger.error("Failed to fetch Sodexo menu", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch Sodexo menu: " + e.getMessage());
            response.put("locationId", locationId);
            response.put("date", date);
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}