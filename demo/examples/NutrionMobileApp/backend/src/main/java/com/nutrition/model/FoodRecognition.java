package com.nutrition.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "food_recognitions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FoodRecognition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_meal_id")
    @JsonIgnore
    private UserMeal userMeal;
    
    @Column(name = "detected_food_name", nullable = false)
    private String detectedFoodName;
    
    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore;
    
    @Column(name = "is_from_menu", nullable = false)
    private Boolean isFromMenu = false;
    
    // Segmentation results
    @Column(name = "segmentation_mask", columnDefinition = "TEXT")
    private String segmentationMask; // Base64 encoded mask
    
    @Column(name = "bounding_box", columnDefinition = "TEXT")
    private String boundingBox; // JSON: {x, y, width, height}
    
    // Portion analysis
    @Column(name = "estimated_area_pixels")
    private Integer estimatedAreaPixels;
    
    @Column(name = "estimated_volume_cm3")
    private Double estimatedVolumeCm3;
    
    @Column(name = "estimated_weight_grams")
    private Double estimatedWeightGrams;
    
    @Column(name = "plate_radius_pixels")
    private Integer plateRadiusPixels;
    
    // Depth estimation
    @Column(name = "estimated_depth_cm")
    private Double estimatedDepthCm;
    
    // Count-based quantity information (from OpenRouter)
    @Column(name = "detected_count")
    private Integer detectedCount;
    
    @Column(name = "detected_unit")
    private String detectedUnit;
    
    @Column(name = "detected_size_label")
    private String detectedSizeLabel;
    
    // ML model info
    @Column(name = "model_version")
    private String modelVersion;
    
    @Column(name = "inference_time_ms")
    private Long inferenceTimeMs;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Relationships
    @OneToMany(mappedBy = "foodRecognition", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<NutritionEstimate> nutritionEstimates;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public FoodRecognition() {}
    
    public FoodRecognition(String detectedFoodName, Double confidenceScore, Boolean isFromMenu) {
        this.detectedFoodName = detectedFoodName;
        this.confidenceScore = confidenceScore;
        this.isFromMenu = isFromMenu;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }
    
    public UserMeal getUserMeal() { return userMeal; }
    public void setUserMeal(UserMeal userMeal) { this.userMeal = userMeal; }
    
    public String getDetectedFoodName() { return detectedFoodName; }
    public void setDetectedFoodName(String detectedFoodName) { this.detectedFoodName = detectedFoodName; }
    
    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
    
    public Boolean getIsFromMenu() { return isFromMenu; }
    public void setIsFromMenu(Boolean isFromMenu) { this.isFromMenu = isFromMenu; }
    
    public String getSegmentationMask() { return segmentationMask; }
    public void setSegmentationMask(String segmentationMask) { this.segmentationMask = segmentationMask; }
    
    public String getBoundingBox() { return boundingBox; }
    public void setBoundingBox(String boundingBox) { this.boundingBox = boundingBox; }
    
    public Integer getEstimatedAreaPixels() { return estimatedAreaPixels; }
    public void setEstimatedAreaPixels(Integer estimatedAreaPixels) { this.estimatedAreaPixels = estimatedAreaPixels; }
    
    public Double getEstimatedVolumeCm3() { return estimatedVolumeCm3; }
    public void setEstimatedVolumeCm3(Double estimatedVolumeCm3) { this.estimatedVolumeCm3 = estimatedVolumeCm3; }
    
    public Double getEstimatedWeightGrams() { return estimatedWeightGrams; }
    public void setEstimatedWeightGrams(Double estimatedWeightGrams) { this.estimatedWeightGrams = estimatedWeightGrams; }
    
    public Integer getPlateRadiusPixels() { return plateRadiusPixels; }
    public void setPlateRadiusPixels(Integer plateRadiusPixels) { this.plateRadiusPixels = plateRadiusPixels; }
    
    public Double getEstimatedDepthCm() { return estimatedDepthCm; }
    public void setEstimatedDepthCm(Double estimatedDepthCm) { this.estimatedDepthCm = estimatedDepthCm; }
    
    public Integer getDetectedCount() { return detectedCount; }
    public void setDetectedCount(Integer detectedCount) { this.detectedCount = detectedCount; }
    
    public String getDetectedUnit() { return detectedUnit; }
    public void setDetectedUnit(String detectedUnit) { this.detectedUnit = detectedUnit; }
    
    public String getDetectedSizeLabel() { return detectedSizeLabel; }
    public void setDetectedSizeLabel(String detectedSizeLabel) { this.detectedSizeLabel = detectedSizeLabel; }
    
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    
    public Long getInferenceTimeMs() { return inferenceTimeMs; }
    public void setInferenceTimeMs(Long inferenceTimeMs) { this.inferenceTimeMs = inferenceTimeMs; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<NutritionEstimate> getNutritionEstimates() { return nutritionEstimates; }
    public void setNutritionEstimates(List<NutritionEstimate> nutritionEstimates) { this.nutritionEstimates = nutritionEstimates; }
}
