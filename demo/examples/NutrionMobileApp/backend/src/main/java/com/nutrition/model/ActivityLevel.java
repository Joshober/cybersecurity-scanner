package com.nutrition.model;

public enum ActivityLevel {
    SEDENTARY("Sedentary", "Little or no exercise (BMR × 1.2)"),
    LIGHTLY_ACTIVE("Lightly Active", "Light exercise 1-3 days/week (BMR × 1.375)"),
    MODERATELY_ACTIVE("Moderately Active", "Moderate exercise 3-5 days/week (BMR × 1.55)"),
    VERY_ACTIVE("Very Active", "Hard exercise 6-7 days/week (BMR × 1.725)"),
    SUPER_ACTIVE("Super Active", "Very hard exercise/physical job (BMR × 1.9)");
    
    private final String displayName;
    private final String description;
    
    ActivityLevel(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public double getMultiplier() {
        return switch (this) {
            case SEDENTARY -> 1.2;
            case LIGHTLY_ACTIVE -> 1.375;
            case MODERATELY_ACTIVE -> 1.55;
            case VERY_ACTIVE -> 1.725;
            case SUPER_ACTIVE -> 1.9;
        };
    }
}
