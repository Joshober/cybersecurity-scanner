package com.nutrition.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.model.FoodRecognition;
import com.nutrition.model.NutritionEstimate;
import com.nutrition.model.UserMeal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ModelServiceClient {
    
    private static final Logger logger = LoggerFactory.getLogger(ModelServiceClient.class);
    
    @Value("${MODEL_SERVICE_URL:http://localhost:8000}")
    private String modelServiceUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public ModelServiceClient() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Call the model service to recognize food in an image
     */
    public UserMeal analyzePlate(byte[] imageBytes, String location, String mealType) {
        try {
            logger.info("Calling model service for food recognition");
            
            // Prepare the request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            // Create a temporary MultipartFile from byte array
            MultipartFile imageFile = new ByteArrayMultipartFile(
                imageBytes, 
                "image", 
                "image.jpg", 
                "image/jpeg"
            );
            
            body.add("image", imageFile);
            body.add("location", location);
            body.add("meal_type", mealType);
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = 
                new HttpEntity<>(body, headers);
            
            // Make the request
            String url = modelServiceUrl + "/recognize";
            ResponseEntity<Map> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                requestEntity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Boolean success = (Boolean) responseBody.get("success");
                
                if (success != null && success) {
                    return parseModelServiceResponse(responseBody, location, mealType);
                } else {
                    logger.warn("Model service returned unsuccessful response: {}", responseBody);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error calling model service: {}", e.getMessage(), e);
        }
        
        // Fallback to mock implementation if model service fails
        logger.info("Falling back to mock implementation");
        return createMockUserMeal(location, mealType);
    }
    
    /**
     * Get food labels from the model service
     */
    public List<String> getFoodLabels() {
        try {
            String url = modelServiceUrl + "/labels";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Boolean success = (Boolean) responseBody.get("success");
                
                if (success != null && success) {
                    @SuppressWarnings("unchecked")
                    List<String> labels = (List<String>) responseBody.get("labels");
                    if (labels != null) {
                        return labels;
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error getting food labels from model service: {}", e.getMessage(), e);
        }
        
        // Fallback to default labels
        return Arrays.asList(
            "apple", "banana", "bread", "broccoli", "carrot", "chicken", "corn", "egg",
            "french_fries", "hamburger", "hot_dog", "ice_cream", "orange", "pizza",
            "rice", "salad", "sandwich", "soup", "steak", "strawberry", "tomato",
            "watermelon", "pasta", "cheese", "yogurt", "milk", "coffee", "tea",
            "cake", "cookie", "donut", "muffin"
        );
    }
    
    /**
     * Check if the model service is healthy
     */
    public boolean isModelServiceHealthy() {
        try {
            String url = modelServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.warn("Model service health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    private UserMeal parseModelServiceResponse(Map<String, Object> responseBody, String location, String mealType) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");
        
        if (results == null || results.isEmpty()) {
            return createMockUserMeal(location, mealType);
        }
        
        List<FoodRecognition> recognizedFoods = new ArrayList<>();
        
        for (Map<String, Object> result : results) {
            String foodName = (String) result.get("food_name");
            Double confidence = ((Number) result.get("confidence")).doubleValue();
            Boolean isFromMenu = (Boolean) result.get("is_from_menu");
            
            if (foodName != null && confidence != null) {
                FoodRecognition foodRecognition = new FoodRecognition();
                foodRecognition.setDetectedFoodName(foodName);
                foodRecognition.setConfidenceScore(confidence);
                foodRecognition.setIsFromMenu(isFromMenu != null ? isFromMenu : false);
                foodRecognition.setSegmentationMask("model_service_mask");
                
                // Create nutrition estimates
                List<NutritionEstimate> nutritionEstimates = createNutritionEstimates(foodRecognition);
                foodRecognition.setNutritionEstimates(nutritionEstimates);
                
                recognizedFoods.add(foodRecognition);
            }
        }
        
        UserMeal userMeal = new UserMeal();
        userMeal.setMealDate(LocalDateTime.now());
        userMeal.setMealType(mealType);
        userMeal.setFoodRecognitions(recognizedFoods);
        
        // Set the userMeal reference in each food recognition
        for (FoodRecognition foodRecognition : recognizedFoods) {
            foodRecognition.setUserMeal(userMeal);
        }
        
        return userMeal;
    }
    
    private List<NutritionEstimate> createNutritionEstimates(FoodRecognition foodRecognition) {
        List<NutritionEstimate> estimates = new ArrayList<>();
        
        // Create calories estimate
        NutritionEstimate caloriesEstimate = new NutritionEstimate();
        caloriesEstimate.setNutrientName("calories");
        caloriesEstimate.setEstimatedAmount(estimateCalories(foodRecognition.getDetectedFoodName()));
        caloriesEstimate.setUnit("kcal");
        caloriesEstimate.setSource("estimated");
        caloriesEstimate.setFoodRecognition(foodRecognition);
        estimates.add(caloriesEstimate);
        
        // Create protein estimate
        NutritionEstimate proteinEstimate = new NutritionEstimate();
        proteinEstimate.setNutrientName("protein");
        proteinEstimate.setEstimatedAmount(estimateProtein(foodRecognition.getDetectedFoodName()));
        proteinEstimate.setUnit("g");
        proteinEstimate.setSource("estimated");
        proteinEstimate.setFoodRecognition(foodRecognition);
        estimates.add(proteinEstimate);
        
        return estimates;
    }
    
    private double estimateCalories(String foodName) {
        // Simple calorie estimation based on food type
        String food = foodName.toLowerCase();
        if (food.contains("pizza") || food.contains("burger")) return 300.0;
        if (food.contains("salad") || food.contains("broccoli")) return 50.0;
        if (food.contains("chicken") || food.contains("steak")) return 200.0;
        if (food.contains("rice") || food.contains("pasta")) return 150.0;
        if (food.contains("apple") || food.contains("banana")) return 80.0;
        return 100.0; // Default
    }
    
    private double estimateProtein(String foodName) {
        // Simple protein estimation based on food type
        String food = foodName.toLowerCase();
        if (food.contains("chicken") || food.contains("steak")) return 25.0;
        if (food.contains("burger") || food.contains("pizza")) return 15.0;
        if (food.contains("rice") || food.contains("pasta")) return 5.0;
        if (food.contains("salad") || food.contains("broccoli")) return 3.0;
        if (food.contains("apple") || food.contains("banana")) return 1.0;
        return 5.0; // Default
    }
    
    private UserMeal createMockUserMeal(String location, String mealType) {
        // Fallback mock implementation
        List<FoodRecognition> recognizedFoods = new ArrayList<>();
        
        FoodRecognition foodRecognition = new FoodRecognition();
        foodRecognition.setDetectedFoodName("Sample Food");
        foodRecognition.setConfidenceScore(0.85);
        foodRecognition.setIsFromMenu(true);
        foodRecognition.setSegmentationMask("mock_mask");
        
        List<NutritionEstimate> nutritionEstimates = createNutritionEstimates(foodRecognition);
        foodRecognition.setNutritionEstimates(nutritionEstimates);
        recognizedFoods.add(foodRecognition);
        
        UserMeal userMeal = new UserMeal();
        userMeal.setMealDate(LocalDateTime.now());
        userMeal.setMealType(mealType);
        userMeal.setFoodRecognitions(recognizedFoods);
        
        foodRecognition.setUserMeal(userMeal);
        
        return userMeal;
    }
    
    /**
     * Simple implementation of MultipartFile for byte array
     */
    private static class ByteArrayMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String name;
        private final String originalFilename;
        private final String contentType;
        
        public ByteArrayMultipartFile(byte[] content, String name, String originalFilename, String contentType) {
            this.content = content;
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
        }
        
        @Override
        public String getName() {
            return name;
        }
        
        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }
        
        @Override
        public String getContentType() {
            return contentType;
        }
        
        @Override
        public boolean isEmpty() {
            return content.length == 0;
        }
        
        @Override
        public long getSize() {
            return content.length;
        }
        
        @Override
        public byte[] getBytes() {
            return content;
        }
        
        @Override
        public java.io.InputStream getInputStream() {
            return new java.io.ByteArrayInputStream(content);
        }
        
        @Override
        public void transferTo(java.io.File dest) throws java.io.IOException {
            java.nio.file.Files.write(dest.toPath(), content);
        }
    }
}
