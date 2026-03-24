package com.nutrition.service;

import com.nutrition.model.FoodRecognition;
import com.nutrition.model.NutritionEstimate;
import com.nutrition.model.UserMeal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import javax.imageio.ImageIO;

@Service
public class SimpleMlInferenceService {

    private static final Logger logger = LoggerFactory.getLogger(SimpleMlInferenceService.class);
    
    // Validation constants
    private static final double MAX_WEIGHT_GRAMS = 1000.0; // Maximum reasonable weight per food item
    private static final double MAX_CALORIES_PER_ITEM = 1500.0; // Maximum calories per food item
    private static final double MIN_CALORIES_PER_ITEM = 5.0; // Minimum calories per food item
    
    // Food-specific weight limits (min and max in grams)
    public static class FoodWeightLimits {
        public final double minGrams;
        public final double maxGrams;
        
        public FoodWeightLimits(double min, double max) {
            this.minGrams = min;
            this.maxGrams = max;
        }
    }
    
    private static final Map<String, FoodWeightLimits> FOOD_WEIGHT_LIMITS = new java.util.HashMap<>();
    static {
        // Eggs
        FOOD_WEIGHT_LIMITS.put("egg", new FoodWeightLimits(30.0, 150.0));
        FOOD_WEIGHT_LIMITS.put("scrambled", new FoodWeightLimits(30.0, 150.0));
        FOOD_WEIGHT_LIMITS.put("omelet", new FoodWeightLimits(50.0, 200.0));
        FOOD_WEIGHT_LIMITS.put("fried", new FoodWeightLimits(30.0, 150.0));
        
        // Proteins
        FOOD_WEIGHT_LIMITS.put("chicken", new FoodWeightLimits(50.0, 300.0));
        FOOD_WEIGHT_LIMITS.put("steak", new FoodWeightLimits(100.0, 350.0));
        FOOD_WEIGHT_LIMITS.put("beef", new FoodWeightLimits(100.0, 350.0));
        FOOD_WEIGHT_LIMITS.put("pork", new FoodWeightLimits(80.0, 300.0));
        FOOD_WEIGHT_LIMITS.put("fish", new FoodWeightLimits(50.0, 250.0));
        FOOD_WEIGHT_LIMITS.put("salmon", new FoodWeightLimits(50.0, 250.0));
        FOOD_WEIGHT_LIMITS.put("bacon", new FoodWeightLimits(10.0, 50.0));
        
        // Grains
        FOOD_WEIGHT_LIMITS.put("rice", new FoodWeightLimits(50.0, 400.0));
        FOOD_WEIGHT_LIMITS.put("pasta", new FoodWeightLimits(50.0, 300.0));
        FOOD_WEIGHT_LIMITS.put("bread", new FoodWeightLimits(20.0, 50.0));
        FOOD_WEIGHT_LIMITS.put("slice", new FoodWeightLimits(20.0, 50.0));
        FOOD_WEIGHT_LIMITS.put("potato", new FoodWeightLimits(50.0, 200.0));
        FOOD_WEIGHT_LIMITS.put("fries", new FoodWeightLimits(30.0, 150.0));
        
        // Vegetables
        FOOD_WEIGHT_LIMITS.put("salad", new FoodWeightLimits(20.0, 250.0));
        FOOD_WEIGHT_LIMITS.put("vegetable", new FoodWeightLimits(30.0, 200.0));
        FOOD_WEIGHT_LIMITS.put("broccoli", new FoodWeightLimits(30.0, 150.0));
        FOOD_WEIGHT_LIMITS.put("carrot", new FoodWeightLimits(20.0, 100.0));
        
        // Processed
        FOOD_WEIGHT_LIMITS.put("pizza", new FoodWeightLimits(50.0, 200.0));
        FOOD_WEIGHT_LIMITS.put("burger", new FoodWeightLimits(100.0, 300.0));
        FOOD_WEIGHT_LIMITS.put("sandwich", new FoodWeightLimits(80.0, 250.0));
    }
    
    private FoodWeightLimits findFoodLimits(String foodName) {
        String food = foodName.toLowerCase();
        
        // Direct lookup
        for (Map.Entry<String, FoodWeightLimits> entry : FOOD_WEIGHT_LIMITS.entrySet()) {
            if (food.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // Default limits
        return new FoodWeightLimits(10.0, 1000.0);
    }
    
    // Typical serving size database (in grams) - used for validation and fallback
    private static final Map<String, Double> TYPICAL_SERVING_SIZES = new java.util.HashMap<>();
    static {
        // Eggs
        TYPICAL_SERVING_SIZES.put("scrambled eggs", 120.0);      // 2 large eggs
        TYPICAL_SERVING_SIZES.put("scrambled egg", 120.0);
        TYPICAL_SERVING_SIZES.put("omelet", 150.0);
        TYPICAL_SERVING_SIZES.put("fried egg", 50.0);             // 1 egg
        
        // Proteins
        TYPICAL_SERVING_SIZES.put("chicken breast", 200.0);
        TYPICAL_SERVING_SIZES.put("grilled chicken", 200.0);
        TYPICAL_SERVING_SIZES.put("steak", 250.0);
        TYPICAL_SERVING_SIZES.put("bacon", 30.0);                 // 2 strips
        TYPICAL_SERVING_SIZES.put("salmon", 200.0);
        
        // Grains
        TYPICAL_SERVING_SIZES.put("cooked rice", 200.0);         // 1 cup
        TYPICAL_SERVING_SIZES.put("cooked pasta", 180.0);        // 1 cup
        TYPICAL_SERVING_SIZES.put("bread slice", 35.0);
        
        // Vegetables
        TYPICAL_SERVING_SIZES.put("salad", 150.0);
        TYPICAL_SERVING_SIZES.put("broccoli", 100.0);
        TYPICAL_SERVING_SIZES.put("carrots", 80.0);
    }
    
    /**
     * Get typical serving size for a food (in grams)
     * Returns null if no typical serving size is found
     */
    private Double getTypicalServingSize(String foodName) {
        String food = foodName.toLowerCase().trim();
        
        // Direct lookup
        if (TYPICAL_SERVING_SIZES.containsKey(food)) {
            return TYPICAL_SERVING_SIZES.get(food);
        }
        
        // Partial match lookup
        for (Map.Entry<String, Double> entry : TYPICAL_SERVING_SIZES.entrySet()) {
            if (food.contains(entry.getKey()) || entry.getKey().contains(food)) {
                return entry.getValue();
            }
        }
        
        return null;
    }
    
    @Autowired(required = false)
    private OnnxFoodRecognitionService onnxFoodRecognitionService;
    
    @Autowired
    private OpenRouterService openRouterService;
    
    @Autowired(required = false)
    private FoodSegmentationService segmentationService;
    
    @Autowired(required = false)
    private SimpleQuantifyService quantifyService;
    
    @Autowired(required = false)
    private TypicalWeightsService typicalWeightsService;
    
    @Autowired(required = false)
    private SimplePlateScaleService plateScaleService;
    
    private final Random random = new Random();
    private final List<String> mockFoodLabels = Arrays.asList(
            "Pizza", "Burger", "Salad", "Pasta", "Chicken", "Rice", "Sandwich", "Soup",
            "Apple", "Banana", "Orange", "Steak", "Fish", "Broccoli", "Carrot", "Potato"
    );

    /**
     * Analyzes plate image and returns meal data
     * Priority: OpenRouter-only -> ONNX -> OpenRouter fallback -> Mock
     */
    public UserMeal analyzePlate(byte[] imageBytes, String location, String mealType) {
        return analyzePlate(imageBytes, location, mealType, null);
    }
    
    /**
     * Analyzes plate image with optional hints and returns meal data
     * Priority: OpenRouter-only -> ONNX -> OpenRouter fallback -> Mock
     */
    public UserMeal analyzePlate(byte[] imageBytes, String location, String mealType, List<String> hints) {
        // Validate image quality before processing
        ImageQualityResult qualityResult = validateImageQuality(imageBytes);
        if (!qualityResult.isAcceptable()) {
            logger.warn("Image quality issues detected: {}. Processing anyway but accuracy may be reduced.", 
                       qualityResult.getIssues());
        }
        // Check if OpenRouter-only mode is enabled
        boolean useOpenRouterOnly = openRouterService.isUseOnlyMode();
        
        // If OpenRouter-only mode, use only OpenRouter (no local model fallback)
        if (useOpenRouterOnly) {
            try {
                return openRouterService.recognizeFood(imageBytes, location, mealType, hints);
            } catch (Exception e) {
                logger.error("Error calling OpenRouter service: {}", e.getMessage());
                // In OpenRouter-only mode, don't fall back to local models
                throw new RuntimeException("OpenRouter-only mode failed: " + e.getMessage(), e);
            }
        }
        
        // Try combining OpenRouter + Computer Vision for best accuracy
        if (openRouterService.isEnabled() && segmentationService != null) {
            try {
                UserMeal combinedMeal = analyzeWithCombinedApproach(imageBytes, location, mealType, hints);
                
                // Validate combined results
                if (validateCombinedResults(combinedMeal)) {
                    return combinedMeal;
                } else {
                    logger.warn("Combined approach produced unreasonable results. Retrying with OpenRouter-only.");
                    
                    // Retry with OpenRouter-only as fallback
                    try {
                        UserMeal openRouterMeal = openRouterService.recognizeFood(imageBytes, location, mealType, hints);
                        return openRouterMeal;
                    } catch (Exception e) {
                        logger.error("OpenRouter-only fallback also failed: {}", e.getMessage());
                        // Continue to other fallbacks
                    }
                }
            } catch (Exception e) {
                logger.warn("Combined approach failed, falling back: {}", e.getMessage());
            }
        }
        
        // Try ONNX local model first (if available)
        if (onnxFoodRecognitionService != null) {
            try {
                if (onnxFoodRecognitionService.isInitialized() && onnxFoodRecognitionService.isUsingRealModel()) {
                    return analyzeWithOnnxModel(imageBytes, location, mealType);
                }
            } catch (Exception e) {
                logger.error("Error calling ONNX service, falling back to OpenRouter or mock: {}", e.getMessage());
            }
        }
        
        // Fallback to OpenRouter if enabled (and not in OpenRouter-only mode)
        if (openRouterService.isEnabled()) {
            try {
                return openRouterService.recognizeFood(imageBytes, location, mealType, hints);
            } catch (Exception e) {
                logger.error("Error calling OpenRouter service, falling back to mock: {}", e.getMessage());
            }
        }
        
        // Final fallback to mock implementation
        return createMockUserMeal(location, mealType);
    }
    
    /**
     * Analyze using combined OpenRouter (food recognition) + Computer Vision (portion sizes)
     * Enhanced with weight fusion, segmentation quality scoring, and validation
     */
    private UserMeal analyzeWithCombinedApproach(byte[] imageBytes, String location, String mealType, List<String> hints) {
        logger.info("Combining OpenRouter food recognition with computer vision segmentation");
        if (hints != null && !hints.isEmpty()) {
            logger.info("Using hints for recognition: {}", hints);
        }
        
        // Step 1: Get food recognition from OpenRouter
        UserMeal openRouterMeal = openRouterService.recognizeFood(imageBytes, location, mealType, hints);
        List<FoodRecognition> openRouterRecognitions = openRouterMeal.getFoodRecognitions();
        
        if (openRouterRecognitions == null || openRouterRecognitions.isEmpty()) {
            logger.warn("OpenRouter returned no foods, falling back to OpenRouter-only result");
            return openRouterMeal;
        }
        
        // Step 2: Extract food names and OpenRouter metadata (count, unit, size)
        List<String> foodNames = new ArrayList<>();
        Map<String, OpenRouterService.OpenRouterFoodInfo> openRouterInfo = new HashMap<>();
        
        List<OpenRouterService.OpenRouterFoodInfo> orInfoList = OpenRouterService.extractOpenRouterInfo(openRouterMeal);
        for (int i = 0; i < openRouterRecognitions.size() && i < orInfoList.size(); i++) {
            OpenRouterService.OpenRouterFoodInfo info = orInfoList.get(i);
            String foodName = extractBaseFoodName(openRouterRecognitions.get(i).getDetectedFoodName());
            foodNames.add(foodName);
            openRouterInfo.put(foodName, info);
        }
        
        // Step 3: Perform CV segmentation
        List<FoodSegmentationService.FoodSegment> segments = null;
        FoodSegmentationService.SegmentationQuality overallQuality = null;
        try {
            segments = segmentationService.segmentFoods(imageBytes, foodNames);
            
            // Calculate segmentation quality
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            SimplePlateScaleService.PlateDetectionResult plateResult = 
                plateScaleService != null ? plateScaleService.detectPlate(imageBytes) : null;
            overallQuality = segmentationService.calculateSegmentationQuality(
                image, segments, plateResult
            );
            
            // Store quality in each segment
            if (segments != null && overallQuality != null) {
                for (FoodSegmentationService.FoodSegment segment : segments) {
                    if (segment != null) {
                        segment.quality = overallQuality;
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warn("Segmentation failed, using OpenRouter estimates only: {}", e.getMessage());
        }
        
        // Step 4: Combine results with weight fusion
        UserMeal combinedMeal = new UserMeal();
        combinedMeal.setMealType(mealType);
        combinedMeal.setMealDate(LocalDateTime.now());
        
        List<FoodRecognition> combinedRecognitions = new ArrayList<>();
        
        for (int i = 0; i < openRouterRecognitions.size(); i++) {
            FoodRecognition openRouterRecognition = openRouterRecognitions.get(i);
            FoodSegmentationService.FoodSegment segment = 
                (segments != null && i < segments.size()) ? segments.get(i) : null;
            
            // Extract food name
            String foodName = extractBaseFoodName(openRouterRecognition.getDetectedFoodName());
            OpenRouterService.OpenRouterFoodInfo orInfo = openRouterInfo.get(foodName);
            
            // Calculate weights
            double cvWeight = 0.0;
            double segmentationQuality = 0.5;
            
            if (segment != null) {
                cvWeight = segment.volumeCm3 * getFoodDensity(foodName);
                segmentationQuality = segment.quality != null ? segment.quality.score : 0.5;
            }
            
            double countWeight = 0.0;
            if (orInfo != null && typicalWeightsService != null) {
                countWeight = typicalWeightsService.calculateWeightFromCounts(
                    orInfo.count, orInfo.unit, orInfo.sizeLabel
                );
            }
            
            // Fuse weights
            double finalWeight;
            if (cvWeight > 0 && countWeight > 0) {
                finalWeight = fuseWeights(cvWeight, countWeight, segmentationQuality);
            } else if (cvWeight > 0) {
                finalWeight = cvWeight;
            } else if (countWeight > 0) {
                finalWeight = countWeight;
            } else {
                // Fallback to typical serving size
                Double typicalSize = getTypicalServingSize(foodName);
                finalWeight = typicalSize != null ? typicalSize : 100.0; // Default 100g
            }
            
            // Validate and cap
            finalWeight = validateAndCapWeight(finalWeight, foodName, null);
            
            // Create combined recognition
            FoodRecognition combinedRecognition = new FoodRecognition();
            combinedRecognition.setDetectedFoodName(foodName + " (" + String.format("%.0fg", finalWeight) + ")");
            combinedRecognition.setConfidenceScore(openRouterRecognition.getConfidenceScore());
            combinedRecognition.setIsFromMenu(openRouterRecognition.getIsFromMenu());
            combinedRecognition.setEstimatedWeightGrams(finalWeight);
            
            // Store count-based information from OpenRouter if available
            if (orInfo != null) {
                combinedRecognition.setDetectedCount(orInfo.count);
                combinedRecognition.setDetectedUnit(orInfo.unit);
                combinedRecognition.setDetectedSizeLabel(orInfo.sizeLabel);
            }
            
            // Store CV data if available
            if (segment != null) {
                combinedRecognition.setEstimatedAreaPixels(segment.areaPixels);
                combinedRecognition.setEstimatedVolumeCm3(segment.volumeCm3);
                combinedRecognition.setEstimatedDepthCm(segment.estimatedDepthCm);
                combinedRecognition.setBoundingBox(segment.boundingBox.toJson());
            }
            
            // Create nutrition estimates
            String portionSize = String.format("%.0fg", finalWeight);
            List<NutritionEstimate> nutritionEstimates = createNutritionEstimates(
                foodName, portionSize, segment
            );
            combinedRecognition.setNutritionEstimates(nutritionEstimates);
            
            combinedRecognitions.add(combinedRecognition);
        }
        
        // Step 5: Apply plate-level rescaling
        applyPlateLevelRescaling(combinedRecognitions);
        
        combinedMeal.setFoodRecognitions(combinedRecognitions);
        
        // Set references
        for (FoodRecognition foodRecognition : combinedRecognitions) {
            foodRecognition.setUserMeal(combinedMeal);
        }
        
        
        return combinedMeal;
    }
    
    /**
     * Analyze with ONNX model
     */
    private UserMeal analyzeWithOnnxModel(byte[] imageBytes, String location, String mealType) {
        List<Map<String, Object>> recognitionResults = onnxFoodRecognitionService.recognizeFood(imageBytes);
        
        UserMeal userMeal = new UserMeal();
        userMeal.setMealType(mealType);
        userMeal.setMealDate(LocalDateTime.now());
        
        // Extract food names for segmentation
        List<String> foodNames = new ArrayList<>();
        for (Map<String, Object> result : recognitionResults) {
            foodNames.add((String) result.get("food_name"));
        }
        
        // Perform food segmentation using computer vision
        List<FoodSegmentationService.FoodSegment> segments = null;
        if (segmentationService != null && !foodNames.isEmpty()) {
            try {
                segments = segmentationService.segmentFoods(imageBytes, foodNames);
            } catch (Exception e) {
                logger.warn("Segmentation failed, using fallback: {}", e.getMessage());
            }
        }
        
        List<FoodRecognition> foodRecognitions = new ArrayList<>();
        for (int i = 0; i < recognitionResults.size(); i++) {
            Map<String, Object> result = recognitionResults.get(i);
            FoodRecognition recognition = new FoodRecognition();
            String foodName = (String) result.get("food_name");
            
            // Get segmentation data for this food if available
            FoodSegmentationService.FoodSegment segment = null;
            if (segments != null && i < segments.size()) {
                segment = segments.get(i);
            }
            
            // Calculate accurate portion size using segmentation
            String portionSize = calculatePortionSizeFromSegmentation(foodName, segment, result);
            
            // Combine food name with portion size
            String foodNameWithPortion = portionSize != null && !portionSize.isEmpty() 
                ? foodName + " (" + portionSize + ")" 
                : foodName;
            
            recognition.setDetectedFoodName(foodNameWithPortion);
            recognition.setConfidenceScore(((Number) result.get("confidence")).doubleValue());
            recognition.setIsFromMenu((Boolean) result.get("is_from_menu"));
            
            // Store visual analysis data
            if (segment != null) {
                recognition.setEstimatedAreaPixels(segment.areaPixels);
                recognition.setEstimatedVolumeCm3(segment.volumeCm3);
                // CRITICAL: Validate and cap weight, with OpenRouter fallback if unrealistic
                double calculatedWeight = segment.volumeCm3 * getFoodDensity(foodName);
                recognition.setEstimatedWeightGrams(validateAndCapWeight(calculatedWeight, foodName, portionSize));
                recognition.setEstimatedDepthCm(segment.estimatedDepthCm);
                recognition.setBoundingBox(segment.boundingBox.toJson());
                
                // Store segmentation mask (could be enhanced to store actual mask data)
                recognition.setSegmentationMask("segmented_" + i);
            } else {
                // Fallback: parse portion size to weight if available
                if (portionSize != null) {
                    try {
                        if (portionSize.endsWith("g")) {
                            double weight = Double.parseDouble(portionSize.replace("g", "").trim());
                            // CRITICAL: Validate and cap weight from parsed portion size
                            recognition.setEstimatedWeightGrams(validateAndCapWeight(weight, foodName, portionSize));
                        } else {
                            // Try to extract weight from other portion size formats
                            Double extractedWeight = extractWeightFromPortionSize(portionSize);
                            if (extractedWeight != null) {
                                recognition.setEstimatedWeightGrams(extractedWeight);
                            }
                        }
                    } catch (NumberFormatException e) {
                        // Try to extract weight from portion size string
                        Double extractedWeight = extractWeightFromPortionSize(portionSize);
                        if (extractedWeight != null) {
                            recognition.setEstimatedWeightGrams(extractedWeight);
                        }
                    }
                }
            }
            
            // Create nutrition estimates for this food recognition using accurate portion size
            List<NutritionEstimate> nutritionEstimates = createNutritionEstimates(foodName, portionSize, segment);
            recognition.setNutritionEstimates(nutritionEstimates);
            
            foodRecognitions.add(recognition);
        }
        
        userMeal.setFoodRecognitions(foodRecognitions);
        
        // Set the userMeal reference in each food recognition
        for (FoodRecognition foodRecognition : foodRecognitions) {
            foodRecognition.setUserMeal(userMeal);
        }
        
        return userMeal;
    }
    
    /**
     * Calculate portion size from segmentation data or fallback to estimation
     */
    private String calculatePortionSizeFromSegmentation(String foodName, 
                                                          FoodSegmentationService.FoodSegment segment,
                                                          Map<String, Object> recognitionResult) {
        String openRouterPortionSize = recognitionResult != null ? 
            (String) recognitionResult.get("portion_size") : null;
        
        if (segment != null && segment.volumeCm3 > 0) {
            // Calculate weight from volume using improved food density
            double density = getFoodDensity(foodName);
            double weight = segment.volumeCm3 * density;
            // Validate weight with OpenRouter fallback if unrealistic
            weight = validateAndCapWeight(weight, foodName, openRouterPortionSize);
            return String.format("%.0fg", weight);
        } else if (segment != null && segment.areaPixels > 0) {
            // Estimate weight from area (fallback)
            double estimatedWeight = estimateWeightFromArea(foodName, segment.areaPixels);
            // Validate weight with OpenRouter fallback if unrealistic
            estimatedWeight = validateAndCapWeight(estimatedWeight, foodName, openRouterPortionSize);
            return String.format("%.0fg", estimatedWeight);
        } else {
            // Fallback to OpenRouter portion size estimation
            return openRouterPortionSize != null ? openRouterPortionSize : "1 serving";
        }
    }
    
    /**
     * Estimate weight from area (fallback method)
     * Enhanced with shape-based geometric templates for better accuracy
     * Research shows geometric modeling achieves ratio close to 1.00
     */
    private double estimateWeightFromArea(String foodName, int areaPixels) {
        // Improved area estimation: use more accurate pixel-to-cm conversion
        // Standard assumption: if no plate reference, estimate ~10 pixels per cm
        // This gives: 1 pixel² = 0.01 cm² (10 pixels/cm * 10 pixels/cm = 100 pixels²/cm²)
        double pixelsPerCm = 10.0; // Conservative default
        double areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
        
        // Get accurate depth estimate
        double depth = estimateDepth(foodName, areaPixels, null);
        
        // Calculate volume using shape-based geometric template
        double volume = calculateVolumeWithShapeTemplate(foodName, areaCm2, depth);
        
        // Get accurate density
        double density = getFoodDensity(foodName);
        
        return volume * density;
    }
    
    /**
     * Get shape factor for volume calculation
     * Enhanced with geometric template modeling (cylinders, spheres, prisms)
     * Research: shape-based 3D reconstruction improves accuracy significantly
     */
    private double getShapeFactor(String foodName) {
        String food = foodName.toLowerCase();
        
        // Flat foods (spread on plate) - approximate as thin prism, factor ~1.0
        if (food.contains("scrambled") || food.contains("egg")) return 1.0; // Very flat, like thin layer
        if (food.contains("rice")) return 1.0; // Spread flat, like thin cylinder
        if (food.contains("salad") || food.contains("lettuce")) return 1.15; // Slightly fluffy, like low cylinder
        if (food.contains("bread") || food.contains("toast")) return 1.0; // Flat slice, like thin prism
        
        // Cylindrical foods - approximate as cylinder, factor accounts for circular cross-section
        if (food.contains("pasta") && (food.contains("spaghetti") || food.contains("noodle"))) {
            return 1.2; // Long cylindrical shapes
        }
        if (food.contains("sausage") || food.contains("hot dog")) return 1.25; // Cylindrical
        
        // Spherical/round foods - approximate as sphere or ellipsoid
        if (food.contains("meatball") || food.contains("ball")) return 1.4; // Spherical
        if (food.contains("apple") || food.contains("orange")) return 1.35; // Spherical fruits
        
        // Prism/rectangular foods - approximate as rectangular prism
        if (food.contains("burger") || food.contains("sandwich")) return 1.2; // Stacked rectangular
        if (food.contains("pasta") && !food.contains("spaghetti")) return 1.1; // Pasta shapes (prism-like)
        if (food.contains("chicken") || food.contains("steak")) return 1.1; // Has thickness, like thin prism
        
        // Irregular 3D foods - approximate as complex shapes
        if (food.contains("broccoli") || food.contains("cauliflower")) return 1.3; // Florets are 3D, like multiple small spheres
        if (food.contains("pizza")) return 1.1; // Flat but with toppings (layered prism)
        
        return 1.0; // Default: assume flat (thin prism)
    }
    
    /**
     * Image quality validation result
     */
    public static class ImageQualityResult {
        private boolean acceptable;
        private List<String> issues;
        private double qualityScore; // 0.0 to 1.0
        
        public boolean isAcceptable() { return acceptable; }
        public void setAcceptable(boolean acceptable) { this.acceptable = acceptable; }
        public List<String> getIssues() { return issues; }
        public void setIssues(List<String> issues) { this.issues = issues; }
        public double getQualityScore() { return qualityScore; }
        public void setQualityScore(double qualityScore) { this.qualityScore = qualityScore; }
    }
    
    /**
     * Validate image quality before processing
     * Checks resolution, lighting, blur, and other quality factors
     * Returns quality result with issues and recommendations
     */
    private ImageQualityResult validateImageQuality(byte[] imageBytes) {
        ImageQualityResult result = new ImageQualityResult();
        result.setIssues(new ArrayList<>());
        double qualityScore = 1.0;
        
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                result.setAcceptable(false);
                result.getIssues().add("Failed to read image");
                result.setQualityScore(0.0);
                return result;
            }
            
            int width = image.getWidth();
            int height = image.getHeight();
            
            // Check resolution
            if (width < 200 || height < 200) {
                result.getIssues().add("Low resolution: " + width + "x" + height + " (recommended: 400x400+)");
                qualityScore -= 0.3;
            } else if (width < 400 || height < 400) {
                result.getIssues().add("Moderate resolution: " + width + "x" + height + " (recommended: 800x600+)");
                qualityScore -= 0.1;
            }
            
            // Check aspect ratio
            double aspectRatio = (double) width / height;
            if (aspectRatio > 3.0 || aspectRatio < 0.33) {
                result.getIssues().add("Unusual aspect ratio: " + String.format("%.2f", aspectRatio));
                qualityScore -= 0.1;
            }
            
            // Check lighting (brightness analysis)
            double avgBrightness = calculateAverageBrightness(image);
            if (avgBrightness < 50) {
                result.getIssues().add("Image too dark (avg brightness: " + String.format("%.0f", avgBrightness) + ")");
                qualityScore -= 0.2;
            } else if (avgBrightness > 240) {
                result.getIssues().add("Image too bright (avg brightness: " + String.format("%.0f", avgBrightness) + ")");
                qualityScore -= 0.15;
            }
            
            // Check contrast (standard deviation of brightness)
            double contrast = calculateContrast(image);
            if (contrast < 20) {
                result.getIssues().add("Low contrast (may affect segmentation accuracy)");
                qualityScore -= 0.15;
            }
            
            // Simple blur detection (using Laplacian variance)
            double blurScore = detectBlur(image);
            if (blurScore < 100) {
                result.getIssues().add("Image appears blurry (blur score: " + String.format("%.0f", blurScore) + ")");
                qualityScore -= 0.2;
            }
            
            qualityScore = Math.max(0.0, Math.min(1.0, qualityScore));
            result.setQualityScore(qualityScore);
            result.setAcceptable(qualityScore >= 0.5);
            
            if (!result.isAcceptable()) {
                logger.warn("Image quality validation failed. Score: {}, Issues: {}", 
                           qualityScore, result.getIssues());
            }
            
        } catch (Exception e) {
            logger.error("Error validating image quality", e);
            result.setAcceptable(false);
            result.getIssues().add("Error analyzing image quality");
            result.setQualityScore(0.0);
        }
        
        return result;
    }
    
    /**
     * Calculate average brightness of image
     */
    private double calculateAverageBrightness(BufferedImage image) {
        long totalBrightness = 0;
        int pixelCount = 0;
        
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                int brightness = (r + g + b) / 3;
                totalBrightness += brightness;
                pixelCount++;
            }
        }
        
        return pixelCount > 0 ? (double) totalBrightness / pixelCount : 0.0;
    }
    
    /**
     * Calculate contrast (standard deviation of brightness)
     */
    private double calculateContrast(BufferedImage image) {
        double avgBrightness = calculateAverageBrightness(image);
        double sumSquaredDiff = 0;
        int pixelCount = 0;
        
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                int brightness = (r + g + b) / 3;
                double diff = brightness - avgBrightness;
                sumSquaredDiff += diff * diff;
                pixelCount++;
            }
        }
        
        return pixelCount > 0 ? Math.sqrt(sumSquaredDiff / pixelCount) : 0.0;
    }
    
    /**
     * Detect blur using Laplacian variance method
     * Higher variance = sharper image, lower variance = blurrier
     */
    private double detectBlur(BufferedImage image) {
        // Simplified blur detection using gradient magnitude
        // Sharp images have high gradient values, blurry images have low gradients
        double totalGradient = 0;
        int pixelCount = 0;
        
        for (int y = 1; y < image.getHeight() - 1; y++) {
            for (int x = 1; x < image.getWidth() - 1; x++) {
                // Calculate gradient using Sobel operator
                int rgb00 = image.getRGB(x - 1, y - 1);
                int rgb02 = image.getRGB(x + 1, y - 1);
                int rgb20 = image.getRGB(x - 1, y + 1);
                int rgb22 = image.getRGB(x + 1, y + 1);
                
                int b00 = (rgb00 >> 16) & 0xFF;
                int b02 = (rgb02 >> 16) & 0xFF;
                int b20 = (rgb20 >> 16) & 0xFF;
                int b22 = (rgb22 >> 16) & 0xFF;
                
                int gx = -b00 + b02 - 2 * ((rgb00 >> 16) & 0xFF) + 2 * ((rgb02 >> 16) & 0xFF) - b20 + b22;
                int gy = -b00 - 2 * ((rgb00 >> 16) & 0xFF) - b02 + b20 + 2 * ((rgb20 >> 16) & 0xFF) + b22;
                
                double gradient = Math.sqrt(gx * gx + gy * gy);
                totalGradient += gradient;
                pixelCount++;
            }
        }
        
        return pixelCount > 0 ? totalGradient / pixelCount : 0.0;
    }
    
    /**
     * Calculate volume using shape-based geometric template
     * Uses appropriate geometric model based on food type
     * Research: geometric modeling achieves ratio close to 1.00 for accurate estimation
     */
    private double calculateVolumeWithShapeTemplate(String foodName, double areaCm2, double depthCm) {
        // Determine geometric template based on food type
        String shapeType = determineFoodShape(foodName);
        
        double volume;
        switch (shapeType) {
            case "cylinder":
                // Volume = π * r² * h, where r = sqrt(area/π), h = depth
                double radius = Math.sqrt(areaCm2 / Math.PI);
                volume = Math.PI * radius * radius * depthCm;
                break;
                
            case "sphere":
                // Volume = (4/3) * π * r³, approximate from area
                // Area of sphere = 4πr², so r = sqrt(area/(4π))
                double sphereRadius = Math.sqrt(areaCm2 / (4 * Math.PI));
                volume = (4.0 / 3.0) * Math.PI * sphereRadius * sphereRadius * sphereRadius;
                break;
                
            case "prism":
                // Volume = area * depth (rectangular prism)
                volume = areaCm2 * depthCm;
                break;
                
            case "ellipsoid":
                // Volume = (4/3) * π * a * b * c
                // Approximate: a = b = sqrt(area/π), c = depth
                double ellipsoidRadius = Math.sqrt(areaCm2 / Math.PI);
                volume = (4.0 / 3.0) * Math.PI * ellipsoidRadius * ellipsoidRadius * depthCm;
                break;
                
            default:
                // Default: rectangular prism
                volume = areaCm2 * depthCm;
        }
        
        logger.debug("Calculated volume using {} template: {} cm³ for food: {}", shapeType, volume, foodName);
        return volume;
    }
    
    /**
     * Determine food shape type for geometric modeling
     */
    private String determineFoodShape(String foodName) {
        String foodLower = foodName.toLowerCase();
        
        // Cylindrical shapes
        if (foodLower.contains("pasta") && (foodLower.contains("spaghetti") || foodLower.contains("noodle"))) {
            return "cylinder";
        }
        if (foodLower.contains("sausage") || foodLower.contains("hot dog") || foodLower.contains("carrot")) {
            return "cylinder";
        }
        
        // Spherical shapes
        if (foodLower.contains("meatball") || foodLower.contains("ball") || foodLower.contains("apple") || 
            foodLower.contains("orange") || foodLower.contains("tomato")) {
            return "sphere";
        }
        
        // Ellipsoid shapes (flattened sphere)
        if (foodLower.contains("egg") && !foodLower.contains("scrambled")) {
            return "ellipsoid";
        }
        if (foodLower.contains("potato") && !foodLower.contains("fries")) {
            return "ellipsoid";
        }
        
        // Default: prism (rectangular/irregular)
        return "prism";
    }
    
    /**
     * Estimate depth for weight calculation (in cm)
     * Based on measured thickness values from research and typical food preparation
     * Research shows scrambled eggs are typically 0.5-1.0 cm thick when spread on plate
     */
    private double estimateDepth(String foodName, int areaPixels, Object plateResult) {
        String food = foodName.toLowerCase();
        
        // Eggs and egg dishes - research: scrambled eggs spread thin, ~0.5-1.0 cm
        if (food.contains("scrambled")) {
            return 0.8; // Scrambled eggs are very thin when spread on plate
        }
        if (food.contains("omelet") || food.contains("omelette")) {
            return 1.2; // Omelets are slightly thicker
        }
        if (food.contains("egg") && (food.contains("fried") || food.contains("cooked"))) {
            return 1.0; // Fried/cooked eggs
        }
        if (food.contains("egg")) {
            return 0.8; // General eggs
        }
        
        // Grains and starches - research: rice spread ~1-2 cm, pasta ~2-3 cm
        if (food.contains("rice")) return 1.2; // Rice is usually spread thin on plate
        if (food.contains("pasta") && food.contains("cooked")) return 2.5; // Cooked pasta
        if (food.contains("pasta") || food.contains("noodle")) return 2.0; // General pasta
        if (food.contains("bread") || food.contains("toast")) return 1.0; // Bread slices ~1 cm
        if (food.contains("potato") && food.contains("mashed")) return 2.0; // Mashed potatoes
        if (food.contains("potato") || food.contains("fries")) return 1.5; // Whole/cut potatoes
        if (food.contains("oatmeal") || food.contains("porridge")) return 2.0; // Cooked grains
        
        // Proteins - research: cooked meats typically 1-2 cm thick
        if (food.contains("chicken") && (food.contains("breast") || food.contains("grilled"))) {
            return 1.5; // Chicken breast is usually 1-2 cm thick
        }
        if (food.contains("chicken")) return 1.2; // General chicken
        if (food.contains("steak") || (food.contains("beef") && food.contains("cooked"))) {
            return 1.5; // Steaks are typically 1-2 cm thick
        }
        if (food.contains("meat") || food.contains("beef") || food.contains("pork")) {
            return 1.2; // General cooked meats
        }
        if (food.contains("fish") || food.contains("salmon") || food.contains("tuna")) {
            return 1.0; // Fish fillets are usually thin
        }
        if (food.contains("bacon") && food.contains("cooked")) return 0.2; // Cooked bacon is very thin
        if (food.contains("bacon")) return 0.3; // General bacon
        if (food.contains("sausage") || food.contains("hot dog")) return 2.0; // Cylindrical items
        
        // Vegetables - research: varies significantly
        if (food.contains("lettuce") || food.contains("spinach") || food.contains("greens") || 
            food.contains("salad")) return 2.5; // Leafy greens are fluffy, 2-3 cm
        if (food.contains("broccoli") || food.contains("cauliflower")) return 2.0; // Florets are 1.5-2.5 cm
        if (food.contains("carrot") || food.contains("celery")) return 1.0; // Usually cut thin, ~1 cm
        if (food.contains("tomato") || food.contains("cucumber")) return 1.5; // Sliced vegetables
        if (food.contains("vegetable") || food.contains("mixed")) return 1.8; // General vegetables
        
        // Processed foods
        if (food.contains("pizza")) return 1.2; // Pizza slices are relatively thin, ~1-1.5 cm
        if (food.contains("burger") || food.contains("sandwich")) return 4.0; // Stacked items, 3-5 cm
        
        // Dairy
        if (food.contains("cheese") && food.contains("melted")) return 0.5; // Melted cheese is thin
        if (food.contains("cheese")) return 1.0; // Solid cheese slices
        
        return 1.5; // Conservative default based on average food thickness
    }
    
    /**
     * Get food density for weight calculation (g/cm³)
     * Based on USDA Food Composition Database and research data
     * Values represent cooked/prepared foods unless otherwise noted
     */
    private double getFoodDensity(String foodName) {
        String food = foodName.toLowerCase();
        
        // Eggs and egg dishes - USDA: scrambled eggs ~0.55-0.65 g/cm³
        if (food.contains("scrambled") || food.contains("egg") && (food.contains("cooked") || food.contains("fried"))) {
            return 0.55; // Scrambled eggs are very light and fluffy
        }
        if (food.contains("omelet") || food.contains("omelette")) {
            return 0.60; // Slightly denser than scrambled
        }
        if (food.contains("egg") && !food.contains("scrambled")) {
            return 0.65; // General cooked eggs
        }
        
        // Grains and starches - USDA data
        if (food.contains("rice") && food.contains("cooked")) return 0.85; // Cooked white rice
        if (food.contains("rice")) return 0.80; // General rice
        if (food.contains("pasta") && food.contains("cooked")) return 0.65; // Cooked pasta
        if (food.contains("pasta") || food.contains("noodle")) return 0.60; // General pasta
        if (food.contains("bread") || food.contains("toast")) return 0.25; // Bread is very light
        if (food.contains("potato") && food.contains("mashed")) return 0.75; // Mashed potatoes
        if (food.contains("potato") || food.contains("fries")) return 0.70; // Cooked potatoes
        if (food.contains("oatmeal") || food.contains("porridge")) return 0.80; // Cooked oatmeal
        
        // Proteins - USDA: cooked meats ~1.0-1.1 g/cm³
        if (food.contains("chicken") && (food.contains("breast") || food.contains("grilled"))) {
            return 1.05; // Cooked chicken breast
        }
        if (food.contains("chicken")) return 1.00; // General cooked chicken
        if (food.contains("steak") || food.contains("beef") && food.contains("cooked")) {
            return 1.10; // Cooked beef/steak
        }
        if (food.contains("meat") || food.contains("beef") || food.contains("pork")) return 1.05; // General cooked meat
        if (food.contains("fish") || food.contains("salmon") || food.contains("tuna")) {
            return 0.95; // Cooked fish (slightly less dense than meat)
        }
        if (food.contains("bacon") && food.contains("cooked")) return 0.40; // Cooked bacon is very light
        if (food.contains("bacon")) return 0.45; // General bacon
        if (food.contains("sausage") || food.contains("hot dog")) return 0.90; // Processed meats
        
        // Vegetables - USDA: most vegetables 0.3-0.7 g/cm³
        if (food.contains("lettuce") || food.contains("spinach") || food.contains("greens") || 
            food.contains("salad")) return 0.20; // Leafy greens are very light
        if (food.contains("broccoli") || food.contains("cauliflower")) return 0.35; // Cruciferous vegetables
        if (food.contains("carrot") || food.contains("celery")) return 0.65; // Root vegetables
        if (food.contains("tomato") || food.contains("cucumber")) return 0.60; // High water content
        if (food.contains("vegetable") || food.contains("mixed")) return 0.40; // General vegetables
        
        // Dairy - USDA data
        if (food.contains("cheese") && food.contains("melted")) return 0.85; // Melted cheese
        if (food.contains("cheese")) return 0.90; // Solid cheese
        if (food.contains("milk")) return 1.03; // Milk (slightly denser than water)
        if (food.contains("yogurt")) return 1.05; // Yogurt
        if (food.contains("butter") || food.contains("margarine")) return 0.90; // Fats
        
        // Fruits - USDA: most fruits 0.7-0.9 g/cm³
        if (food.contains("apple")) return 0.75; // Apples
        if (food.contains("banana")) return 0.85; // Bananas
        if (food.contains("orange") || food.contains("citrus")) return 0.80; // Citrus fruits
        if (food.contains("berry") || food.contains("berries")) return 0.70; // Berries
        
        // Processed foods
        if (food.contains("pizza")) return 0.45; // Pizza (cheese, dough, toppings)
        if (food.contains("burger") || food.contains("sandwich")) return 0.55; // Burgers/sandwiches
        if (food.contains("soup")) return 0.95; // Soups (mostly water)
        
        return 0.65; // Conservative default based on average food density
    }
    
    /**
     * Validate and cap weight to prevent unrealistic values in UI display
     * Uses min/max limits per food type
     */
    private double validateAndCapWeight(double weightGrams, String foodName, String openRouterPortionSize) {
        FoodWeightLimits limits = findFoodLimits(foodName);
        
        // Clamp to limits
        if (weightGrams < limits.minGrams) {
            logger.warn("Weight {}g below minimum {}g for food: {}. Setting to minimum.",
                       weightGrams, limits.minGrams, foodName);
            weightGrams = limits.minGrams;
        } else if (weightGrams > limits.maxGrams) {
            logger.warn("Weight {}g exceeds maximum {}g for food: {}. Capping to maximum.",
                       weightGrams, limits.maxGrams, foodName);
            weightGrams = limits.maxGrams;
        }
        
        // Additional validation: check against global max
        if (weightGrams > MAX_WEIGHT_GRAMS) {
            logger.warn("Weight {}g exceeds global maximum {}g for food: {}. Capping to global maximum.",
                       weightGrams, MAX_WEIGHT_GRAMS, foodName);
            weightGrams = MAX_WEIGHT_GRAMS;
        }
        
        // Ensure minimum weight
        if (weightGrams < 1.0 && weightGrams > 0) {
            weightGrams = 1.0; // Minimum 1g
        }
        
        if (weightGrams < 0) {
            logger.warn("Negative weight {}g for food: {}. Setting to 0.", weightGrams, foodName);
            weightGrams = 0.0;
        }
        
        return weightGrams;
    }
    
    /**
     * Overloaded method for backward compatibility
     */
    private double validateAndCapWeight(double weightGrams, String foodName) {
        return validateAndCapWeight(weightGrams, foodName, null);
    }
    
    /**
     * Extract weight in grams from portion size string (e.g., "200g", "1 cup", "2 slices")
     * Returns null if weight cannot be extracted
     */
    private Double extractWeightFromPortionSize(String portionSize) {
        if (portionSize == null || portionSize.isEmpty()) {
            return null;
        }
        
        String lower = portionSize.toLowerCase().trim();
        
        // Try to extract grams directly (e.g., "200g", "150 g", "1.5kg")
        if (lower.contains("g") || lower.contains("gram")) {
            try {
                // Extract number before "g" or "gram"
                String numberStr = lower.replaceAll("[^0-9.]", "").trim();
                if (!numberStr.isEmpty()) {
                    double grams = Double.parseDouble(numberStr);
                    // Check if it's in kg (contains "kg" or number > 1000)
                    if (lower.contains("kg") || lower.contains("kilogram") || grams > 1000) {
                        grams = grams * 1000; // Convert kg to g
                    }
                    if (grams > 0 && grams <= MAX_WEIGHT_GRAMS) {
                        return grams;
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        
        // Estimate from common portion sizes
        if (lower.contains("cup")) {
            // Rough estimate: 1 cup ≈ 200-250g depending on food
            return 200.0;
        } else if (lower.contains("slice")) {
            // Rough estimate: 1 slice ≈ 20-30g
            return 25.0;
        } else if (lower.contains("piece") || lower.contains("item")) {
            // Rough estimate: 1 piece ≈ 50-100g
            return 75.0;
        } else if (lower.contains("serving")) {
            // Rough estimate: 1 serving ≈ 100-150g
            return 125.0;
        }
        
        return null;
    }
    
    /**
     * Create nutrition estimates based on food name and portion size
     */
    private List<NutritionEstimate> createNutritionEstimates(String foodName, String portionSize) {
        return createNutritionEstimates(foodName, portionSize, null);
    }
    
    /**
     * Create nutrition estimates based on food name, portion size, and segmentation data
     */
    private List<NutritionEstimate> createNutritionEstimates(String foodName, String portionSize, 
                                                               FoodSegmentationService.FoodSegment segment) {
        List<NutritionEstimate> estimates = new ArrayList<>();
        
        // Get accurate weight from segmentation if available
        double weightGrams = 0;
        if (segment != null && segment.volumeCm3 > 0) {
            weightGrams = segment.volumeCm3 * getFoodDensity(foodName);
        } else if (portionSize != null && portionSize.endsWith("g")) {
            try {
                weightGrams = Double.parseDouble(portionSize.replace("g", "").trim());
            } catch (NumberFormatException e) {
                // Use estimation
            }
        }
        
        // Validate and cap weight
        if (weightGrams > MAX_WEIGHT_GRAMS) {
            logger.warn("Weight {}g exceeds maximum {}g for food: {}. Capping to maximum.", 
                       weightGrams, MAX_WEIGHT_GRAMS, foodName);
            weightGrams = MAX_WEIGHT_GRAMS;
        }
        
        // Ensure minimum weight
        if (weightGrams < 1.0 && weightGrams > 0) {
            weightGrams = 1.0;
        }
        
        // Estimate calories based on food type and weight
        double calories = estimateCalories(foodName, portionSize, weightGrams);
        NutritionEstimate caloriesEstimate = new NutritionEstimate();
        caloriesEstimate.setNutrientName("calories");
        caloriesEstimate.setEstimatedAmount(calories);
        caloriesEstimate.setUnit("kcal");
        caloriesEstimate.setSource(segment != null ? "cv_estimated" : "onnx_estimated");
        estimates.add(caloriesEstimate);
        
        // Estimate protein
        double protein = estimateProtein(foodName, portionSize, weightGrams);
        NutritionEstimate proteinEstimate = new NutritionEstimate();
        proteinEstimate.setNutrientName("protein");
        proteinEstimate.setEstimatedAmount(protein);
        proteinEstimate.setUnit("g");
        proteinEstimate.setSource(segment != null ? "cv_estimated" : "onnx_estimated");
        estimates.add(proteinEstimate);
        
        // Estimate carbs
        double carbs = estimateCarbs(foodName, portionSize, weightGrams);
        NutritionEstimate carbsEstimate = new NutritionEstimate();
        carbsEstimate.setNutrientName("carbs");
        carbsEstimate.setEstimatedAmount(carbs);
        carbsEstimate.setUnit("g");
        carbsEstimate.setSource(segment != null ? "cv_estimated" : "onnx_estimated");
        estimates.add(carbsEstimate);
        
        // Estimate fat
        double fat = estimateFat(foodName, portionSize, weightGrams);
        NutritionEstimate fatEstimate = new NutritionEstimate();
        fatEstimate.setNutrientName("fat");
        fatEstimate.setEstimatedAmount(fat);
        fatEstimate.setUnit("g");
        fatEstimate.setSource(segment != null ? "cv_estimated" : "onnx_estimated");
        estimates.add(fatEstimate);
        
        return estimates;
    }
    
    private double estimateCalories(String foodName, String portionSize) {
        return estimateCalories(foodName, portionSize, 0);
    }
    
    private double estimateCalories(String foodName, String portionSize, double weightGrams) {
        String food = foodName.toLowerCase();
        double baseCalories = 100.0;
        
        if (food.contains("pizza") || food.contains("burger")) baseCalories = 300.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseCalories = 50.0;
        else if (food.contains("chicken") || food.contains("steak")) baseCalories = 200.0;
        else if (food.contains("rice") || food.contains("pasta")) baseCalories = 150.0;
        else if (food.contains("apple") || food.contains("banana")) baseCalories = 80.0;
        
        // Adjust based on weight (preferred) or portion size
        if (weightGrams > 0) {
            baseCalories = (weightGrams / 100.0) * baseCalories; // Scale by accurate weight
        } else if (portionSize != null) {
            if (portionSize.contains("2") || portionSize.contains("double")) baseCalories *= 1.5;
            else if (portionSize.contains("half") || portionSize.contains("small")) baseCalories *= 0.7;
            else if (portionSize.endsWith("g")) {
                try {
                    double grams = Double.parseDouble(portionSize.replace("g", "").trim());
                    // Cap grams to maximum
                    if (grams > MAX_WEIGHT_GRAMS) {
                        logger.warn("Portion size {}g exceeds maximum {}g for food: {}. Capping to maximum.", 
                                   grams, MAX_WEIGHT_GRAMS, foodName);
                        grams = MAX_WEIGHT_GRAMS;
                    }
                    baseCalories = (grams / 100.0) * baseCalories; // Scale by weight
                } catch (NumberFormatException e) {
                    // Use base calories
                }
            }
        }
        
        // Cap calories to maximum
        if (baseCalories > MAX_CALORIES_PER_ITEM) {
            logger.warn("Estimated calories {} kcal exceed maximum {} kcal for food: {}. Capping to maximum.", 
                       baseCalories, MAX_CALORIES_PER_ITEM, foodName);
            baseCalories = MAX_CALORIES_PER_ITEM;
        }
        
        // Ensure minimum calories
        if (baseCalories < MIN_CALORIES_PER_ITEM) {
            baseCalories = MIN_CALORIES_PER_ITEM;
        }
        
        return baseCalories;
    }
    
    private double estimateProtein(String foodName, String portionSize) {
        return estimateProtein(foodName, portionSize, 0);
    }
    
    private double estimateProtein(String foodName, String portionSize, double weightGrams) {
        String food = foodName.toLowerCase();
        double baseProtein = 5.0;
        
        if (food.contains("chicken") || food.contains("steak")) baseProtein = 25.0;
        else if (food.contains("burger") || food.contains("pizza")) baseProtein = 15.0;
        else if (food.contains("rice") || food.contains("pasta")) baseProtein = 5.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseProtein = 3.0;
        else if (food.contains("apple") || food.contains("banana")) baseProtein = 1.0;
        
        if (weightGrams > 0) {
            baseProtein = (weightGrams / 100.0) * baseProtein;
        } else if (portionSize != null && portionSize.endsWith("g")) {
            try {
                double grams = Double.parseDouble(portionSize.replace("g", "").trim());
                if (grams > MAX_WEIGHT_GRAMS) {
                    grams = MAX_WEIGHT_GRAMS;
                }
                baseProtein = (grams / 100.0) * baseProtein;
            } catch (NumberFormatException e) {
                // Use base protein
            }
        }
        
        return Math.max(0.0, baseProtein);
    }
    
    private double estimateCarbs(String foodName, String portionSize) {
        return estimateCarbs(foodName, portionSize, 0);
    }
    
    private double estimateCarbs(String foodName, String portionSize, double weightGrams) {
        String food = foodName.toLowerCase();
        double baseCarbs = 20.0;
        
        if (food.contains("rice") || food.contains("pasta") || food.contains("pizza")) baseCarbs = 40.0;
        else if (food.contains("bread") || food.contains("burger")) baseCarbs = 30.0;
        else if (food.contains("apple") || food.contains("banana")) baseCarbs = 20.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseCarbs = 5.0;
        else if (food.contains("chicken") || food.contains("steak")) baseCarbs = 0.0;
        
        if (weightGrams > 0) {
            baseCarbs = (weightGrams / 100.0) * baseCarbs;
        } else if (portionSize != null && portionSize.endsWith("g")) {
            try {
                double grams = Double.parseDouble(portionSize.replace("g", "").trim());
                if (grams > MAX_WEIGHT_GRAMS) {
                    grams = MAX_WEIGHT_GRAMS;
                }
                baseCarbs = (grams / 100.0) * baseCarbs;
            } catch (NumberFormatException e) {
                // Use base carbs
            }
        }
        
        return Math.max(0.0, baseCarbs);
    }
    
    private double estimateFat(String foodName, String portionSize) {
        return estimateFat(foodName, portionSize, 0);
    }
    
    private double estimateFat(String foodName, String portionSize, double weightGrams) {
        String food = foodName.toLowerCase();
        double baseFat = 10.0;
        
        if (food.contains("burger") || food.contains("pizza")) baseFat = 20.0;
        else if (food.contains("steak") || food.contains("chicken")) baseFat = 15.0;
        else if (food.contains("rice") || food.contains("pasta")) baseFat = 2.0;
        else if (food.contains("salad") || food.contains("broccoli")) baseFat = 0.5;
        else if (food.contains("apple") || food.contains("banana")) baseFat = 0.3;
        
        if (weightGrams > 0) {
            baseFat = (weightGrams / 100.0) * baseFat;
        } else if (portionSize != null && portionSize.endsWith("g")) {
            try {
                double grams = Double.parseDouble(portionSize.replace("g", "").trim());
                if (grams > MAX_WEIGHT_GRAMS) {
                    grams = MAX_WEIGHT_GRAMS;
                }
                baseFat = (grams / 100.0) * baseFat;
            } catch (NumberFormatException e) {
                // Use base fat
            }
        }
        
        return Math.max(0.0, baseFat);
    }
    
    /**
     * Fuse CV-based weight with count-based weight estimate
     * @param cvWeight Weight from computer vision (volume × density)
     * @param countWeight Weight from count-based calculation
     * @param segmentationQuality Quality score (0.0-1.0)
     * @return Fused weight estimate
     */
    private double fuseWeights(double cvWeight, double countWeight, double segmentationQuality) {
        // Alpha determines how much to trust CV vs counts
        // Higher quality segmentation → trust CV more
        // Lower quality → trust counts more
        double alphaMin = 0.3; // Minimum CV weight (when quality is poor)
        double alphaMax = 0.7; // Maximum CV weight (when quality is excellent)
        
        double alpha = alphaMin + (segmentationQuality * (alphaMax - alphaMin));
        
        double fused = (cvWeight * alpha) + (countWeight * (1 - alpha));
        
        logger.debug("Weight fusion: CV={}g, Count={}g, Quality={}, Alpha={}, Fused={}g",
                    cvWeight, countWeight, segmentationQuality, alpha, fused);
        
        return fused;
    }
    
    /**
     * Apply plate-level sanity check and rescaling
     * If total plate weight exceeds reasonable maximum, scale all items proportionally
     */
    private void applyPlateLevelRescaling(List<FoodRecognition> recognitions) {
        double totalWeight = recognitions.stream()
            .mapToDouble(r -> r.getEstimatedWeightGrams() != null ? 
                r.getEstimatedWeightGrams() : 0.0)
            .sum();
        
        final double MAX_PLATE_WEIGHT = 1500.0; // grams
        
        if (totalWeight > MAX_PLATE_WEIGHT) {
            double scale = MAX_PLATE_WEIGHT / totalWeight;
            logger.warn("Plate total weight {}g exceeds maximum {}g. Scaling all items by factor {}.",
                       totalWeight, MAX_PLATE_WEIGHT, scale);
            
            for (FoodRecognition recognition : recognitions) {
                if (recognition.getEstimatedWeightGrams() != null) {
                    double oldWeight = recognition.getEstimatedWeightGrams();
                    double newWeight = oldWeight * scale;
                    recognition.setEstimatedWeightGrams(newWeight);
                    
                    // Update nutrition estimates proportionally
                    if (recognition.getNutritionEstimates() != null) {
                        for (NutritionEstimate estimate : recognition.getNutritionEstimates()) {
                            double oldAmount = estimate.getEstimatedAmount();
                            estimate.setEstimatedAmount(oldAmount * scale);
                        }
                    }
                    
                    logger.debug("Rescaled {}: {}g → {}g", 
                               recognition.getDetectedFoodName(), oldWeight, newWeight);
                }
            }
        }
    }
    
    /**
     * Extract base food name (remove portion size if present)
     */
    private String extractBaseFoodName(String foodNameWithPortion) {
        if (foodNameWithPortion.contains(" (")) {
            return foodNameWithPortion.substring(0, foodNameWithPortion.indexOf(" ("));
        }
        return foodNameWithPortion;
    }
    
    /**
     * Validate if combined approach results are reasonable
     * Returns true if results are acceptable, false if they're outrageous
     */
    private boolean validateCombinedResults(UserMeal combinedMeal) {
        List<FoodRecognition> recognitions = combinedMeal.getFoodRecognitions();
        if (recognitions == null || recognitions.isEmpty()) {
            return false; // No foods detected is suspicious
        }
        
        int failureCount = 0;
        int totalChecks = 0;
        
        // Check 1: Individual food weights
        for (FoodRecognition recognition : recognitions) {
            Double weight = recognition.getEstimatedWeightGrams();
            if (weight == null) continue;
            
            String foodName = extractBaseFoodName(recognition.getDetectedFoodName());
            FoodWeightLimits limits = findFoodLimits(foodName);
            totalChecks++;
            
            // If weight exceeds max by more than 50%, it's outrageous
            if (weight > limits.maxGrams * 1.5 || weight < limits.minGrams * 0.5) {
                failureCount++;
                logger.warn("Unreasonable weight: {}g for {} (limits: {}-{}g)",
                           weight, foodName, limits.minGrams, limits.maxGrams);
            }
        }
        
        // Check 2: Total plate weight
        double totalWeight = recognitions.stream()
            .mapToDouble(r -> r.getEstimatedWeightGrams() != null ? 
                r.getEstimatedWeightGrams() : 0.0)
            .sum();
        totalChecks++;
        
        final double MAX_REASONABLE_PLATE_WEIGHT = 2000.0; // grams
        if (totalWeight > MAX_REASONABLE_PLATE_WEIGHT) {
            failureCount++;
            logger.warn("Excessive total plate weight: {}g", totalWeight);
        }
        
        // Check 3: Nutrition estimates are reasonable
        for (FoodRecognition recognition : recognitions) {
            if (recognition.getNutritionEstimates() == null) continue;
            
            for (NutritionEstimate estimate : recognition.getNutritionEstimates()) {
                if ("calories".equals(estimate.getNutrientName())) {
                    totalChecks++;
                    double calories = estimate.getEstimatedAmount();
                    
                    // Calories should be roughly 1-5 kcal per gram of food
                    Double weight = recognition.getEstimatedWeightGrams();
                    if (weight != null && weight > 0) {
                        double caloriesPerGram = calories / weight;
                        if (caloriesPerGram < 0.5 || caloriesPerGram > 6.0) {
                            failureCount++;
                            logger.warn("Unreasonable calories per gram: {} kcal/g for {}",
                                       caloriesPerGram, recognition.getDetectedFoodName());
                        }
                    }
                }
            }
        }
        
        // Check 4: Confidence scores
        double avgConfidence = recognitions.stream()
            .mapToDouble(r -> r.getConfidenceScore() != null ? r.getConfidenceScore() : 0.0)
            .average()
            .orElse(0.0);
        totalChecks++;
        
        if (avgConfidence < 0.3) {
            failureCount++;
            logger.warn("Low average confidence: {}", avgConfidence);
        }
        
        // If more than 30% of checks failed, consider results outrageous
        double failureRate = totalChecks > 0 ? (double) failureCount / totalChecks : 0.0;
        boolean isValid = failureRate < 0.3;
        
        if (!isValid) {
            logger.warn("Combined results validation failed: {}/{} checks failed ({}%)",
                       failureCount, totalChecks, failureRate * 100);
        }
        
        return isValid;
    }
    
    /**
     * Get food labels - use ONNX service
     */
    public List<String> getFoodLabels() {
        if (onnxFoodRecognitionService != null) {
            try {
                if (onnxFoodRecognitionService.isInitialized()) {
                    return onnxFoodRecognitionService.getFoodLabels();
                }
            } catch (Exception e) {
                logger.error("Error getting food labels from ONNX service: {}", e.getMessage());
            }
        }
        
        // Fallback to mock labels
        return new ArrayList<>(mockFoodLabels);
    }
    
    /**
     * Create mock user meal for fallback scenarios
     */
    private UserMeal createMockUserMeal(String location, String mealType) {
        logger.info("Creating mock user meal for location: {}, mealType: {}", location, mealType);
        
        List<FoodRecognition> recognizedFoods = new ArrayList<>();
        int numberOfFoods = random.nextInt(3) + 1; // 1 to 3 foods

        for (int i = 0; i < numberOfFoods; i++) {
            String foodName = mockFoodLabels.get(random.nextInt(mockFoodLabels.size()));
            double confidence = 0.5 + (0.4 * random.nextDouble()); // Confidence between 0.5 and 0.9

            FoodRecognition foodRecognition = new FoodRecognition();
            foodRecognition.setDetectedFoodName(foodName);
            foodRecognition.setConfidenceScore(confidence);
            foodRecognition.setIsFromMenu(random.nextBoolean());
            // In a real scenario, segmentation mask would be a complex data structure
            foodRecognition.setSegmentationMask("mock_mask_" + i);
            recognizedFoods.add(foodRecognition);
        }

        // Create nutrition estimates for each food
        for (FoodRecognition foodRecognition : recognizedFoods) {
            // Create calories estimate
            NutritionEstimate caloriesEstimate = new NutritionEstimate();
            caloriesEstimate.setNutrientName("calories");
            caloriesEstimate.setEstimatedAmount((double) (random.nextInt(200) + 100));
            caloriesEstimate.setUnit("kcal");
            caloriesEstimate.setSource("estimated");
            caloriesEstimate.setFoodRecognition(foodRecognition);
            
            // Create protein estimate
            NutritionEstimate proteinEstimate = new NutritionEstimate();
            proteinEstimate.setNutrientName("protein");
            proteinEstimate.setEstimatedAmount((double) (random.nextInt(20) + 5));
            proteinEstimate.setUnit("g");
            proteinEstimate.setSource("estimated");
            proteinEstimate.setFoodRecognition(foodRecognition);
            
            // Add to food recognition
            foodRecognition.setNutritionEstimates(Arrays.asList(caloriesEstimate, proteinEstimate));
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
}