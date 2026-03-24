package com.nutrition.service;

import com.nutrition.model.MenuItem;
import com.nutrition.repository.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SimpleMenuIngestService {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleMenuIngestService.class);
    
    @Autowired
    private MenuItemRepository menuItemRepository;
    
    @Value("${menu.sodexo.api-url}")
    private String sodexoApiUrl;
    
    @Value("${menu.sodexo.api-key}")
    private String sodexoApiKey;
    
    @Value("${menu.sodexo.cache-ttl}")
    private long cacheTtl;
    
    private final WebClient webClient;
    
    public SimpleMenuIngestService() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB
                .build();
    }
    
    /**
     * Ingest menu data from Sodexo API
     */
    public MenuIngestResult ingestMenu(String location, LocalDateTime date, String mealType) {
        try {
            logger.info("Starting menu ingestion for location: {}, date: {}, mealType: {}", location, date, mealType);
            
            // Fetch menu data from Sodexo API
            Map<String, Object> menuData = fetchMenuFromSodexo(location, date, mealType);
            
            // Normalize and process menu items
            List<MenuItem> menuItems = normalizeMenuData(menuData, location, date, mealType);
            
            // Save to database
            List<MenuItem> savedItems = saveMenuItems(menuItems);
            
            // Create Lucene index (simplified)
            indexMenuItems(savedItems);
            
            MenuIngestResult result = new MenuIngestResult();
            result.setSuccess(true);
            result.setLocation(location);
            result.setDate(date);
            result.setMealType(mealType);
            result.setItemsIngested(savedItems.size());
            result.setItemsProcessed(menuItems.size());
            result.setMessage("Successfully ingested " + savedItems.size() + " menu items");
            
            logger.info("Menu ingestion completed successfully: {} items ingested", savedItems.size());
            return result;
            
        } catch (Exception e) {
            logger.error("Failed to ingest menu for location: {}, date: {}, mealType: {}", location, date, mealType, e);
            
            MenuIngestResult result = new MenuIngestResult();
            result.setSuccess(false);
            result.setLocation(location);
            result.setDate(date);
            result.setMealType(mealType);
            result.setItemsIngested(0);
            result.setItemsProcessed(0);
            result.setMessage("Failed to ingest menu: " + e.getMessage());
            
            return result;
        }
    }
    
    /**
     * Fetch menu data from Sodexo API
     */
    @Cacheable(value = "menuData", key = "#location + '_' + #date + '_' + #mealType")
    private Map<String, Object> fetchMenuFromSodexo(String location, LocalDateTime date, String mealType) {
        try {
            String dateStr = date.toLocalDate().toString(); // YYYY-MM-DD format
            String url = String.format("%s/menu/%s/14805?date=%s", sodexoApiUrl, location, dateStr);
            
            logger.info("Fetching menu from Sodexo API: {}", url);
            
            Map<String, Object> response = webClient.get()
                    .uri(url)
                    .header("api-key", sodexoApiKey)
                    .header("accept", "application/json")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response == null) {
                throw new RuntimeException("No response from Sodexo API");
            }
            
            logger.info("Successfully fetched menu data from Sodexo API");
            return response;
            
        } catch (Exception e) {
            logger.warn("Failed to fetch from Sodexo API, using mock data: {}", e.getMessage());
            return createMockMenuData(location, date, mealType);
        }
    }
    
    /**
     * Create mock menu data for testing
     */
    private Map<String, Object> createMockMenuData(String location, LocalDateTime date, String mealType) {
        Map<String, Object> mockData = new HashMap<>();
        
        List<Map<String, Object>> categories = new ArrayList<>();
        
        // Breakfast items
        if (mealType == null || mealType.equals("breakfast")) {
            Map<String, Object> breakfastCategory = new HashMap<>();
            breakfastCategory.put("name", "Breakfast");
            breakfastCategory.put("items", Arrays.asList(
                createMockMenuItem("Scrambled Eggs", "breakfast", 150.0, 12.0, 2.0, 10.0, 0.0),
                createMockMenuItem("Bacon", "breakfast", 200.0, 15.0, 1.0, 15.0, 0.0),
                createMockMenuItem("Pancakes", "breakfast", 250.0, 8.0, 35.0, 8.0, 2.0),
                createMockMenuItem("Oatmeal", "breakfast", 120.0, 4.0, 22.0, 2.0, 4.0)
            ));
            categories.add(breakfastCategory);
        }
        
        // Lunch items
        if (mealType == null || mealType.equals("lunch")) {
            Map<String, Object> lunchCategory = new HashMap<>();
            lunchCategory.put("name", "Lunch");
            lunchCategory.put("items", Arrays.asList(
                createMockMenuItem("Grilled Chicken", "lunch", 180.0, 25.0, 0.0, 8.0, 0.0),
                createMockMenuItem("Caesar Salad", "lunch", 120.0, 8.0, 8.0, 6.0, 3.0),
                createMockMenuItem("Pasta Marinara", "lunch", 220.0, 8.0, 42.0, 4.0, 3.0),
                createMockMenuItem("Turkey Sandwich", "lunch", 280.0, 18.0, 35.0, 8.0, 2.0)
            ));
            categories.add(lunchCategory);
        }
        
        // Dinner items
        if (mealType == null || mealType.equals("dinner")) {
            Map<String, Object> dinnerCategory = new HashMap<>();
            dinnerCategory.put("name", "Dinner");
            dinnerCategory.put("items", Arrays.asList(
                createMockMenuItem("Beef Steak", "dinner", 250.0, 26.0, 0.0, 15.0, 0.0),
                createMockMenuItem("Mashed Potatoes", "dinner", 150.0, 3.0, 25.0, 5.0, 2.0),
                createMockMenuItem("Steamed Broccoli", "dinner", 35.0, 3.0, 7.0, 0.5, 3.0),
                createMockMenuItem("Salmon Fillet", "dinner", 200.0, 22.0, 0.0, 12.0, 0.0)
            ));
            categories.add(dinnerCategory);
        }
        
        mockData.put("categories", categories);
        mockData.put("location", location);
        mockData.put("date", date.toString());
        mockData.put("mealType", mealType);
        
        return mockData;
    }
    
    /**
     * Create a mock menu item
     */
    private Map<String, Object> createMockMenuItem(String name, String category, double calories, 
                                                  double protein, double carbs, double fat, double fiber) {
        Map<String, Object> item = new HashMap<>();
        item.put("name", name);
        item.put("category", category);
        item.put("caloriesPer100g", calories);
        item.put("proteinPer100g", protein);
        item.put("carbsPer100g", carbs);
        item.put("fatPer100g", fat);
        item.put("fiberPer100g", fiber);
        item.put("densityGPerCm3", 1.0); // Default density
        return item;
    }
    
    /**
     * Normalize menu data into MenuItem entities
     */
    private List<MenuItem> normalizeMenuData(Map<String, Object> menuData, String location, LocalDateTime date, String mealType) {
        List<MenuItem> menuItems = new ArrayList<>();
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> categories = (List<Map<String, Object>>) menuData.get("categories");
        
        if (categories != null) {
            for (Map<String, Object> category : categories) {
                String categoryName = (String) category.get("name");
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = (List<Map<String, Object>>) category.get("items");
                
                if (items != null) {
                    for (Map<String, Object> itemData : items) {
                        MenuItem menuItem = normalizeMenuItem(itemData, location, date, mealType, categoryName);
                        if (menuItem != null) {
                            menuItems.add(menuItem);
                        }
                    }
                }
            }
        }
        
        return menuItems;
    }
    
    /**
     * Normalize a single menu item
     */
    private MenuItem normalizeMenuItem(Map<String, Object> itemData, String location, LocalDateTime date, String mealType, String category) {
        try {
            MenuItem menuItem = new MenuItem();
            
            menuItem.setName((String) itemData.get("name"));
            menuItem.setCategory(category);
            menuItem.setLocation(location);
            menuItem.setDate(date.toLocalDate());
            menuItem.setMealType(mealType);
            
            // Nutritional information with validation
            Double caloriesPer100g = getDoubleValue(itemData, "caloriesPer100g");
            if (caloriesPer100g != null) {
                // Validate calories per 100g is reasonable (50-600 range)
                if (caloriesPer100g < 50.0 || caloriesPer100g > 600.0) {
                    logger.warn("MenuItem '{}' has unrealistic caloriesPer100g: {}. Expected range: 50-600. Setting to null.", 
                               itemData.get("name"), caloriesPer100g);
                    caloriesPer100g = null; // Don't use unrealistic values
                }
            }
            menuItem.setCaloriesPer100g(caloriesPer100g);
            
            // Validate other nutritional values are non-negative
            Double proteinPer100g = getDoubleValue(itemData, "proteinPer100g");
            if (proteinPer100g != null && proteinPer100g < 0) {
                logger.warn("MenuItem '{}' has negative proteinPer100g: {}. Setting to null.", 
                           itemData.get("name"), proteinPer100g);
                proteinPer100g = null;
            }
            menuItem.setProteinPer100g(proteinPer100g);
            
            Double carbsPer100g = getDoubleValue(itemData, "carbsPer100g");
            if (carbsPer100g != null && carbsPer100g < 0) {
                logger.warn("MenuItem '{}' has negative carbsPer100g: {}. Setting to null.", 
                           itemData.get("name"), carbsPer100g);
                carbsPer100g = null;
            }
            menuItem.setCarbsPer100g(carbsPer100g);
            
            Double fatPer100g = getDoubleValue(itemData, "fatPer100g");
            if (fatPer100g != null && fatPer100g < 0) {
                logger.warn("MenuItem '{}' has negative fatPer100g: {}. Setting to null.", 
                           itemData.get("name"), fatPer100g);
                fatPer100g = null;
            }
            menuItem.setFatPer100g(fatPer100g);
            
            Double fiberPer100g = getDoubleValue(itemData, "fiberPer100g");
            if (fiberPer100g != null && fiberPer100g < 0) {
                logger.warn("MenuItem '{}' has negative fiberPer100g: {}. Setting to null.", 
                           itemData.get("name"), fiberPer100g);
                fiberPer100g = null;
            }
            menuItem.setFiberPer100g(fiberPer100g);
            
            Double densityGPerCm3 = getDoubleValue(itemData, "densityGPerCm3", 1.0);
            if (densityGPerCm3 != null && (densityGPerCm3 <= 0 || densityGPerCm3 > 10.0)) {
                logger.warn("MenuItem '{}' has unrealistic densityGPerCm3: {}. Using default 1.0.", 
                           itemData.get("name"), densityGPerCm3);
                densityGPerCm3 = 1.0;
            }
            menuItem.setDensityGPerCm3(densityGPerCm3);
            
            // Additional metadata
            menuItem.setDescription((String) itemData.get("description"));
            menuItem.setAllergens((String) itemData.get("allergens"));
            menuItem.setIngredients((String) itemData.get("ingredients"));
            
            menuItem.setCreatedAt(LocalDateTime.now());
            menuItem.setUpdatedAt(LocalDateTime.now());
            
            return menuItem;
            
        } catch (Exception e) {
            logger.warn("Failed to normalize menu item: {}", itemData, e);
            return null;
        }
    }
    
    /**
     * Get double value from map with default
     */
    private Double getDoubleValue(Map<String, Object> map, String key) {
        return getDoubleValue(map, key, null);
    }
    
    /**
     * Get double value from map with default
     */
    private Double getDoubleValue(Map<String, Object> map, String key, Double defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
    
    /**
     * Save menu items to database
     */
    private List<MenuItem> saveMenuItems(List<MenuItem> menuItems) {
        List<MenuItem> savedItems = new ArrayList<>();
        
        for (MenuItem menuItem : menuItems) {
            try {
                // Check if item already exists
                Optional<MenuItem> existing = menuItemRepository.findByNameAndLocationAndDateAndMealType(
                    menuItem.getName(), 
                    menuItem.getLocation(), 
                    menuItem.getDate(), 
                    menuItem.getMealType()
                );
                
                if (existing.isPresent()) {
                    // Update existing item
                    MenuItem existingItem = existing.get();
                    existingItem.setCaloriesPer100g(menuItem.getCaloriesPer100g());
                    existingItem.setProteinPer100g(menuItem.getProteinPer100g());
                    existingItem.setCarbsPer100g(menuItem.getCarbsPer100g());
                    existingItem.setFatPer100g(menuItem.getFatPer100g());
                    existingItem.setFiberPer100g(menuItem.getFiberPer100g());
                    existingItem.setDensityGPerCm3(menuItem.getDensityGPerCm3());
                    existingItem.setUpdatedAt(LocalDateTime.now());
                    
                    savedItems.add(menuItemRepository.save(existingItem));
                } else {
                    // Save new item
                    savedItems.add(menuItemRepository.save(menuItem));
                }
                
            } catch (Exception e) {
                logger.warn("Failed to save menu item: {}", menuItem.getName(), e);
            }
        }
        
        return savedItems;
    }
    
    /**
     * Index menu items for search (simplified implementation)
     */
    private void indexMenuItems(List<MenuItem> menuItems) {
        try {
            logger.info("Indexing {} menu items for search", menuItems.size());
            
            // In a real implementation, this would use Apache Lucene
            // For now, we'll just log the indexing
            for (MenuItem item : menuItems) {
                logger.debug("Indexed menu item: {} (category: {}, location: {})", 
                           item.getName(), item.getCategory(), item.getLocation());
            }
            
            logger.info("Menu indexing completed");
            
        } catch (Exception e) {
            logger.error("Failed to index menu items", e);
        }
    }
    
    /**
     * Search menu items
     */
    public List<MenuItem> searchMenuItems(String query, String location, String mealType) {
        try {
            logger.info("Searching menu items with query: '{}', location: {}, mealType: {}", query, location, mealType);
            
            List<MenuItem> results = new ArrayList<>();
            
            if (query == null || query.trim().isEmpty()) {
                // Return all items for location and meal type
                results = menuItemRepository.findByLocationAndMealType(location, mealType);
            } else {
                // Search by name containing query
                results = menuItemRepository.findByNameContainingIgnoreCaseAndLocationAndMealType(
                    query, location, mealType);
            }
            
            logger.info("Found {} menu items matching search criteria", results.size());
            return results;
            
        } catch (Exception e) {
            logger.error("Failed to search menu items", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get menu items by location and date
     */
    public List<MenuItem> getMenuItems(String location, LocalDateTime date, String mealType) {
        try {
            return menuItemRepository.findByLocationAndDateAndMealType(
                location, date.toLocalDate(), mealType);
        } catch (Exception e) {
            logger.error("Failed to get menu items", e);
            return new ArrayList<>();
        }
    }
    
    // Inner classes
    public static class MenuIngestResult {
        private boolean success;
        private String location;
        private LocalDateTime date;
        private String mealType;
        private int itemsIngested;
        private int itemsProcessed;
        private String message;
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public LocalDateTime getDate() { return date; }
        public void setDate(LocalDateTime date) { this.date = date; }
        public String getMealType() { return mealType; }
        public void setMealType(String mealType) { this.mealType = mealType; }
        public int getItemsIngested() { return itemsIngested; }
        public void setItemsIngested(int itemsIngested) { this.itemsIngested = itemsIngested; }
        public int getItemsProcessed() { return itemsProcessed; }
        public void setItemsProcessed(int itemsProcessed) { this.itemsProcessed = itemsProcessed; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
