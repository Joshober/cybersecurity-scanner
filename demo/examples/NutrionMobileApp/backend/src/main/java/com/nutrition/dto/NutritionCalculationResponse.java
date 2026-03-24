package com.nutrition.dto;

public class NutritionCalculationResponse {
    
    private Integer bmr;
    private Integer dailyCalories;
    private Double activityFactor;
    private Integer carbohydratesG;
    private Integer proteinsG;
    private Integer fatsG;
    
    // Constructors
    public NutritionCalculationResponse() {}
    
    public NutritionCalculationResponse(Integer bmr, Integer dailyCalories, Double activityFactor, 
                                      Integer carbohydratesG, Integer proteinsG, Integer fatsG) {
        this.bmr = bmr;
        this.dailyCalories = dailyCalories;
        this.activityFactor = activityFactor;
        this.carbohydratesG = carbohydratesG;
        this.proteinsG = proteinsG;
        this.fatsG = fatsG;
    }
    
    // Getters and Setters
    public Integer getBmr() {
        return bmr;
    }
    
    public void setBmr(Integer bmr) {
        this.bmr = bmr;
    }
    
    public Integer getDailyCalories() {
        return dailyCalories;
    }
    
    public void setDailyCalories(Integer dailyCalories) {
        this.dailyCalories = dailyCalories;
    }
    
    public Double getActivityFactor() {
        return activityFactor;
    }
    
    public void setActivityFactor(Double activityFactor) {
        this.activityFactor = activityFactor;
    }
    
    public Integer getCarbohydratesG() {
        return carbohydratesG;
    }
    
    public void setCarbohydratesG(Integer carbohydratesG) {
        this.carbohydratesG = carbohydratesG;
    }
    
    public Integer getProteinsG() {
        return proteinsG;
    }
    
    public void setProteinsG(Integer proteinsG) {
        this.proteinsG = proteinsG;
    }
    
    public Integer getFatsG() {
        return fatsG;
    }
    
    public void setFatsG(Integer fatsG) {
        this.fatsG = fatsG;
    }
}
