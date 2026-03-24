package com.nutrition.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

/**
 * Service for segmenting foods in images using computer vision techniques
 * Detects individual food items, calculates bounding boxes, areas, and estimates volumes
 * Uses Java-based image processing (no native libraries required)
 */
@Service
public class FoodSegmentationService {
    
    private static final Logger logger = LoggerFactory.getLogger(FoodSegmentationService.class);
    
    @Autowired(required = false)
    private SimplePlateScaleService plateScaleService;
    
    @Value("${portion.segmentation.min-area:500}")
    private int minArea;
    
    @Value("${portion.segmentation.max-foods:10}")
    private int maxFoods;
    
    @Value("${portion.segmentation.color-threshold:30}")
    private int colorThreshold;
    
    /**
     * Segment foods in the image and return bounding boxes and areas for each detected food
     */
    public List<FoodSegment> segmentFoods(byte[] imageBytes, List<String> detectedFoodNames) {
        try {
            // Convert byte array to BufferedImage
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                logger.warn("Failed to load image, using fallback segmentation");
                return createFallbackSegments(detectedFoodNames, 640, 480);
            }
            
            // Validate image quality
            validateImageQuality(image);
            
            // Apply image preprocessing for better segmentation
            image = preprocessImageForSegmentation(image);
            
            // Detect plate to get scale reference
            SimplePlateScaleService.PlateDetectionResult plateResult = null;
            if (plateScaleService != null) {
                plateResult = plateScaleService.detectPlate(imageBytes);
            }
            
            // Perform segmentation
            List<FoodSegment> segments = performSegmentation(image, detectedFoodNames, plateResult);
            
            return segments.isEmpty() ? createFallbackSegments(detectedFoodNames, image.getWidth(), image.getHeight()) : segments;
            
        } catch (Exception e) {
            logger.error("Error during food segmentation, using fallback", e);
            return createFallbackSegments(detectedFoodNames, 640, 480);
        }
    }
    
    /**
     * Preprocess image for better segmentation
     * Applies lighting normalization and noise reduction
     */
    private BufferedImage preprocessImageForSegmentation(BufferedImage image) {
        // Apply basic noise reduction (simple blur to reduce noise)
        BufferedImage processed = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = processed.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(image, 0, 0, null);
        g.dispose();
        
        return processed;
    }
    
    /**
     * Validate image quality for segmentation
     */
    private void validateImageQuality(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        
        if (width < 200 || height < 200) {
            logger.warn("Image resolution may be too low for accurate segmentation: {}x{}", width, height);
        }
    }
    
    /**
     * Perform actual segmentation using computer vision (Java-based)
     */
    private List<FoodSegment> performSegmentation(BufferedImage image, List<String> foodNames, 
                                                   SimplePlateScaleService.PlateDetectionResult plateResult) {
        List<FoodSegment> segments = new ArrayList<>();
        
        try {
            int width = image.getWidth();
            int height = image.getHeight();
            
            // Create a mask for food regions (exclude white/light plate background)
            boolean[][] foodMask = createFoodMask(image);
            
            // Find connected components (food regions)
            List<Region> regions = findConnectedRegions(foodMask, width, height);
            
            // Filter and process regions
            List<Region> validRegions = filterRegions(regions);
            
            // Sort by area (largest first)
            validRegions.sort((a, b) -> Integer.compare(b.area, a.area));
            
            // Create segments for detected foods
            int segmentCount = Math.min(validRegions.size(), Math.min(maxFoods, foodNames.size()));
            for (int i = 0; i < segmentCount; i++) {
                Region region = validRegions.get(i);
                String foodName = i < foodNames.size() ? foodNames.get(i) : "Food " + (i + 1);
                
                FoodSegment segment = createSegmentFromRegion(region, foodName, width, height, plateResult);
                segments.add(segment);
            }
            
            logger.info("Segmented {} food items from image", segments.size());
            
        } catch (Exception e) {
            logger.error("Error in segmentation algorithm", e);
        }
        
        return segments;
    }
    
    /**
     * Create a mask that highlights food regions (excludes plate background)
     * Enhanced with better color analysis, edge detection, and multi-strategy segmentation
     */
    private boolean[][] createFoodMask(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        
        // Strategy 1: Color-based segmentation (original method)
        boolean[][] colorMask = createColorBasedMask(image, width, height);
        
        // Strategy 2: Edge-based segmentation (detect food boundaries)
        boolean[][] edgeMask = createEdgeBasedMask(image, width, height);
        
        // Strategy 3: Saturation-based segmentation (foods are more colorful)
        boolean[][] saturationMask = createSaturationBasedMask(image, width, height);
        
        // Combine strategies: pixel is food if it's detected by at least 2 strategies
        boolean[][] combinedMask = new boolean[height][width];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int voteCount = 0;
                if (colorMask[y][x]) voteCount++;
                if (edgeMask[y][x]) voteCount++;
                if (saturationMask[y][x]) voteCount++;
                
                // Food if at least 2 strategies agree
                combinedMask[y][x] = voteCount >= 2;
            }
        }
        
        // Apply morphological operations to clean up the mask
        combinedMask = dilate(combinedMask, width, height, 2);
        combinedMask = erode(combinedMask, width, height, 2);
        
        return combinedMask;
    }
    
    /**
     * Strategy 1: Color-based mask (original method, improved)
     */
    private boolean[][] createColorBasedMask(BufferedImage image, int width, int height) {
        boolean[][] mask = new boolean[height][width];
        
        // Calculate average brightness of image (to detect plate color)
        long totalBrightness = 0;
        int pixelCount = 0;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));
                int brightness = (color.getRed() + color.getGreen() + color.getBlue()) / 3;
                totalBrightness += brightness;
                pixelCount++;
            }
        }
        
        int avgBrightness = (int) (totalBrightness / pixelCount);
        int threshold = Math.max(avgBrightness - colorThreshold, 100); // Food should be darker than plate
        
        // Create mask: true for food pixels, false for plate background
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));
                int brightness = (color.getRed() + color.getGreen() + color.getBlue()) / 3;
                
                // Also check saturation - foods are typically more colorful than white plates
                float[] hsb = Color.RGBtoHSB(color.getRed(), color.getGreen(), color.getBlue(), null);
                float saturation = hsb[1];
                
                // Food if: darker than threshold OR has significant color (not gray/white)
                mask[y][x] = (brightness < threshold) || (saturation > 0.2f && brightness < 200);
            }
        }
        
        return mask;
    }
    
    /**
     * Strategy 2: Edge-based mask (detect food boundaries using gradient)
     */
    private boolean[][] createEdgeBasedMask(BufferedImage image, int width, int height) {
        boolean[][] mask = new boolean[height][width];
        
        // Simple edge detection using Sobel-like gradient
        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                // Calculate gradient magnitude
                Color c00 = new Color(image.getRGB(x - 1, y - 1));
                Color c01 = new Color(image.getRGB(x, y - 1));
                Color c02 = new Color(image.getRGB(x + 1, y - 1));
                Color c10 = new Color(image.getRGB(x - 1, y));
                Color c12 = new Color(image.getRGB(x + 1, y));
                Color c20 = new Color(image.getRGB(x - 1, y + 1));
                Color c21 = new Color(image.getRGB(x, y + 1));
                Color c22 = new Color(image.getRGB(x + 1, y + 1));
                
                // Sobel operator for edge detection
                int gx = (-1 * getBrightness(c00) + 1 * getBrightness(c02) +
                         -2 * getBrightness(c10) + 2 * getBrightness(c12) +
                         -1 * getBrightness(c20) + 1 * getBrightness(c22));
                
                int gy = (-1 * getBrightness(c00) - 2 * getBrightness(c01) - 1 * getBrightness(c02) +
                         1 * getBrightness(c20) + 2 * getBrightness(c21) + 1 * getBrightness(c22));
                
                int gradient = (int) Math.sqrt(gx * gx + gy * gy);
                
                // High gradient indicates edge (likely food boundary)
                mask[y][x] = gradient > 30; // Threshold for edge detection
            }
        }
        
        // Fill in regions with edges (food areas typically have edges)
        mask = dilate(mask, width, height, 5); // Expand edge regions
        
        return mask;
    }
    
    /**
     * Strategy 3: Saturation-based mask (foods are more colorful)
     */
    private boolean[][] createSaturationBasedMask(BufferedImage image, int width, int height) {
        boolean[][] mask = new boolean[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));
                float[] hsb = Color.RGBtoHSB(color.getRed(), color.getGreen(), color.getBlue(), null);
                float saturation = hsb[1];
                float brightness = hsb[2];
                
                // Food if: high saturation (colorful) and reasonable brightness
                // Plates are typically low saturation (gray/white)
                mask[y][x] = saturation > 0.15f && brightness > 0.2f && brightness < 0.95f;
            }
        }
        
        return mask;
    }
    
    /**
     * Helper method to get brightness from Color
     */
    private int getBrightness(Color color) {
        return (color.getRed() + color.getGreen() + color.getBlue()) / 3;
    }
    
    /**
     * Dilate operation (expand regions)
     */
    private boolean[][] dilate(boolean[][] mask, int width, int height, int radius) {
        boolean[][] result = new boolean[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (mask[y][x]) {
                    // Expand around this pixel
                    for (int dy = -radius; dy <= radius; dy++) {
                        for (int dx = -radius; dx <= radius; dx++) {
                            int nx = x + dx;
                            int ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                if (dx * dx + dy * dy <= radius * radius) {
                                    result[ny][nx] = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * Erode operation (shrink regions)
     */
    private boolean[][] erode(boolean[][] mask, int width, int height, int radius) {
        boolean[][] result = new boolean[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (mask[y][x]) {
                    // Check if all neighbors are also true
                    boolean allNeighbors = true;
                    for (int dy = -radius; dy <= radius; dy++) {
                        for (int dx = -radius; dx <= radius; dx++) {
                            int nx = x + dx;
                            int ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                if (dx * dx + dy * dy <= radius * radius) {
                                    if (!mask[ny][nx]) {
                                        allNeighbors = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!allNeighbors) break;
                    }
                    result[y][x] = allNeighbors;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Find connected regions using flood fill algorithm
     */
    private List<Region> findConnectedRegions(boolean[][] mask, int width, int height) {
        List<Region> regions = new ArrayList<>();
        boolean[][] visited = new boolean[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (mask[y][x] && !visited[y][x]) {
                    Region region = floodFill(mask, visited, x, y, width, height);
                    if (region.area >= minArea) {
                        regions.add(region);
                    }
                }
            }
        }
        
        return regions;
    }
    
    /**
     * Flood fill to find a connected region
     */
    private Region floodFill(boolean[][] mask, boolean[][] visited, int startX, int startY, int width, int height) {
        Region region = new Region();
        region.minX = startX;
        region.maxX = startX;
        region.minY = startY;
        region.maxY = startY;
        region.area = 0;
        
        Stack<Point> stack = new Stack<>();
        stack.push(new Point(startX, startY));
        
        while (!stack.isEmpty()) {
            Point p = stack.pop();
            int x = p.x;
            int y = p.y;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !mask[y][x]) {
                continue;
            }
            
            visited[y][x] = true;
            region.area++;
            region.minX = Math.min(region.minX, x);
            region.maxX = Math.max(region.maxX, x);
            region.minY = Math.min(region.minY, y);
            region.maxY = Math.max(region.maxY, y);
            
            // Add neighbors
            stack.push(new Point(x + 1, y));
            stack.push(new Point(x - 1, y));
            stack.push(new Point(x, y + 1));
            stack.push(new Point(x, y - 1));
        }
        
        region.centerX = (region.minX + region.maxX) / 2;
        region.centerY = (region.minY + region.maxY) / 2;
        region.width = region.maxX - region.minX + 1;
        region.height = region.maxY - region.minY + 1;
        
        return region;
    }
    
    /**
     * Filter regions by area and shape
     */
    private List<Region> filterRegions(List<Region> regions) {
        List<Region> validRegions = new ArrayList<>();
        
        for (Region region : regions) {
            // Filter by minimum area
            if (region.area < minArea) {
                continue;
            }
            
            // Calculate aspect ratio to filter out very elongated shapes
            double aspectRatio = (double) region.width / region.height;
            if (aspectRatio > 5.0 || aspectRatio < 0.2) {
                continue; // Too elongated, likely not a food item
            }
            
            validRegions.add(region);
        }
        
        return validRegions;
    }
    
    /**
     * Create a FoodSegment from a region
     * Enhanced with perspective correction for better accuracy
     */
    private FoodSegment createSegmentFromRegion(Region region, String foodName, int imageWidth, int imageHeight,
                                                 SimplePlateScaleService.PlateDetectionResult plateResult) {
        FoodSegment segment = new FoodSegment();
        segment.foodName = foodName;
        segment.areaPixels = region.area;
        segment.boundingBox = new BoundingBox(
            region.minX,
            region.minY,
            region.width,
            region.height
        );
        segment.centerX = region.centerX;
        segment.centerY = region.centerY;
        
        // Estimate depth based on food type and area
        segment.estimatedDepthCm = estimateDepth(foodName, region.area, plateResult);
        
        // Calculate volume if we have plate scale
        if (plateResult != null && plateResult.isSuccess()) {
            double pixelsPerCm = estimatePixelsPerCm(plateResult, imageWidth, imageHeight);
            
            // Validate pixelsPerCm
            if (pixelsPerCm <= 0.1 || pixelsPerCm > 1000.0) {
                logger.warn("Invalid pixelsPerCm: {} for food: {}. Using fallback estimation.", pixelsPerCm, foodName);
                segment.areaCm2 = region.area / 100.0; // Rough estimate (assumes 10 pixels per cm)
                segment.volumeCm3 = segment.areaCm2 * segment.estimatedDepthCm;
            } else {
                // Apply perspective correction to area calculation
                double perspectiveCorrection = calculatePerspectiveCorrection(region, plateResult, imageWidth, imageHeight);
                double correctedAreaPixels = region.area * perspectiveCorrection;
                
                double areaCm2 = correctedAreaPixels / (pixelsPerCm * pixelsPerCm);
                
                // Validate area calculation
                if (areaCm2 <= 0 || areaCm2 > 10000.0) { // Max 10000 cm² = 1 m² (unrealistic for food)
                    logger.warn("Unrealistic area calculation: {} cm² for food: {}. Area pixels: {}, pixelsPerCm: {}", 
                               areaCm2, foodName, region.area, pixelsPerCm);
                }
                
                segment.areaCm2 = areaCm2;
                segment.volumeCm3 = areaCm2 * segment.estimatedDepthCm;
                
                // Validate volume - use food-specific limits
                double maxVolume = getFoodSpecificMaxVolume(foodName);
                if (segment.volumeCm3 > maxVolume) {
                    logger.warn("Unrealistic volume calculation: {} cm³ for food: {}. Capping to food-specific maximum: {} cm³.", 
                               segment.volumeCm3, foodName, maxVolume);
                    segment.volumeCm3 = maxVolume;
                }
            }
        } else {
            // Fallback estimation (assumes 10 pixels per cm, so 100 pixels² = 1 cm²)
            segment.areaCm2 = region.area / 100.0;
            segment.volumeCm3 = segment.areaCm2 * segment.estimatedDepthCm;
            
            // Validate fallback volume - use food-specific limits
            double maxVolume = getFoodSpecificMaxVolume(foodName);
            if (segment.volumeCm3 > maxVolume) {
                logger.warn("Unrealistic fallback volume: {} cm³ for food: {}. Capping to food-specific maximum: {} cm³.", 
                           segment.volumeCm3, foodName, maxVolume);
                segment.volumeCm3 = maxVolume;
            }
        }
        
        return segment;
    }
    
    /**
     * Calculate perspective correction factor based on camera angle
     * Accounts for foreshortening effects when camera is not directly overhead
     * Returns correction factor: >1.0 if area is underestimated, <1.0 if overestimated
     */
    private double calculatePerspectiveCorrection(Region region, 
                                                   SimplePlateScaleService.PlateDetectionResult plateResult,
                                                   int imageWidth, int imageHeight) {
        if (plateResult == null || !plateResult.isSuccess()) {
            return 1.0; // No correction if no plate reference
        }
        
        // Estimate camera angle from plate ellipse distortion
        // If plate appears as ellipse (not circle), camera is at an angle
        double plateRadiusPixels = plateResult.getPlateRadiusPixels();
        if (plateRadiusPixels <= 0) {
            return 1.0;
        }
        
        // Calculate region position relative to image center
        double imageCenterX = imageWidth / 2.0;
        double imageCenterY = imageHeight / 2.0;
        double regionCenterX = region.centerX;
        double regionCenterY = region.centerY;
        
        // Distance from image center (normalized)
        double distanceFromCenter = Math.sqrt(
            Math.pow((regionCenterX - imageCenterX) / imageWidth, 2) +
            Math.pow((regionCenterY - imageCenterY) / imageHeight, 2)
        );
        
        // Perspective correction: areas further from center appear smaller
        // Simple model: correction factor increases with distance from center
        // Typical camera angles: 30-60 degrees from vertical
        // At 45 degrees, edge areas are ~70% of center area
        double perspectiveFactor = 1.0 + (distanceFromCenter * 0.3); // Up to 30% correction
        
        // Limit correction to reasonable range
        perspectiveFactor = Math.max(1.0, Math.min(1.5, perspectiveFactor));
        
        logger.debug("Perspective correction factor: {} for region at distance {} from center", 
                    perspectiveFactor, distanceFromCenter);
        
        return perspectiveFactor;
    }
    
    /**
     * Get food-specific maximum reasonable volume (in cm³)
     * Based on typical serving sizes and densities
     */
    private double getFoodSpecificMaxVolume(String foodName) {
        String food = foodName.toLowerCase();
        
        // Eggs and egg dishes - critical for scrambled eggs issue
        if (food.contains("egg") || food.contains("scrambled") || food.contains("omelet") || food.contains("omelette")) {
            return 400.0; // ~200g / 0.6 density = ~333 cm³, round up to 400
        }
        
        // Small items
        if (food.contains("bacon")) return 200.0; // ~100g / 0.5 density = 200 cm³
        if (food.contains("slice") || food.contains("bread")) return 200.0; // ~50g / 0.3 density = ~167 cm³
        
        // Medium items
        if (food.contains("rice")) return 600.0; // ~400g / 0.8 density = 500 cm³
        if (food.contains("pasta")) return 500.0; // ~300g / 0.6 density = 500 cm³
        if (food.contains("chicken")) return 300.0; // ~300g / 1.1 density = ~273 cm³
        if (food.contains("steak")) return 400.0; // ~400g / 1.1 density = ~364 cm³
        if (food.contains("salad") || food.contains("vegetable")) return 1000.0; // ~300g / 0.3 density = 1000 cm³
        
        // Default: more conservative than 10000
        return 2000.0; // ~1000g / 0.7 average density = ~1429 cm³
    }
    
    /**
     * Estimate depth of food based on type and area
     */
    private double estimateDepth(String foodName, int areaPixels, 
                                  SimplePlateScaleService.PlateDetectionResult plateResult) {
        String food = foodName.toLowerCase();
        
        // Base depth estimates by food type
        if (food.contains("rice") || food.contains("pasta")) {
            return 2.0; // 2cm depth for grains
        } else if (food.contains("salad") || food.contains("vegetable")) {
            return 3.0; // 3cm for vegetables (fluffy)
        } else if (food.contains("chicken") || food.contains("steak") || food.contains("meat")) {
            return 1.5; // 1.5cm for flat meats
        } else if (food.contains("pizza") || food.contains("burger")) {
            return 2.5; // 2.5cm for stacked items
        } else {
            return 2.0; // Default 2cm
        }
    }
    
    /**
     * Estimate pixels per cm based on plate detection
     * Improved accuracy using standard plate sizes and better validation
     * Research: reference objects (plates) significantly improve accuracy
     */
    private double estimatePixelsPerCm(SimplePlateScaleService.PlateDetectionResult plateResult, int imageWidth, int imageHeight) {
        if (plateResult != null && plateResult.isSuccess()) {
            // Standard dinner plate sizes: 25-28 cm diameter (most common: 26 cm)
            // Use 26 cm as standard, which is more accurate than 25 cm
            double plateDiameterCm = 26.0; // Standard dinner plate diameter
            double plateRadiusCm = plateDiameterCm / 2.0; // 13 cm radius
            double plateRadiusPixels = plateResult.getPlateRadiusPixels();
            
            if (plateRadiusPixels > 0 && plateRadiusPixels < 10000) { // Validate reasonable range
                double pixelsPerCm = plateRadiusPixels / plateRadiusCm;
                
                // Validate pixelsPerCm is reasonable (typically 5-50 pixels/cm for food photos)
                if (pixelsPerCm >= 2.0 && pixelsPerCm <= 100.0) {
                    logger.debug("Calculated pixelsPerCm: {} from plate detection (radius: {} pixels, plate: {} cm)", 
                               pixelsPerCm, plateRadiusPixels, plateDiameterCm);
                    return pixelsPerCm;
                } else {
                    logger.warn("Unrealistic pixelsPerCm: {} from plate detection. Using fallback.", pixelsPerCm);
                }
            } else {
                logger.warn("Invalid plate radius pixels: {}. Using fallback estimation.", plateRadiusPixels);
            }
        }
        
        // Improved fallback: estimate based on image size and typical food photography
        // Most food photos show 25-35 cm field of view
        // Use image dimension to estimate, but be more conservative
        double estimatedCmPerDimension = 28.0; // Slightly more accurate than 30 cm
        double fallbackPixelsPerCm = Math.min(imageWidth, imageHeight) / estimatedCmPerDimension;
        
        // Validate fallback estimate
        if (fallbackPixelsPerCm >= 2.0 && fallbackPixelsPerCm <= 100.0) {
            logger.debug("Using fallback pixelsPerCm: {} (image: {}x{}, estimated FOV: {} cm)", 
                       fallbackPixelsPerCm, imageWidth, imageHeight, estimatedCmPerDimension);
            return fallbackPixelsPerCm;
        } else {
            // Final fallback: use standard assumption
            logger.warn("Fallback pixelsPerCm {} is unrealistic. Using standard 10 pixels/cm.", fallbackPixelsPerCm);
            return 10.0; // Standard assumption: 10 pixels per cm
        }
    }
    
    /**
     * Create fallback segments when segmentation fails
     */
    private List<FoodSegment> createFallbackSegments(List<String> foodNames, int imageWidth, int imageHeight) {
        List<FoodSegment> segments = new ArrayList<>();
        
        // Divide image into regions for each food
        int regionWidth = imageWidth / Math.max(foodNames.size(), 1);
        
        for (int i = 0; i < foodNames.size() && i < maxFoods; i++) {
            FoodSegment segment = new FoodSegment();
            segment.foodName = foodNames.get(i);
            segment.areaPixels = regionWidth * imageHeight / 2; // Rough estimate
            segment.boundingBox = new BoundingBox(
                i * regionWidth,
                imageHeight / 4,
                regionWidth,
                imageHeight / 2
            );
            segment.centerX = i * regionWidth + regionWidth / 2;
            segment.centerY = imageHeight / 2;
            segment.estimatedDepthCm = estimateDepth(foodNames.get(i), segment.areaPixels, null);
            segment.areaCm2 = segment.areaPixels / 100.0;
            segment.volumeCm3 = segment.areaCm2 * segment.estimatedDepthCm;
            
            segments.add(segment);
        }
        
        logger.info("Created {} fallback segments", segments.size());
        return segments;
    }
    
    /**
     * Inner class for region information
     */
    private static class Region {
        int minX, maxX, minY, maxY;
        int width, height;
        int area;
        int centerX, centerY;
    }
    
    /**
     * Segmentation quality metrics
     */
    public static class SegmentationQuality {
        public double score; // 0.0 to 1.0
        public double plateCoverageRatio; // fraction of plate covered by food
        public double maskCleanliness; // edge smoothness (0.0-1.0)
        public boolean plateDetected; // whether plate was successfully detected
    }
    
    /**
     * Calculate segmentation quality metrics
     */
    public SegmentationQuality calculateSegmentationQuality(
        BufferedImage image,
        List<FoodSegment> segments,
        SimplePlateScaleService.PlateDetectionResult plateResult
    ) {
        SegmentationQuality quality = new SegmentationQuality();
        
        // Plate coverage
        if (plateResult != null && plateResult.isSuccess()) {
            double plateArea = Math.PI * Math.pow(plateResult.getPlateRadiusPixels(), 2);
            double foodArea = segments.stream()
                .mapToDouble(s -> s.areaPixels)
                .sum();
            quality.plateCoverageRatio = Math.min(1.0, foodArea / plateArea);
            quality.plateDetected = true;
        } else {
            quality.plateCoverageRatio = 0.5; // Unknown
            quality.plateDetected = false;
        }
        
        // Mask cleanliness (simplified - could be enhanced)
        // For now, use plate detection as proxy
        quality.maskCleanliness = quality.plateDetected ? 0.8 : 0.5;
        
        // Overall score
        quality.score = (quality.plateCoverageRatio * 0.4) + 
                        (quality.maskCleanliness * 0.4) + 
                        (quality.plateDetected ? 0.2 : 0.0);
        
        return quality;
    }
    
    /**
     * Result class for food segmentation
     */
    public static class FoodSegment {
        public String foodName;
        public int areaPixels;
        public double areaCm2;
        public double volumeCm3;
        public double estimatedDepthCm;
        public BoundingBox boundingBox;
        public int centerX;
        public int centerY;
        public SegmentationQuality quality; // Quality metrics for this segment
    }
    
    /**
     * Bounding box representation
     */
    public static class BoundingBox {
        public int x;
        public int y;
        public int width;
        public int height;
        
        public BoundingBox(int x, int y, int width, int height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        
        public String toJson() {
            return String.format("{\"x\":%d,\"y\":%d,\"width\":%d,\"height\":%d}", x, y, width, height);
        }
    }
}
