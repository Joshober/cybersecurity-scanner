package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "portion_analyses")
public class PortionAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "image_path")
    private String imagePath;
    
    @Column(name = "food_items", columnDefinition = "TEXT")
    private String foodItems;
    
    @Column(name = "confidence_scores", columnDefinition = "TEXT")
    private String confidenceScores;
    
    @Column(name = "portion_sizes", columnDefinition = "TEXT")
    private String portionSizes;
    
    @Column(name = "estimated_calories")
    private Double estimatedCalories;
    
    @Column(name = "estimated_protein")
    private Double estimatedProtein;
    
    @Column(name = "estimated_carbs")
    private Double estimatedCarbs;
    
    @Column(name = "estimated_fat")
    private Double estimatedFat;
    
    @NotNull
    @Column(name = "analysis_date", nullable = false)
    private LocalDate analysisDate;
    
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
    public PortionAnalysis() {}
    
    public PortionAnalysis(Long userId, LocalDate analysisDate) {
        this.userId = userId;
        this.analysisDate = analysisDate;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
    
    public String getFoodItems() { return foodItems; }
    public void setFoodItems(String foodItems) { this.foodItems = foodItems; }
    
    public String getConfidenceScores() { return confidenceScores; }
    public void setConfidenceScores(String confidenceScores) { this.confidenceScores = confidenceScores; }
    
    public String getPortionSizes() { return portionSizes; }
    public void setPortionSizes(String portionSizes) { this.portionSizes = portionSizes; }
    
    public Double getEstimatedCalories() { return estimatedCalories; }
    public void setEstimatedCalories(Double estimatedCalories) { this.estimatedCalories = estimatedCalories; }
    
    public Double getEstimatedProtein() { return estimatedProtein; }
    public void setEstimatedProtein(Double estimatedProtein) { this.estimatedProtein = estimatedProtein; }
    
    public Double getEstimatedCarbs() { return estimatedCarbs; }
    public void setEstimatedCarbs(Double estimatedCarbs) { this.estimatedCarbs = estimatedCarbs; }
    
    public Double getEstimatedFat() { return estimatedFat; }
    public void setEstimatedFat(Double estimatedFat) { this.estimatedFat = estimatedFat; }
    
    public LocalDate getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDate analysisDate) { this.analysisDate = analysisDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
