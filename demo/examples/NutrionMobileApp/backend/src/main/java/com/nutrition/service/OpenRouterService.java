package com.nutrition.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.model.FoodRecognition;
import com.nutrition.model.NutritionEstimate;
import com.nutrition.model.UserMeal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class OpenRouterService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenRouterService.class);
    
    @Value("${openrouter.api-key:}")
    private String apiKey;
    
    @Value("${openrouter.model:openai/gpt-4o}")
    private String model;
    
    @Value("${openrouter.enabled:false}")
    private boolean enabled;
    
    @Value("${openrouter.use-only:false}")
    private boolean useOnly;
    
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Autowired(required = false)
    @SuppressWarnings("unused")
    private FoodSegmentationService segmentationService;
    
    public OpenRouterService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Check if OpenRouter is enabled and configured
     */
    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isEmpty();
    }
    
    /**
     * Check if OpenRouter-only mode is enabled (no local model fallback)
     */
    public boolean isUseOnlyMode() {
        return isEnabled() && useOnly;
    }
    
    /**
     * Recognize food items and estimate portion sizes using OpenRouter API
     */
    public UserMeal recognizeFood(byte[] imageBytes, String location, String mealType) {
        return recognizeFood(imageBytes, location, mealType, null);
    }
    
    /**
     * Recognize food items with optional hints using OpenRouter API
     */
    public UserMeal recognizeFood(byte[] imageBytes, String location, String mealType, List<String> hints) {
        if (!isEnabled()) {
            throw new IllegalStateException("OpenRouter is not enabled or API key is not configured");
        }
        
        try {
            
            // Encode image to base64
            String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);
            
            // Determine image MIME type (simplified - assume JPEG)
            String mimeType = "image/jpeg";
            
            // Build hints section if provided
            String hintsSection = "";
            if (hints != null && !hints.isEmpty()) {
                String hintsList = String.join(", ", hints);
                hintsSection = String.format(
                    "\n\nIMPORTANT: The user has indicated these foods may be present in the image: %s. " +
                    "Please pay special attention to these items when analyzing the image, but only include them if you can actually see them.",
                    hintsList
                );
            }
            
            // Create prompt for food recognition with count/unit/size (not grams)
            String prompt = String.format(
                "Analyze this food image and identify all food items visible.\n" +
                "For each food item, provide:\n" +
                "1. The food name (be specific, e.g., \"grilled chicken breast\" not just \"chicken\")\n" +
                "2. Count and unit (e.g., count: 2, unit: \"egg\" or \"slice\" or \"cup\")\n" +
                "3. Size label: \"small\", \"medium\", or \"large\"\n" +
                "4. Your confidence level (0.0 to 1.0)\n\n" +
                "IMPORTANT: Do NOT provide grams, calories, or weight estimates. Only provide qualitative information.\n\n" +
                "Context: This is from a dining hall at %s during %s.%s\n\n" +
                "Respond in JSON format with this structure:\n" +
                "{\n" +
                "  \"foods\": [\n" +
                "    {\n" +
                "      \"food_name\": \"scrambled eggs\",\n" +
                "      \"count\": 2,\n" +
                "      \"unit\": \"egg\",\n" +
                "      \"size_label\": \"medium\",\n" +
                "      \"confidence\": 0.95\n" +
                "    }\n" +
                "  ]\n" +
                "}\n\n" +
                "Only include foods you can clearly identify. Be specific about counts and units.",
                location, mealType, hintsSection
            );
            
            // Prepare the request payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            
            List<Map<String, Object>> content = new ArrayList<>();
            
            // Text content
            Map<String, Object> textContent = new HashMap<>();
            textContent.put("type", "text");
            textContent.put("text", prompt);
            content.add(textContent);
            
            // Image content
            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image_url");
            Map<String, Object> imageUrl = new HashMap<>();
            imageUrl.put("url", "data:" + mimeType + ";base64," + imageBase64);
            imageContent.put("image_url", imageUrl);
            content.add(imageContent);
            
            message.put("content", content);
            messages.add(message);
            payload.put("messages", messages);
            payload.put("temperature", 0.3);
            payload.put("max_tokens", 1000);
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "https://nutrition-app.local");
            headers.set("X-Title", "Nutrition App");
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
            
            // Make the API request
            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                OPENROUTER_API_URL,
                HttpMethod.POST,
                requestEntity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseOpenRouterResponse(response.getBody(), location, mealType);
            } else {
                logger.error("OpenRouter API returned status: {}", response.getStatusCode());
                throw new RuntimeException("OpenRouter API request failed");
            }
            
        } catch (Exception e) {
            logger.error("Error calling OpenRouter API: {}", e.getMessage(), e);
            throw new RuntimeException("OpenRouter food recognition failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Parse OpenRouter API response and convert to UserMeal
     */
    private UserMeal parseOpenRouterResponse(Map<String, Object> responseBody, String location, String mealType) {
        try {
            // Extract choices array
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            
            if (choices == null || choices.isEmpty()) {
                logger.error("OpenRouter API returned no choices");
                throw new RuntimeException("OpenRouter API returned no choices");
            }
            
            // Get message content
            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");
            
            // Parse JSON from response (might be wrapped in markdown code blocks)
            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.substring(7);
            }
            if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            content = content.trim();
            
            // Parse JSON
            JsonNode jsonNode = objectMapper.readTree(content);
            JsonNode foodsNode = jsonNode.get("foods");
            
            if (foodsNode == null || !foodsNode.isArray()) {
                logger.error("OpenRouter response does not contain 'foods' array");
                throw new RuntimeException("Invalid OpenRouter response format");
            }
            
            // Extract food names and OpenRouter metadata (count, unit, size)
            List<String> foodNames = new ArrayList<>();
            List<OpenRouterFoodInfo> openRouterInfoList = new ArrayList<>();
            
            for (JsonNode foodNode : foodsNode) {
                String foodName = foodNode.has("food_name") ? foodNode.get("food_name").asText() : "Unknown";
                int count = foodNode.has("count") ? foodNode.get("count").asInt() : 1;
                String unit = foodNode.has("unit") ? foodNode.get("unit").asText() : "serving";
                String sizeLabel = foodNode.has("size_label") ? foodNode.get("size_label").asText() : "medium";
                double confidence = foodNode.has("confidence") ? foodNode.get("confidence").asDouble() : 0.8;
                
                foodNames.add(foodName);
                
                OpenRouterFoodInfo info = new OpenRouterFoodInfo();
                info.foodName = foodName;
                info.count = count;
                info.unit = unit;
                info.sizeLabel = sizeLabel;
                info.confidence = confidence;
                openRouterInfoList.add(info);
            }
            
            // Convert to FoodRecognition objects
            List<FoodRecognition> foodRecognitions = new ArrayList<>();
            
            for (int i = 0; i < foodNames.size(); i++) {
                String foodName = foodNames.get(i);
                OpenRouterFoodInfo info = openRouterInfoList.get(i);
                
                // Create a portion size string for display (backward compatibility)
                String portionSize = String.format("%d %s (%s)", info.count, info.unit, info.sizeLabel);
                
                // Combine food name with portion size
                String foodNameWithPortion = foodName + " (" + portionSize + ")";
                
                FoodRecognition foodRecognition = new FoodRecognition();
                foodRecognition.setDetectedFoodName(foodNameWithPortion);
                foodRecognition.setConfidenceScore(info.confidence);
                foodRecognition.setIsFromMenu(isFoodFromMenu(foodName));
                
                // Store OpenRouter info for later use (we'll need to extend FoodRecognition or use a map)
                // For now, we'll store it in a way that can be accessed later
                // Create nutrition estimates (will be recalculated in combined mode)
                List<NutritionEstimate> nutritionEstimates = createNutritionEstimates(foodName, portionSize);
                foodRecognition.setNutritionEstimates(nutritionEstimates);
                
                foodRecognitions.add(foodRecognition);
            }
            
            // Store OpenRouter info in UserMeal for later access
            // We'll need to pass this through to the combined approach
            
            // Sort by confidence
            foodRecognitions.sort((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()));
            
            // Create UserMeal
            UserMeal userMeal = new UserMeal();
            userMeal.setMealDate(LocalDateTime.now());
            userMeal.setMealType(mealType);
            userMeal.setFoodRecognitions(foodRecognitions);
            
            // Set the userMeal reference in each food recognition
            for (FoodRecognition foodRecognition : foodRecognitions) {
                foodRecognition.setUserMeal(userMeal);
            }
            
            return userMeal;
            
        } catch (Exception e) {
            logger.error("Error parsing OpenRouter response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse OpenRouter response: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if food is likely from menu
     */
    private boolean isFoodFromMenu(String foodName) {
        String[] menuFoods = {
            "pizza", "burger", "salad", "pasta", "chicken", "rice",
            "sandwich", "soup", "steak", "fish", "broccoli", "carrot"
        };
        
        String foodLower = foodName.toLowerCase();
        for (String menuFood : menuFoods) {
            if (foodLower.contains(menuFood)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Create nutrition estimates based on food name and portion size
     */
    private List<NutritionEstimate> createNutritionEstimates(String foodName, String portionSize) {
        List<NutritionEstimate> estimates = new ArrayList<>();
        
        // Estimate calories based on food type and portion
        double calories = estimateCalories(foodName, portionSize);
        NutritionEstimate caloriesEstimate = new NutritionEstimate();
        caloriesEstimate.setNutrientName("calories");
        caloriesEstimate.setEstimatedAmount(calories);
        caloriesEstimate.setUnit("kcal");
        caloriesEstimate.setSource("openrouter_estimated");
        estimates.add(caloriesEstimate);
        
        // Estimate protein
        double protein = estimateProtein(foodName, portionSize);
        NutritionEstimate proteinEstimate = new NutritionEstimate();
        proteinEstimate.setNutrientName("protein");
        proteinEstimate.setEstimatedAmount(protein);
        proteinEstimate.setUnit("g");
        proteinEstimate.setSource("openrouter_estimated");
        estimates.add(proteinEstimate);
        
        // Estimate carbs
        double carbs = estimateCarbs(foodName, portionSize);
        NutritionEstimate carbsEstimate = new NutritionEstimate();
        carbsEstimate.setNutrientName("carbs");
        carbsEstimate.setEstimatedAmount(carbs);
        carbsEstimate.setUnit("g");
        carbsEstimate.setSource("openrouter_estimated");
        estimates.add(carbsEstimate);
        
        // Estimate fat
        double fat = estimateFat(foodName, portionSize);
        NutritionEstimate fatEstimate = new NutritionEstimate();
        fatEstimate.setNutrientName("fat");
        fatEstimate.setEstimatedAmount(fat);
        fatEstimate.setUnit("g");
        fatEstimate.setSource("openrouter_estimated");
        estimates.add(fatEstimate);
        
        return estimates;
    }
    
    /**
     * Estimate calories based on food name and portion size
     */
    private double estimateCalories(String foodName, String portionSize) {
        String food = foodName.toLowerCase();
        double baseCalories = 100.0; // Default
        
        if (food.contains("pizza") || food.contains("burger")) baseCalories = 300.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseCalories = 50.0;
        else if (food.contains("chicken") || food.contains("steak")) baseCalories = 200.0;
        else if (food.contains("rice") || food.contains("pasta")) baseCalories = 150.0;
        else if (food.contains("apple") || food.contains("banana")) baseCalories = 80.0;
        
        // Adjust based on portion size (simplified)
        if (portionSize.contains("2") || portionSize.contains("double")) baseCalories *= 1.5;
        else if (portionSize.contains("half") || portionSize.contains("small")) baseCalories *= 0.7;
        
        return baseCalories;
    }
    
    /**
     * Estimate protein based on food name and portion size
     */
    private double estimateProtein(String foodName, String portionSize) {
        String food = foodName.toLowerCase();
        double baseProtein = 5.0; // Default
        
        if (food.contains("chicken") || food.contains("steak")) baseProtein = 25.0;
        else if (food.contains("burger") || food.contains("pizza")) baseProtein = 15.0;
        else if (food.contains("rice") || food.contains("pasta")) baseProtein = 5.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseProtein = 3.0;
        else if (food.contains("apple") || food.contains("banana")) baseProtein = 1.0;
        
        // Adjust based on portion size
        if (portionSize.contains("2") || portionSize.contains("double")) baseProtein *= 1.5;
        else if (portionSize.contains("half") || portionSize.contains("small")) baseProtein *= 0.7;
        
        return baseProtein;
    }
    
    /**
     * Estimate carbs based on food name and portion size
     */
    private double estimateCarbs(String foodName, String portionSize) {
        String food = foodName.toLowerCase();
        double baseCarbs = 20.0; // Default
        
        if (food.contains("rice") || food.contains("pasta") || food.contains("pizza")) baseCarbs = 40.0;
        else if (food.contains("bread") || food.contains("burger")) baseCarbs = 30.0;
        else if (food.contains("apple") || food.contains("banana")) baseCarbs = 20.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseCarbs = 5.0;
        else if (food.contains("chicken") || food.contains("steak")) baseCarbs = 0.0;
        
        // Adjust based on portion size
        if (portionSize.contains("2") || portionSize.contains("double")) baseCarbs *= 1.5;
        else if (portionSize.contains("half") || portionSize.contains("small")) baseCarbs *= 0.7;
        
        return baseCarbs;
    }
    
    /**
     * Estimate fat based on food name and portion size
     */
    private double estimateFat(String foodName, String portionSize) {
        String food = foodName.toLowerCase();
        double baseFat = 10.0; // Default
        
        if (food.contains("burger") || food.contains("pizza")) baseFat = 20.0;
        else if (food.contains("steak") || food.contains("chicken")) baseFat = 15.0;
        else if (food.contains("rice") || food.contains("pasta")) baseFat = 2.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseFat = 0.5;
        else if (food.contains("apple") || food.contains("banana")) baseFat = 0.3;
        
        // Adjust based on portion size
        if (portionSize.contains("2") || portionSize.contains("double")) baseFat *= 1.5;
        else if (portionSize.contains("half") || portionSize.contains("small")) baseFat *= 0.7;
        
            return baseFat;
    }
    
    /**
     * Generate a personalized nutrition plan using OpenRouter AI
     * @param userDescription User's description of their situation/goals
     * @param includeBioData Whether to include user bio data
     * @param age User's age (if bio data included)
     * @param weight User's weight (if bio data included)
     * @param height User's height (if bio data included)
     * @param activityLevel User's activity level (if bio data included)
     * @param vegan Whether user is vegan (if bio data included)
     * @param vegetarian Whether user is vegetarian (if bio data included)
     * @return Generated nutrition plan as JSON string
     */
    public String generatePersonalizedPlan(String userDescription, boolean includeBioData,
                                          Integer age, String weight, String height,
                                          String activityLevel, Boolean vegan, Boolean vegetarian) {
        if (!isEnabled()) {
            throw new IllegalStateException("OpenRouter is not enabled or API key is not configured");
        }
        
        try {
            
            // Build the prompt
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("You are a professional nutritionist. Create a personalized nutrition plan based on the following information:\n\n");
            
            promptBuilder.append("User Description: ").append(userDescription).append("\n\n");
            
            if (includeBioData) {
                promptBuilder.append("Biological Data:\n");
                if (age != null) {
                    promptBuilder.append("- Age: ").append(age).append(" years\n");
                }
                if (weight != null && !weight.isEmpty()) {
                    promptBuilder.append("- Weight: ").append(weight).append(" kg\n");
                }
                if (height != null && !height.isEmpty()) {
                    promptBuilder.append("- Height: ").append(height).append(" cm\n");
                }
                if (activityLevel != null && !activityLevel.isEmpty()) {
                    promptBuilder.append("- Activity Level: ").append(activityLevel).append("\n");
                }
                if (vegan != null && vegan) {
                    promptBuilder.append("- Dietary Preference: Vegan\n");
                } else if (vegetarian != null && vegetarian) {
                    promptBuilder.append("- Dietary Preference: Vegetarian\n");
                }
                promptBuilder.append("\n");
            }
            
            promptBuilder.append("Generate a comprehensive nutrition plan in JSON format with the following structure:\n");
            promptBuilder.append("{\n");
            promptBuilder.append("  \"name\": \"Plan name (e.g., 'Personalized Plan for [goal]')\",\n");
            promptBuilder.append("  \"description\": \"Detailed description of the plan\",\n");
            promptBuilder.append("  \"dailyCalories\": \"Recommended daily calories\",\n");
            promptBuilder.append("  \"carbohydratesG\": \"Recommended daily carbohydrates in grams\",\n");
            promptBuilder.append("  \"proteinsG\": \"Recommended daily proteins in grams\",\n");
            promptBuilder.append("  \"fatsG\": \"Recommended daily fats in grams\",\n");
            promptBuilder.append("  \"hydration\": \"Recommended daily water intake in liters\",\n");
            promptBuilder.append("  \"recommendations\": \"Detailed meal recommendations and tips\"\n");
            promptBuilder.append("}\n\n");
            promptBuilder.append("IMPORTANT: Return ONLY valid JSON. Do NOT wrap the response in markdown code blocks (```json or ```). Return the raw JSON object only.\n\n");
            promptBuilder.append("Make sure the plan is realistic, healthy, and tailored to the user's specific needs and goals.");
            
            String prompt = promptBuilder.toString();
            
            // Build the request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            requestBody.put("messages", messages);
            
            // Make the API call
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "https://nutrition-app.com");
            headers.set("X-Title", "Nutrition App");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                OPENROUTER_API_URL,
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                // Extract the generated text
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = (String) message.get("content");
                    
                    // Extract JSON from markdown code blocks
                    String cleanedContent = extractJsonFromMarkdown(content);
                    
                    return cleanedContent;
                } else {
                    throw new RuntimeException("OpenRouter response does not contain choices");
                }
            } else {
                throw new RuntimeException("OpenRouter API returned error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Error generating personalized plan with OpenRouter: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate personalized plan: " + e.getMessage(), e);
        }
    }
    
    /**
     * Search for food nutrition information using chat API
     * This is used as a fallback when USDA database doesn't have the food
     * @param foodName Name of the food to search for
     * @return FoodSearchResult with nutrition data, or null if not found
     */
    public FoodSearchResult searchFoodNutrition(String foodName) {
        if (!isEnabled()) {
            logger.debug("OpenRouter not enabled, skipping chat search for: {}", foodName);
            return null;
        }
        
        try {
            String prompt = String.format(
                "Provide nutrition information for the following food: %s\n\n" +
                "Return ONLY a JSON object with this exact structure (no markdown, no code blocks):\n" +
                "{\n" +
                "  \"foodName\": \"%s\",\n" +
                "  \"calories\": <number per 100g>,\n" +
                "  \"protein\": <number in grams per 100g>,\n" +
                "  \"carbs\": <number in grams per 100g>,\n" +
                "  \"fat\": <number in grams per 100g>,\n" +
                "  \"fiber\": <number in grams per 100g or null>,\n" +
                "  \"sugar\": <number in grams per 100g or null>,\n" +
                "  \"sodium\": <number in milligrams per 100g or null>\n" +
                "}\n\n" +
                "If you cannot find reliable nutrition data for this food, return null for all numeric fields. " +
                "Use standard nutrition databases and be as accurate as possible.",
                foodName, foodName
            );
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.1); // Low temperature for accuracy
            requestBody.put("max_tokens", 500);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "https://nutrition-app.com");
            headers.set("X-Title", "Nutrition App");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                OPENROUTER_API_URL,
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = (String) message.get("content");
                    
                    // Extract JSON from markdown
                    String cleanedContent = extractJsonFromMarkdown(content);
                    
                    // Parse JSON response
                    JsonNode jsonNode = objectMapper.readTree(cleanedContent);
                    
                    FoodSearchResult result = new FoodSearchResult(
                        jsonNode.has("foodName") ? jsonNode.get("foodName").asText() : foodName,
                        "chat"
                    );
                    
                    if (jsonNode.has("calories") && !jsonNode.get("calories").isNull()) {
                        result.setCalories(jsonNode.get("calories").asDouble());
                    }
                    if (jsonNode.has("protein") && !jsonNode.get("protein").isNull()) {
                        result.setProtein(jsonNode.get("protein").asDouble());
                    }
                    if (jsonNode.has("carbs") && !jsonNode.get("carbs").isNull()) {
                        result.setCarbs(jsonNode.get("carbs").asDouble());
                    }
                    if (jsonNode.has("fat") && !jsonNode.get("fat").isNull()) {
                        result.setFat(jsonNode.get("fat").asDouble());
                    }
                    if (jsonNode.has("fiber") && !jsonNode.get("fiber").isNull()) {
                        result.setFiber(jsonNode.get("fiber").asDouble());
                    }
                    if (jsonNode.has("sugar") && !jsonNode.get("sugar").isNull()) {
                        result.setSugar(jsonNode.get("sugar").asDouble());
                    }
                    if (jsonNode.has("sodium") && !jsonNode.get("sodium").isNull()) {
                        result.setSodium(jsonNode.get("sodium").asDouble());
                    }
                    
                    // Add metadata
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("source", "openrouter_chat");
                    result.setMetadata(metadata);
                    
                    logger.info("OpenRouter chat search found nutrition data for: {}", foodName);
                    return result;
                }
            }
            
        } catch (Exception e) {
            logger.warn("Error searching food nutrition with OpenRouter chat: {}", e.getMessage());
        }
        
        return null;
    }
    
    /**
     * Food search result DTO (shared with FoodSearchService and UsdaFoodDataService)
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
    
    /**
     * Extracts JSON from markdown code blocks
     */
    private String extractJsonFromMarkdown(String content) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }
        
        String trimmed = content.trim();
        
        if (trimmed.startsWith("```")) {
            int startIndex = trimmed.indexOf('\n');
            if (startIndex == -1) {
                startIndex = trimmed.indexOf('\r');
            }
            if (startIndex == -1) {
                int endIndex = trimmed.lastIndexOf("```");
                if (endIndex > 0) {
                    return trimmed.substring(3, endIndex).trim();
                }
                return trimmed.substring(3).trim();
            }
            
            int endIndex = trimmed.lastIndexOf("```");
            if (endIndex > startIndex) {
                return trimmed.substring(startIndex + 1, endIndex).trim();
            } else {
                return trimmed.substring(startIndex + 1).trim();
            }
        }
        return trimmed;
    }
    
    /**
     * DTO for OpenRouter food information
     */
    public static class OpenRouterFoodInfo {
        public String foodName;
        public int count;
        public String unit;
        public String sizeLabel;
        public double confidence;
    }
    
    /**
     * Get OpenRouter food info from UserMeal (stored as metadata)
     * This is a helper method to extract the info we stored during parsing
     */
    public static List<OpenRouterFoodInfo> extractOpenRouterInfo(UserMeal meal) {
        // For now, we'll parse it from the food name format
        // In a future enhancement, we could store this in a separate field
        List<OpenRouterFoodInfo> infoList = new ArrayList<>();
        
        if (meal.getFoodRecognitions() != null) {
            for (FoodRecognition recognition : meal.getFoodRecognitions()) {
                String foodNameWithPortion = recognition.getDetectedFoodName();
                OpenRouterFoodInfo info = new OpenRouterFoodInfo();
                
                // Extract base food name
                if (foodNameWithPortion.contains(" (")) {
                    info.foodName = foodNameWithPortion.substring(0, foodNameWithPortion.indexOf(" ("));
                    String portionPart = foodNameWithPortion.substring(foodNameWithPortion.indexOf(" (") + 2, 
                                                                      foodNameWithPortion.lastIndexOf(")"));
                    // Parse portion part: "2 egg (medium)" or similar
                    // This is a simplified parser - in production, you might want more robust parsing
                    try {
                        String[] parts = portionPart.split(" ");
                        if (parts.length >= 2) {
                            info.count = Integer.parseInt(parts[0]);
                            info.unit = parts[1];
                            if (parts.length >= 3 && parts[2].startsWith("(")) {
                                info.sizeLabel = parts[2].substring(1, parts[2].length() - 1);
                            } else {
                                info.sizeLabel = "medium";
                            }
                        } else {
                            info.count = 1;
                            info.unit = "serving";
                            info.sizeLabel = "medium";
                        }
                    } catch (Exception e) {
                        // Fallback
                        info.count = 1;
                        info.unit = "serving";
                        info.sizeLabel = "medium";
                    }
                } else {
                    info.foodName = foodNameWithPortion;
                    info.count = 1;
                    info.unit = "serving";
                    info.sizeLabel = "medium";
                }
                
                info.confidence = recognition.getConfidenceScore() != null ? recognition.getConfidenceScore() : 0.8;
                infoList.add(info);
            }
        }
        
        return infoList;
    }
}

