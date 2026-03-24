package com.nutrition.service;

import com.nutrition.dto.NutritionCalculationRequest;
import com.nutrition.dto.NutritionCalculationResponse;
import com.nutrition.model.ActivityLevel;
import com.nutrition.model.NutritionPlan;
import com.nutrition.repository.NutritionPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NutritionService {
    
    @Autowired
    private NutritionPlanRepository nutritionPlanRepository;
    
    public NutritionCalculationResponse calculateNutrition(NutritionCalculationRequest request) {
        // Calculate BMR using Mifflin-St Jeor Equation
        double weight = request.getWeight();
        double height = request.getHeight();
        int age = request.getAge();
        String sex = request.getSex();
        
        // Gender constant: 5 for male, -161 for female
        int genderConstant = "M".equals(sex) ? 5 : -161;
        int bmr = (int) Math.round(10 * weight + 6.25 * height - 5 * age + genderConstant);
        
        // Calculate daily calories based on activity level
        double activityFactor = request.getActivityLevel() != null ? 
            request.getActivityLevel().getMultiplier() : 1.55;
        
        // If factor value is provided, use it instead
        if (request.getFactorValue() != null && !request.getFactorValue().isEmpty()) {
            try {
                activityFactor = Double.parseDouble(request.getFactorValue());
            } catch (NumberFormatException e) {
                // Keep the default activity factor
            }
        }
        
        int dailyCalories = (int) Math.round(bmr * activityFactor);
        
        // Calculate macronutrients (Carbs: 50%, Proteins: 20%, Fats: 30%)
        int carbohydratesG = (int) Math.round((dailyCalories * 0.50) / 4);
        int proteinsG = (int) Math.round((dailyCalories * 0.20) / 4);
        int fatsG = (int) Math.round((dailyCalories * 0.30) / 9);
        
        return new NutritionCalculationResponse(bmr, dailyCalories, activityFactor, 
                                              carbohydratesG, proteinsG, fatsG);
    }
    
    public List<NutritionPlan> searchNutritionPlans(String age, String sex, String height, String weight) {
        return nutritionPlanRepository.findMatchingPlans(age, sex, height, weight);
    }
    
    public List<NutritionPlan> getAllNutritionPlans() {
        return nutritionPlanRepository.findAll();
    }
    
    public Optional<NutritionPlan> getNutritionPlanById(Long id) {
        return nutritionPlanRepository.findById(id);
    }
    
    public List<NutritionPlan> searchPlansByName(String name) {
        return nutritionPlanRepository.findByNameContainingIgnoreCase(name);
    }
    
    public NutritionPlan saveNutritionPlan(NutritionPlan plan) {
        return nutritionPlanRepository.save(plan);
    }
}
