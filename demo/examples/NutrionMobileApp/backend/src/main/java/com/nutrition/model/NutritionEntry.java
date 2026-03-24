package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "nutrition_entries")
public class NutritionEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @NotNull
    @Column(name = "food_name", nullable = false)
    private String foodName;
    
    @Column(name = "calories")
    private Double calories;
    
    @Column(name = "protein")
    private Double protein;
    
    @Column(name = "carbs")
    private Double carbs;
    
    @Column(name = "fat")
    private Double fat;
    
    @Column(name = "fiber")
    private Double fiber;
    
    @Column(name = "sugar")
    private Double sugar;
    
    @Column(name = "sodium")
    private Double sodium;
    
    @NotNull
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public NutritionEntry() {}
    
    public NutritionEntry(Long userId, String foodName, LocalDate entryDate) {
        this.userId = userId;
        this.foodName = foodName;
        this.entryDate = entryDate;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
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
    
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
