package com.nutrition.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@Entity
@Table(name = "nutrition_estimates")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NutritionEstimate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_recognition_id", nullable = false)
    @JsonIgnore
    private FoodRecognition foodRecognition;
    
    @Column(name = "nutrient_name", nullable = false)
    private String nutrientName;
    
    @Column(name = "amount_per_100g")
    private Double amountPer100g;
    
    @Column(name = "estimated_amount")
    private Double estimatedAmount;
    
    @Column(name = "unit")
    private String unit;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "source")
    private String source; // "menu_item", "usda", "estimated"
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public NutritionEstimate() {}
    
    public NutritionEstimate(String nutrientName, Double amountPer100g, Double estimatedAmount, String unit) {
        this.nutrientName = nutrientName;
        this.amountPer100g = amountPer100g;
        this.estimatedAmount = estimatedAmount;
        this.unit = unit;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public FoodRecognition getFoodRecognition() { return foodRecognition; }
    public void setFoodRecognition(FoodRecognition foodRecognition) { this.foodRecognition = foodRecognition; }
    
    public String getNutrientName() { return nutrientName; }
    public void setNutrientName(String nutrientName) { this.nutrientName = nutrientName; }
    
    public Double getAmountPer100g() { return amountPer100g; }
    public void setAmountPer100g(Double amountPer100g) { this.amountPer100g = amountPer100g; }
    
    public Double getEstimatedAmount() { return estimatedAmount; }
    public void setEstimatedAmount(Double estimatedAmount) { this.estimatedAmount = estimatedAmount; }
    
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    
    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
