package com.nutrition.controller;

import com.nutrition.service.SimpleMlInferenceService;
import com.nutrition.service.SimplePlateScaleService;
import com.nutrition.service.SimpleQuantifyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/portion")
public class PortionAnalysisController {
    
    private static final Logger logger = LoggerFactory.getLogger(PortionAnalysisController.class);
    
    @Autowired
    private SimpleMlInferenceService mlInferenceService;
    
    @Autowired
    private SimplePlateScaleService plateScaleService;
    
    @Autowired
    private SimpleQuantifyService quantifyService;
    
    /**
     * Analyze food portion from image
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> analyzePortion(
            @RequestParam("image") MultipartFile image,
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) String hints) {
        
        try {
            // Parse hints from comma-separated string
            List<String> hintsList = null;
            if (hints != null && !hints.trim().isEmpty()) {
                hintsList = new ArrayList<>();
                String[] hintArray = hints.split(",");
                for (String hint : hintArray) {
                    String trimmed = hint.trim();
                    if (!trimmed.isEmpty()) {
                        hintsList.add(trimmed);
                    }
                }
                if (hintsList.isEmpty()) {
                    hintsList = null;
                }
            }
            
            logger.info("Analyzing portion for location: {}, date: {}, mealType: {}, hints: {}, imageSize: {} bytes", 
                       location, date, mealType, hintsList, image.getSize());
            
            // Convert image to byte array
            byte[] imageBytes = image.getBytes();
            
            // Run ML analysis using simplified service with hints
            var userMeal = mlInferenceService.analyzePlate(imageBytes, location, mealType, hintsList);
            
            // Detect plate using simplified service
            var plateResult = plateScaleService.detectPlate(imageBytes);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Portion analysis completed successfully");
            response.put("location", location);
            response.put("date", date);
            response.put("mealType", mealType);
            response.put("analysisResult", userMeal);
            response.put("plateDetection", plateResult);
            
            logger.info("Portion analysis completed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to analyze portion", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to analyze portion: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get food labels for classification
     */
    @GetMapping("/labels")
    public ResponseEntity<Map<String, Object>> getFoodLabels() {
        try {
            logger.info("Getting food labels");
            
            // Get labels from the ML inference service (which will try model service first)
            List<String> labels = mlInferenceService.getFoodLabels();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("labels", labels);
            response.put("labelCount", labels.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get food labels", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get food labels: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get portion analysis history
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getPortionHistory(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        try {
            logger.info("Getting portion analysis history for location: {}, startDate: {}, endDate: {}", 
                       location, startDate, endDate);
            
            // Return mock history data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("location", location);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("analyses", Arrays.asList(
                Map.of("date", "2024-01-15T12:00:00", "location", "graceland", "mealType", "lunch", 
                      "foods", Arrays.asList("chicken", "rice", "broccoli")),
                Map.of("date", "2024-01-14T18:00:00", "location", "graceland", "mealType", "dinner", 
                      "foods", Arrays.asList("pasta", "salad"))
            ));
            response.put("analysisCount", 2);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get portion analysis history", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get portion analysis history: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}