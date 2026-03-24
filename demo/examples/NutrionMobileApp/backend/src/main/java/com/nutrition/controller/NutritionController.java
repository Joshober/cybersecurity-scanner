package com.nutrition.controller;

import com.nutrition.dto.ChatbotPlanRequest;
import com.nutrition.dto.NutritionCalculationRequest;
import com.nutrition.dto.NutritionCalculationResponse;
import com.nutrition.dto.NutritionEntryRequest;
import com.nutrition.model.NutritionEntry;
import com.nutrition.model.NutritionPlan;
import com.nutrition.model.User;
import com.nutrition.service.NutritionEntryService;
import com.nutrition.service.NutritionService;
import com.nutrition.service.OpenRouterService;
import com.nutrition.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionController {
    
    private static final Logger logger = LoggerFactory.getLogger(NutritionController.class);
    
    @Autowired
    private NutritionService nutritionService;
    
    @Autowired
    private NutritionEntryService nutritionEntryService;
    
    @Autowired
    private UserService userService;
    
    @Autowired(required = false)
    private OpenRouterService openRouterService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateNutrition(@RequestBody NutritionCalculationRequest request) {
        try {
            NutritionCalculationResponse response = nutritionService.calculateNutrition(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to calculate nutrition: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/plans")
    public ResponseEntity<List<NutritionPlan>> getAllNutritionPlans() {
        List<NutritionPlan> plans = nutritionService.getAllNutritionPlans();
        return ResponseEntity.ok(plans);
    }
    
    @GetMapping("/plans/{id}")
    public ResponseEntity<?> getNutritionPlanById(@PathVariable Long id) {
        Optional<NutritionPlan> plan = nutritionService.getNutritionPlanById(id);
        if (plan.isPresent()) {
            return ResponseEntity.ok(plan.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/plans/search")
    public ResponseEntity<?> searchNutritionPlans(
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String sex,
            @RequestParam(required = false) String height,
            @RequestParam(required = false) String weight) {
        try {
            List<NutritionPlan> plans = nutritionService.searchNutritionPlans(age, sex, height, weight);
            return ResponseEntity.ok(plans);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to search nutrition plans: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/plans/search/name")
    public ResponseEntity<?> searchNutritionPlansByName(@RequestParam String name) {
        try {
            List<NutritionPlan> plans = nutritionService.searchPlansByName(name);
            return ResponseEntity.ok(plans);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to search nutrition plans: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Nutrition Entry endpoints
    
    /**
     * Create a new nutrition entry
     */
    @PostMapping("/entries")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createNutritionEntry(
            @RequestBody NutritionEntryRequest request,
            Authentication authentication) {
        try {
            // Get user ID from authentication
            Long userId = getUserIdFromAuthentication(authentication);
            
            // Create nutrition entry
            NutritionEntry entry = new NutritionEntry();
            entry.setUserId(userId);
            entry.setFoodName(request.getFoodName());
            entry.setEntryDate(request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now());
            
            // Apply quantity multiplier if provided
            Double quantity = request.getQuantity() != null && request.getQuantity() > 0 
                ? request.getQuantity() : 1.0;
            
            entry.setCalories(request.getCalories() != null ? request.getCalories() * quantity : null);
            entry.setProtein(request.getProtein() != null ? request.getProtein() * quantity : null);
            entry.setCarbs(request.getCarbs() != null ? request.getCarbs() * quantity : null);
            entry.setFat(request.getFat() != null ? request.getFat() * quantity : null);
            entry.setFiber(request.getFiber() != null ? request.getFiber() * quantity : null);
            entry.setSugar(request.getSugar() != null ? request.getSugar() * quantity : null);
            entry.setSodium(request.getSodium() != null ? request.getSodium() * quantity : null);
            
            NutritionEntry savedEntry = nutritionEntryService.createEntry(entry);
            return ResponseEntity.ok(savedEntry);
            
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to create nutrition entry: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get all nutrition entries for the current user
     */
    @GetMapping("/entries")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getNutritionEntries(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            List<NutritionEntry> entries = nutritionEntryService.getEntriesByUserId(userId);
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to get nutrition entries: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get nutrition entries for a specific date
     */
    @GetMapping("/entries/date")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getNutritionEntriesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            List<NutritionEntry> entries = nutritionEntryService.getEntriesByUserIdAndDate(userId, date);
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to get nutrition entries: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get daily nutrition totals
     */
    @GetMapping("/entries/totals")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getDailyTotals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            LocalDate targetDate = date != null ? date : LocalDate.now();
            NutritionEntryService.NutritionTotals totals = 
                nutritionEntryService.calculateDailyTotals(userId, targetDate);
            return ResponseEntity.ok(totals);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to get daily totals: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get weekly nutrition entries
     */
    @GetMapping("/entries/week")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getWeeklyNutritionEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(6);
            LocalDate end = LocalDate.now();
            
            List<NutritionEntry> entries = nutritionEntryService.getEntriesByUserIdAndDateRange(userId, start, end);
            
            // Group entries by date and calculate totals per day
            Map<LocalDate, List<NutritionEntry>> entriesByDate = new java.util.HashMap<>();
            Map<LocalDate, NutritionEntryService.NutritionTotals> totalsByDate = new java.util.HashMap<>();
            
            for (NutritionEntry entry : entries) {
                LocalDate entryDate = entry.getEntryDate();
                entriesByDate.computeIfAbsent(entryDate, k -> new java.util.ArrayList<>()).add(entry);
                
                NutritionEntryService.NutritionTotals totals = totalsByDate.computeIfAbsent(
                    entryDate, 
                    k -> new NutritionEntryService.NutritionTotals()
                );
                totals.addEntry(entry);
            }
            
            // Build response
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("startDate", start);
            response.put("endDate", end);
            response.put("entries", entries);
            response.put("entriesByDate", entriesByDate);
            response.put("totalsByDate", totalsByDate);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to get weekly nutrition entries: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Update an existing nutrition entry
     */
    @PutMapping("/entries/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> updateNutritionEntry(
            @PathVariable Long id,
            @RequestBody NutritionEntryRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            
            // Verify entry exists and belongs to user
            Optional<NutritionEntry> entryOpt = nutritionEntryService.getEntryById(id);
            if (entryOpt.isEmpty() || !entryOpt.get().getUserId().equals(userId)) {
                return ResponseEntity.notFound().build();
            }
            
            NutritionEntry entry = entryOpt.get();
            
            // Update fields from request
            if (request.getFoodName() != null) {
                entry.setFoodName(request.getFoodName());
            }
            if (request.getEntryDate() != null) {
                entry.setEntryDate(request.getEntryDate());
            }
            
            // Apply quantity multiplier if provided
            Double quantity = request.getQuantity() != null && request.getQuantity() > 0 
                ? request.getQuantity() : 1.0;
            
            if (request.getCalories() != null) entry.setCalories(request.getCalories() * quantity);
            if (request.getProtein() != null) entry.setProtein(request.getProtein() * quantity);
            if (request.getCarbs() != null) entry.setCarbs(request.getCarbs() * quantity);
            if (request.getFat() != null) entry.setFat(request.getFat() * quantity);
            if (request.getFiber() != null) entry.setFiber(request.getFiber() * quantity);
            if (request.getSugar() != null) entry.setSugar(request.getSugar() * quantity);
            if (request.getSodium() != null) entry.setSodium(request.getSodium() * quantity);
            
            NutritionEntry updatedEntry = nutritionEntryService.updateEntry(entry);
            return ResponseEntity.ok(updatedEntry);
            
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to update nutrition entry: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Delete a nutrition entry
     */
    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> deleteNutritionEntry(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            
            // Verify entry belongs to user
            Optional<NutritionEntry> entry = nutritionEntryService.getEntryById(id);
            if (entry.isEmpty() || !entry.get().getUserId().equals(userId)) {
                return ResponseEntity.notFound().build();
            }
            
            nutritionEntryService.deleteEntry(id);
            return ResponseEntity.ok(Map.of("message", "Nutrition entry deleted successfully"));
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to delete nutrition entry: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Generate a personalized nutrition plan using AI chatbot
     */
    @PostMapping("/plans/chatbot")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> generatePersonalizedPlan(
            @Valid @RequestBody ChatbotPlanRequest request,
            Authentication authentication) {
        try {
            if (openRouterService == null || !openRouterService.isEnabled()) {
                Map<String, String> error = Map.of("error", "AI chatbot is not available. OpenRouter is not configured.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get user for bio data if requested
            String username = authentication.getName();
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
            
            // Prepare bio data if requested
            Integer age = null;
            String weight = null;
            String height = null;
            String activityLevel = null;
            Boolean vegan = null;
            Boolean vegetarian = null;
            
            if (request.isIncludeBioData()) {
                age = user.getAge();
                weight = user.getWeight();
                height = user.getHeight();
                activityLevel = user.getActivityLevel() != null ? user.getActivityLevel().toString() : null;
                vegan = user.getVegan();
                vegetarian = user.getVegetarian();
            }
            
            // Generate plan using OpenRouter
            String planJson = openRouterService.generatePersonalizedPlan(
                request.getUserDescription(),
                request.isIncludeBioData(),
                age,
                weight,
                height,
                activityLevel,
                vegan,
                vegetarian
            );
            
            // Parse the JSON response
            JsonNode planNode;
            try {
                planNode = objectMapper.readTree(planJson);
            } catch (Exception e) {
                logger.error("Failed to parse AI response as JSON: {}", planJson);
                throw new RuntimeException("Failed to parse AI-generated plan. The AI response may not be valid JSON: " + e.getMessage());
            }
            
            // Create NutritionPlan object from the generated plan
            NutritionPlan plan = new NutritionPlan();
            if (planNode.has("name")) {
                plan.setName(planNode.get("name").asText());
            } else {
                plan.setName("Personalized Plan");
            }
            
            if (planNode.has("description")) {
                plan.setDescription(planNode.get("description").asText());
            } else if (planNode.has("recommendations")) {
                plan.setDescription(planNode.get("recommendations").asText());
            }
            
            if (planNode.has("dailyCalories")) {
                plan.setDailyCalories(planNode.get("dailyCalories").asText());
            }
            if (planNode.has("carbohydratesG")) {
                plan.setCarbohydratesG(planNode.get("carbohydratesG").asText());
            }
            if (planNode.has("proteinsG")) {
                plan.setProteinsG(planNode.get("proteinsG").asText());
            }
            if (planNode.has("fatsG")) {
                plan.setFatsG(planNode.get("fatsG").asText());
            }
            if (planNode.has("hydration")) {
                plan.setHydration(planNode.get("hydration").asText());
            }
            
            // Set default values for other fields
            plan.setAge("A");
            plan.setSex("A");
            plan.setHeight("A");
            plan.setWeight("A");
            
            // Save the plan
            NutritionPlan savedPlan = nutritionService.saveNutritionPlan(plan);
            
            // Return both the plan and the full AI response
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("plan", savedPlan);
            response.put("aiResponse", planJson);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to generate personalized plan: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Helper method to get user ID from authentication
     */
    private Long getUserIdFromAuthentication(Authentication authentication) {
        String username = authentication.getName();
        return userService.findByUsername(username)
            .map(user -> user.getId())
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
}
