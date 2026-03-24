package com.nutrition.controller;

import com.nutrition.model.User;
import com.nutrition.model.NutritionPlan;
import com.nutrition.service.UserService;
import com.nutrition.service.NutritionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private NutritionService nutritionService;
    
    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            String username = authentication.getName();
            Optional<User> user = userService.findByUsername(username);
            
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                Map<String, String> error = Map.of("error", "User not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to get user data");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PutMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> updateCurrentUser(@RequestBody User userUpdate, Authentication authentication) {
        try {
            String username = authentication.getName();
            Optional<User> userOpt = userService.findByUsername(username);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Update only the fields that are provided
                if (userUpdate.getEmail() != null) user.setEmail(userUpdate.getEmail());
                if (userUpdate.getAge() != null) user.setAge(userUpdate.getAge());
                if (userUpdate.getWeight() != null) user.setWeight(userUpdate.getWeight());
                if (userUpdate.getHeight() != null) user.setHeight(userUpdate.getHeight());
                if (userUpdate.getActivityLevel() != null) user.setActivityLevel(userUpdate.getActivityLevel());
                if (userUpdate.getVegan() != null) user.setVegan(userUpdate.getVegan());
                if (userUpdate.getVegetarian() != null) user.setVegetarian(userUpdate.getVegetarian());
                
                // Update nutrition goals if provided
                if (userUpdate.getDailyCalories() != null) user.setDailyCalories(userUpdate.getDailyCalories());
                if (userUpdate.getCarbohydratesG() != null) user.setCarbohydratesG(userUpdate.getCarbohydratesG());
                if (userUpdate.getProteinsG() != null) user.setProteinsG(userUpdate.getProteinsG());
                if (userUpdate.getFatsG() != null) user.setFatsG(userUpdate.getFatsG());
                
                User updatedUser = userService.updateUser(user);
                return ResponseEntity.ok(updatedUser);
            } else {
                Map<String, String> error = Map.of("error", "User not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to update user");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Apply a nutrition plan to the current user
     */
    @PutMapping("/me/plan")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> applyNutritionPlan(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Optional<User> userOpt = userService.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                Map<String, String> error = Map.of("error", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Get nutrition plan ID from request
            Object planIdObj = request.get("nutritionPlanId");
            if (planIdObj == null) {
                Map<String, String> error = Map.of("error", "nutritionPlanId is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            Long planId;
            if (planIdObj instanceof Number) {
                planId = ((Number) planIdObj).longValue();
            } else if (planIdObj instanceof String) {
                planId = Long.parseLong((String) planIdObj);
            } else {
                Map<String, String> error = Map.of("error", "Invalid nutritionPlanId format");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get nutrition plan
            Optional<NutritionPlan> planOpt = nutritionService.getNutritionPlanById(planId);
            if (planOpt.isEmpty()) {
                Map<String, String> error = Map.of("error", "Nutrition plan not found");
                return ResponseEntity.notFound().build();
            }
            
            NutritionPlan plan = planOpt.get();
            user.setNutritionPlan(plan);
            
            // Optionally copy plan's macro values to user's goal fields
            if (plan.getDailyCalories() != null && !plan.getDailyCalories().isEmpty()) {
                user.setDailyCalories(plan.getDailyCalories());
            }
            if (plan.getCarbohydratesG() != null && !plan.getCarbohydratesG().isEmpty()) {
                user.setCarbohydratesG(plan.getCarbohydratesG());
            }
            if (plan.getProteinsG() != null && !plan.getProteinsG().isEmpty()) {
                user.setProteinsG(plan.getProteinsG());
            }
            if (plan.getFatsG() != null && !plan.getFatsG().isEmpty()) {
                user.setFatsG(plan.getFatsG());
            }
            
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(updatedUser);
            
        } catch (NumberFormatException e) {
            Map<String, String> error = Map.of("error", "Invalid nutritionPlanId format");
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = Map.of("error", "Failed to apply nutrition plan: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            Map<String, String> error = Map.of("error", "User not found");
            return ResponseEntity.notFound().build();
        }
    }
}
