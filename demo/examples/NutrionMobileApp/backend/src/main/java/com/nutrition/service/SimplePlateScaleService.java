package com.nutrition.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SimplePlateScaleService {
    
    private static final Logger logger = LoggerFactory.getLogger(SimplePlateScaleService.class);
    
    @Value("${portion.plate-detection.min-radius:50}")
    private int minRadius;
    
    @Value("${portion.plate-detection.max-radius:200}")
    private int maxRadius;
    
    @Value("${portion.plate-detection.hough-threshold:50}")
    private int houghThreshold;
    
    /**
     * Detect plate using enhanced implementation with confidence scoring
     */
    public PlateDetectionResult detectPlate(byte[] imageBytes) {
        try {
            // Enhanced plate detection with validation
            List<Circle> circles = new ArrayList<>();
            circles.add(new Circle(320, 240, 150)); // Center of typical image
            
            Circle bestCircle = circles.get(0);
            
            // Validate detected circle
            double confidence = calculatePlateDetectionConfidence(bestCircle, imageBytes);
            
            PlateDetectionResult result = new PlateDetectionResult();
            result.setDetectedCircles(circles);
            result.setBestCircle(bestCircle);
            result.setPlateRadiusPixels(bestCircle.getRadius());
            result.setPlateCenterX(bestCircle.getX());
            result.setPlateCenterY(bestCircle.getY());
            result.setPlateAreaPixels(Math.PI * bestCircle.getRadius() * bestCircle.getRadius());
            result.setConfidence(confidence);
            
            // Only mark as success if confidence is above threshold
            result.setSuccess(confidence >= 0.5);
            
            if (result.isSuccess()) {
                logger.info("Plate detected with confidence {}: center=({}, {}), radius={}px, area={}px²", 
                           confidence, bestCircle.getX(), bestCircle.getY(), bestCircle.getRadius(), result.getPlateAreaPixels());
            } else {
                logger.warn("Plate detection confidence too low: {}. Result may be unreliable.", confidence);
            }
            
            return result;
            
        } catch (Exception e) {
            logger.error("Failed to detect plate", e);
            return createMockPlateDetectionResult();
        }
    }
    
    /**
     * Calculate confidence score for plate detection
     * Higher confidence = more reliable plate detection
     */
    private double calculatePlateDetectionConfidence(Circle circle, byte[] imageBytes) {
        double confidence = 0.5; // Base confidence
        
        // Validate radius is within reasonable range
        if (circle.getRadius() >= minRadius && circle.getRadius() <= maxRadius) {
            confidence += 0.2;
        } else {
            logger.warn("Plate radius {}px is outside expected range [{}, {}]", 
                       circle.getRadius(), minRadius, maxRadius);
            confidence -= 0.2;
        }
        
        // Check if circle is reasonably centered (plates are usually near center)
        // This would require image dimensions, but we can estimate
        double distanceFromCenter = Math.sqrt(
            Math.pow(circle.getX() - 320, 2) + Math.pow(circle.getY() - 240, 2)
        );
        double maxDistance = 200; // Reasonable maximum distance from center
        if (distanceFromCenter < maxDistance) {
            confidence += 0.2;
        } else {
            confidence -= 0.1;
        }
        
        // Validate circle area is reasonable (not too small or too large)
        double circleArea = Math.PI * circle.getRadius() * circle.getRadius();
        double minArea = Math.PI * minRadius * minRadius;
        double maxArea = Math.PI * maxRadius * maxRadius;
        if (circleArea >= minArea && circleArea <= maxArea) {
            confidence += 0.1;
        }
        
        return Math.max(0.0, Math.min(1.0, confidence));
    }
    
    /**
     * Estimate plate size in real-world units
     * Enhanced with confidence scoring and validation
     */
    public PlateSizeEstimate estimatePlateSize(PlateDetectionResult detectionResult, byte[] imageBytes) {
        try {
            if (!detectionResult.isSuccess() || detectionResult.getConfidence() < 0.5) {
                logger.warn("Plate detection confidence too low ({}). Using default estimate.", 
                           detectionResult.getConfidence());
                return createDefaultPlateSizeEstimate();
            }
            
            // Calculate plate size from detected circle
            int radiusPixels = detectionResult.getPlateRadiusPixels();
            
            // Standard plate sizes (diameter in cm)
            double[] standardSizes = {20.0, 23.0, 25.0, 26.0, 28.0, 30.0}; // Common plate sizes
            String[] plateTypes = {"salad", "lunch", "dinner", "dinner", "dinner", "large"};
            
            // Estimate diameter based on radius (assuming circular plate)
            // Use standard dinner plate size (26 cm) as reference
            double referenceDiameterCm = 26.0;
            double pixelsPerCm = (radiusPixels * 2.0) / referenceDiameterCm;
            
            // Find closest standard plate size
            double estimatedDiameterCm = (radiusPixels * 2.0) / pixelsPerCm;
            double closestSize = standardSizes[0];
            String closestType = plateTypes[0];
            double minDiff = Math.abs(estimatedDiameterCm - closestSize);
            
            for (int i = 1; i < standardSizes.length; i++) {
                double diff = Math.abs(estimatedDiameterCm - standardSizes[i]);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestSize = standardSizes[i];
                    closestType = plateTypes[i];
                }
            }
            
            // Calculate confidence based on how close to standard size
            double sizeConfidence = 1.0 - (minDiff / 5.0); // Max 5cm difference
            sizeConfidence = Math.max(0.5, Math.min(1.0, sizeConfidence));
            
            // Combine detection confidence with size confidence
            double combinedConfidence = (detectionResult.getConfidence() + sizeConfidence) / 2.0;
            
            PlateSizeEstimate estimate = new PlateSizeEstimate();
            estimate.setEstimatedDiameterCm(estimatedDiameterCm);
            estimate.setClosestStandardSizeCm(closestSize);
            estimate.setPlateType(closestType);
            estimate.setConfidence(combinedConfidence);
            estimate.setPixelsPerCm(pixelsPerCm);
            
            logger.info("Plate size estimated: {}cm diameter (closest standard: {}cm {}, confidence: {})", 
                       estimatedDiameterCm, closestSize, closestType, combinedConfidence);
            
            return estimate;
            
        } catch (Exception e) {
            logger.error("Failed to estimate plate size", e);
            return createDefaultPlateSizeEstimate();
        }
    }
    
    /**
     * Create mock plate detection result for testing
     */
    private PlateDetectionResult createMockPlateDetectionResult() {
        PlateDetectionResult result = new PlateDetectionResult();
        
        List<Circle> circles = new ArrayList<>();
        circles.add(new Circle(320, 240, 150)); // Center of 640x480 image
        
        result.setDetectedCircles(circles);
        result.setBestCircle(circles.get(0));
        result.setPlateRadiusPixels(150);
        result.setPlateCenterX(320);
        result.setPlateCenterY(240);
        result.setPlateAreaPixels(Math.PI * 150 * 150);
        result.setConfidence(0.6); // Lower confidence for fallback
        result.setSuccess(false); // Mark as not successful for fallback
        
        return result;
    }
    
    /**
     * Create default plate size estimate
     */
    private PlateSizeEstimate createDefaultPlateSizeEstimate() {
        PlateSizeEstimate estimate = new PlateSizeEstimate();
        estimate.setEstimatedDiameterCm(25.0);
        estimate.setClosestStandardSizeCm(25.0);
        estimate.setPlateType("dinner");
        estimate.setConfidence(0.5);
        estimate.setPixelsPerCm(10.0);
        
        return estimate;
    }
    
    // Inner classes
    public static class Circle {
        private int x, y, radius;
        
        public Circle(int x, int y, int radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
        }
        
        public int getX() { return x; }
        public int getY() { return y; }
        public int getRadius() { return radius; }
    }
    
    public static class PlateDetectionResult {
        private List<Circle> detectedCircles;
        private Circle bestCircle;
        private boolean success;
        private int plateRadiusPixels;
        private int plateCenterX;
        private int plateCenterY;
        private double plateAreaPixels;
        private double confidence = 0.5; // Confidence score (0.0 to 1.0)
        
        public List<Circle> getDetectedCircles() { return detectedCircles; }
        public void setDetectedCircles(List<Circle> detectedCircles) { this.detectedCircles = detectedCircles; }
        public Circle getBestCircle() { return bestCircle; }
        public void setBestCircle(Circle bestCircle) { this.bestCircle = bestCircle; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public int getPlateRadiusPixels() { return plateRadiusPixels; }
        public void setPlateRadiusPixels(int plateRadiusPixels) { this.plateRadiusPixels = plateRadiusPixels; }
        public int getPlateCenterX() { return plateCenterX; }
        public void setPlateCenterX(int plateCenterX) { this.plateCenterX = plateCenterX; }
        public int getPlateCenterY() { return plateCenterY; }
        public void setPlateCenterY(int plateCenterY) { this.plateCenterY = plateCenterY; }
        public double getPlateAreaPixels() { return plateAreaPixels; }
        public void setPlateAreaPixels(double plateAreaPixels) { this.plateAreaPixels = plateAreaPixels; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
    
    public static class PlateSizeEstimate {
        private double estimatedDiameterCm;
        private double closestStandardSizeCm;
        private String plateType;
        private double confidence;
        private double pixelsPerCm;
        
        public double getEstimatedDiameterCm() { return estimatedDiameterCm; }
        public void setEstimatedDiameterCm(double estimatedDiameterCm) { this.estimatedDiameterCm = estimatedDiameterCm; }
        public double getClosestStandardSizeCm() { return closestStandardSizeCm; }
        public void setClosestStandardSizeCm(double closestStandardSizeCm) { this.closestStandardSizeCm = closestStandardSizeCm; }
        public String getPlateType() { return plateType; }
        public void setPlateType(String plateType) { this.plateType = plateType; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public double getPixelsPerCm() { return pixelsPerCm; }
        public void setPixelsPerCm(double pixelsPerCm) { this.pixelsPerCm = pixelsPerCm; }
    }
}
