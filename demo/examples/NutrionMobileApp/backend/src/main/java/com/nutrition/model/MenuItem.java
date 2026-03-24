package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "menu_items")
public class MenuItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @NotBlank
    @Column(nullable = false)
    private String category;
    
    @NotBlank
    @Column(nullable = false)
    private String location; // dining hall location
    
    @NotNull
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(name = "meal_type")
    private String mealType; // breakfast, lunch, dinner
    
    // Nutritional information
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
    
    // ML features
    @Column(name = "feature_vector", columnDefinition = "TEXT")
    private String featureVector; // JSON array of features
    
    @Column(name = "prior_probability")
    private Double priorProbability;
    
    @Column(name = "density_g_per_cm3")
    private Double densityGPerCm3;
    
    // Additional fields
    @Column(length = 1000)
    private String allergens;
    
    @Column(length = 2000)
    private String ingredients;
    
    // Search and indexing
    @Column(name = "search_keywords", columnDefinition = "TEXT")
    private String searchKeywords;
    
    @Column(name = "lucene_doc_id")
    private String luceneDocId;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FoodRecognition> foodRecognitions;
    
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
    public MenuItem() {}
    
    public MenuItem(String name, String description, String category, String location, 
                   LocalDate date, String mealType) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.location = location;
        this.date = date;
        this.mealType = mealType;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
    
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
    
    public String getFeatureVector() { return featureVector; }
    public void setFeatureVector(String featureVector) { this.featureVector = featureVector; }
    
    public Double getPriorProbability() { return priorProbability; }
    public void setPriorProbability(Double priorProbability) { this.priorProbability = priorProbability; }
    
    public Double getDensityGPerCm3() { return densityGPerCm3; }
    public void setDensityGPerCm3(Double densityGPerCm3) { this.densityGPerCm3 = densityGPerCm3; }
    
    public String getSearchKeywords() { return searchKeywords; }
    public void setSearchKeywords(String searchKeywords) { this.searchKeywords = searchKeywords; }
    
    public String getLuceneDocId() { return luceneDocId; }
    public void setLuceneDocId(String luceneDocId) { this.luceneDocId = luceneDocId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<FoodRecognition> getFoodRecognitions() { return foodRecognitions; }
    public void setFoodRecognitions(List<FoodRecognition> foodRecognitions) { this.foodRecognitions = foodRecognitions; }
    
    public String getAllergens() { return allergens; }
    public void setAllergens(String allergens) { this.allergens = allergens; }
    
    public String getIngredients() { return ingredients; }
    public void setIngredients(String ingredients) { this.ingredients = ingredients; }
}
