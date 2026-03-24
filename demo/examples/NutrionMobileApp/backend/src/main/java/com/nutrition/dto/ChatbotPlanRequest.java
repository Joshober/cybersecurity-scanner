package com.nutrition.dto;

import jakarta.validation.constraints.NotBlank;

public class ChatbotPlanRequest {
    
    @NotBlank(message = "User description is required")
    private String userDescription;
    
    private boolean includeBioData;
    
    // Optional bio data fields
    private Integer age;
    private String weight;
    private String height;
    private String activityLevel;
    private Boolean vegan;
    private Boolean vegetarian;
    
    // Constructors
    public ChatbotPlanRequest() {}
    
    // Getters and Setters
    public String getUserDescription() {
        return userDescription;
    }
    
    public void setUserDescription(String userDescription) {
        this.userDescription = userDescription;
    }
    
    public boolean isIncludeBioData() {
        return includeBioData;
    }
    
    public void setIncludeBioData(boolean includeBioData) {
        this.includeBioData = includeBioData;
    }
    
    public Integer getAge() {
        return age;
    }
    
    public void setAge(Integer age) {
        this.age = age;
    }
    
    public String getWeight() {
        return weight;
    }
    
    public void setWeight(String weight) {
        this.weight = weight;
    }
    
    public String getHeight() {
        return height;
    }
    
    public void setHeight(String height) {
        this.height = height;
    }
    
    public String getActivityLevel() {
        return activityLevel;
    }
    
    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }
    
    public Boolean getVegan() {
        return vegan;
    }
    
    public void setVegan(Boolean vegan) {
        this.vegan = vegan;
    }
    
    public Boolean getVegetarian() {
        return vegetarian;
    }
    
    public void setVegetarian(Boolean vegetarian) {
        this.vegetarian = vegetarian;
    }
}

