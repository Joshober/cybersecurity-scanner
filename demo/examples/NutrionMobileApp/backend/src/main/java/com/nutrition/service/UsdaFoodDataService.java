package com.nutrition.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for searching USDA FoodData Central API
 * This provides comprehensive nutrition data for a wide variety of foods
 * 
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 * No API key required for basic searches
 */
@Service
public class UsdaFoodDataService {
    
    private static final Logger logger = LoggerFactory.getLogger(UsdaFoodDataService.class);
    
    private static final String USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
    private static final String USDA_API_KEY = "DEMO_KEY"; // Can be set via environment variable if needed
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public UsdaFoodDataService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Search USDA FoodData Central for foods matching the query
     * @param query Food name to search for
     * @param maxResults Maximum number of results to return (default: 10)
     * @return List of food search results with nutrition data (compatible with FoodSearchService.FoodSearchResult)
     */
    public List<FoodSearchResult> searchFoods(String query, int maxResults) {
        List<FoodSearchResult> results = new ArrayList<>();
        
        if (query == null || query.trim().isEmpty()) {
            logger.warn("Empty query provided to USDA search");
            return results;
        }
        
        try {
            // Build request URL
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(USDA_SEARCH_URL)
                    .queryParam("query", query)
                    .queryParam("pageSize", Math.min(maxResults, 50)) // USDA API max is 50
                    .queryParam("api_key", USDA_API_KEY);
            
            String url = builder.toUriString();
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            @SuppressWarnings("null")
            List<MediaType> acceptList = List.of(MediaType.APPLICATION_JSON);
            headers.setAccept(acceptList);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Make API request
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode foodsNode = rootNode.get("foods");
                
                if (foodsNode != null && foodsNode.isArray()) {
                    for (JsonNode foodNode : foodsNode) {
                        FoodSearchResult result = parseUsdaFood(foodNode);
                        if (result != null) {
                            results.add(result);
                        }
                    }
                }
                
                logger.info("USDA search for '{}' returned {} results", query, results.size());
            } else {
                logger.warn("USDA API returned status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Error searching USDA FoodData Central: {}", e.getMessage(), e);
        }
        
        return results;
    }
    
    /**
     * Parse a USDA food JSON node into a FoodSearchResult
     * 
     * Note: USDA FoodData Central API returns nutrition values per 100g by default
     * for most food items. These values are stored as-is and the frontend will
     * calculate actual values based on the quantity entered by the user.
     */
    private FoodSearchResult parseUsdaFood(JsonNode foodNode) {
        try {
            // Get food name
            String description = foodNode.has("description") 
                    ? foodNode.get("description").asText() 
                    : "Unknown Food";
            
            FoodSearchResult result = new FoodSearchResult(description, "usda");
            
            // Extract nutrition data from foodNutrients array
            // USDA API returns values per 100g for most nutrients
            JsonNode nutrientsNode = foodNode.get("foodNutrients");
            if (nutrientsNode != null && nutrientsNode.isArray()) {
                for (JsonNode nutrientNode : nutrientsNode) {
                    if (!nutrientNode.has("nutrient")) continue;
                    
                    JsonNode nutrient = nutrientNode.get("nutrient");
                    String nutrientName = nutrient.has("name") 
                            ? nutrient.get("name").asText().toLowerCase() 
                            : "";
                    
                    Double amount = nutrientNode.has("amount") 
                            ? nutrientNode.get("amount").asDouble() 
                            : null;
                    
                    if (amount == null) continue;
                    
                    // Map USDA nutrient names to our fields
                    if (nutrientName.contains("energy") || nutrientName.contains("calories")) {
                        result.setCalories(amount);
                    } else if (nutrientName.contains("protein")) {
                        result.setProtein(amount);
                    } else if (nutrientName.contains("carbohydrate") || nutrientName.contains("carb")) {
                        result.setCarbs(amount);
                    } else if (nutrientName.contains("total lipid") || nutrientName.contains("fat")) {
                        result.setFat(amount);
                    } else if (nutrientName.contains("fiber")) {
                        result.setFiber(amount);
                    } else if (nutrientName.contains("sugar")) {
                        result.setSugar(amount);
                    } else if (nutrientName.contains("sodium")) {
                        result.setSodium(amount);
                    }
                }
            }
            
            // Add metadata
            Map<String, Object> metadata = new HashMap<>();
            if (foodNode.has("fdcId")) {
                metadata.put("fdcId", foodNode.get("fdcId").asLong());
            }
            if (foodNode.has("dataType")) {
                metadata.put("dataType", foodNode.get("dataType").asText());
            }
            if (foodNode.has("brandOwner")) {
                metadata.put("brandOwner", foodNode.get("brandOwner").asText());
            }
            result.setMetadata(metadata);
            
            return result;
            
        } catch (Exception e) {
            logger.error("Error parsing USDA food data: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Food search result DTO (shared with FoodSearchService and OpenRouterService)
     * Note: This should match the structure in FoodSearchService.FoodSearchResult
     */
    public static class FoodSearchResult {
        private String foodName;
        private String source; // "usda", "menu", "chat"
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
        private Double fiber;
        private Double sugar;
        private Double sodium;
        private Map<String, Object> metadata;
        
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
}

