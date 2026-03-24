package com.nutrition.dto;

import com.nutrition.model.ActivityLevel;

public class NutritionCalculationRequest {
    
    private String sex;
    private Double weight;
    private Double height;
    private Integer age;
    private ActivityLevel activityLevel;
    private String factorValue;
    
    // Constructors
    public NutritionCalculationRequest() {}
    
    public NutritionCalculationRequest(String sex, Double weight, Double height, Integer age, ActivityLevel activityLevel) {
        this.sex = sex;
        this.weight = weight;
        this.height = height;
        this.age = age;
        this.activityLevel = activityLevel;
    }
    
    // Getters and Setters
    public String getSex() {
        return sex;
    }
    
    public void setSex(String sex) {
        this.sex = sex;
    }
    
    public Double getWeight() {
        return weight;
    }
    
    public void setWeight(Double weight) {
        this.weight = weight;
    }
    
    public Double getHeight() {
        return height;
    }
    
    public void setHeight(Double height) {
        this.height = height;
    }
    
    public Integer getAge() {
        return age;
    }
    
    public void setAge(Integer age) {
        this.age = age;
    }
    
    public ActivityLevel getActivityLevel() {
        return activityLevel;
    }
    
    public void setActivityLevel(ActivityLevel activityLevel) {
        this.activityLevel = activityLevel;
    }
    
    public String getFactorValue() {
        return factorValue;
    }
    
    public void setFactorValue(String factorValue) {
        this.factorValue = factorValue;
    }
}
