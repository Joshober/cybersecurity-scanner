package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * Entity for user-added custom foods that aren't in the menu or USDA database.
 * These foods are saved when users manually enter them, allowing them to be
 * found in future searches.
 */
@Entity
@Table(name = "custom_foods")
public class CustomFood {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(name = "food_name", nullable = false)
    private String foodName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Nutrition information (per 100g, consistent with MenuItem)
    @Column(name = "calories_per_100g")
    private Double caloriesPer100g;
    
    @Column(name = "protein_per_100g")
    private Double proteinPer100g;
    
    @Column(name = "carbs_per_100g")
    private Double carbsPer100g;
    
    @Column(name = "fat_per_100g")
    private Double fatPer100g;
    
    @Column(name = "fiber_per_100g")
    private Double fiberPer100g;
    
    @Column(name = "sugar_per_100g")
    private Double sugarPer100g;
    
    @Column(name = "sodium_per_100g")
    private Double sodiumPer100g;
    
    // Optional metadata
    @Column(length = 255)
    private String brand;
    
    @Column(length = 255)
    private String category;
    
    @Column(name = "search_keywords", columnDefinition = "TEXT")
    private String searchKeywords;
    
    // User who added it (optional, for future user-specific foods)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by_user_id")
    private User addedByUser;
    
    // Usage tracking
    @Column(name = "usage_count")
    private Integer usageCount = 0;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (usageCount == null) {
            usageCount = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public CustomFood() {}
    
    public CustomFood(String foodName) {
        this.foodName = foodName;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getCaloriesPer100g() { return caloriesPer100g; }
    public void setCaloriesPer100g(Double caloriesPer100g) { this.caloriesPer100g = caloriesPer100g; }
    
    public Double getProteinPer100g() { return proteinPer100g; }
    public void setProteinPer100g(Double proteinPer100g) { this.proteinPer100g = proteinPer100g; }
    
    public Double getCarbsPer100g() { return carbsPer100g; }
    public void setCarbsPer100g(Double carbsPer100g) { this.carbsPer100g = carbsPer100g; }
    
    public Double getFatPer100g() { return fatPer100g; }
    public void setFatPer100g(Double fatPer100g) { this.fatPer100g = fatPer100g; }
    
    public Double getFiberPer100g() { return fiberPer100g; }
    public void setFiberPer100g(Double fiberPer100g) { this.fiberPer100g = fiberPer100g; }
    
    public Double getSugarPer100g() { return sugarPer100g; }
    public void setSugarPer100g(Double sugarPer100g) { this.sugarPer100g = sugarPer100g; }
    
    public Double getSodiumPer100g() { return sodiumPer100g; }
    public void setSodiumPer100g(Double sodiumPer100g) { this.sodiumPer100g = sodiumPer100g; }
    
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSearchKeywords() { return searchKeywords; }
    public void setSearchKeywords(String searchKeywords) { this.searchKeywords = searchKeywords; }
    
    public User getAddedByUser() { return addedByUser; }
    public void setAddedByUser(User addedByUser) { this.addedByUser = addedByUser; }
    
    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }
    
    public LocalDateTime getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(LocalDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

