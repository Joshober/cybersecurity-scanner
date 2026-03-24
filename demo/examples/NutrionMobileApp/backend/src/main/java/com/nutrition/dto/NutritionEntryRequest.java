package com.nutrition.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class NutritionEntryRequest {
    
    @NotNull(message = "Food name is required")
    private String foodName;
    
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private Double fiber;
    private Double sugar;
    private Double sodium;
    
    private Double quantity; // Quantity multiplier (e.g., 1.5 for 1.5 servings)
    private String quantityUnit; // Unit (e.g., "serving", "gram", "piece")
    
    private LocalDate entryDate; // Optional, defaults to today
    
    // Constructors
    public NutritionEntryRequest() {}
    
    // Getters and Setters
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    
    public Double getCalories() { return calories; }
    public void setCalories(Double calories) { this.calories = calories; }
    
    public Double getProtein() { return protein; }
    public void setProtein(Double protein) { this.protein = protein; }
    
    public Double getCarbs() { return carbs; }
    public void setCarbs(Double carbs) { this.carbs = carbs; }
    
    public Double getFat() { return fat; }
    public void setFat(Double fat) { this.fat = fat; }
    
    public Double getFiber() { return fiber; }
    public void setFiber(Double fiber) { this.fiber = fiber; }
    
    public Double getSugar() { return sugar; }
    public void setSugar(Double sugar) { this.sugar = sugar; }
    
    public Double getSodium() { return sodium; }
    public void setSodium(Double sodium) { this.sodium = sodium; }
    
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    
    public String getQuantityUnit() { return quantityUnit; }
    public void setQuantityUnit(String quantityUnit) { this.quantityUnit = quantityUnit; }
    
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
}

