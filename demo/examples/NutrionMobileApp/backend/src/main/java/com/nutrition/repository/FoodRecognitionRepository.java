package com.nutrition.repository;

import com.nutrition.model.FoodRecognition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoodRecognitionRepository extends JpaRepository<FoodRecognition, Long> {
    
    // Find by user meal
    List<FoodRecognition> findByUserMealId(Long userMealId);
    
    // Find by menu item
    List<FoodRecognition> findByMenuItemId(Long menuItemId);
    
    // Find by confidence score above threshold
    @Query("SELECT f FROM FoodRecognition f WHERE f.confidenceScore >= :threshold ORDER BY f.confidenceScore DESC")
    List<FoodRecognition> findByConfidenceScoreAbove(@Param("threshold") Double threshold);
    
    // Find by detected food name
    @Query("SELECT f FROM FoodRecognition f WHERE LOWER(f.detectedFoodName) LIKE LOWER(CONCAT('%', :foodName, '%'))")
    List<FoodRecognition> findByDetectedFoodNameContaining(@Param("foodName") String foodName);
    
    // Find recognitions from menu items
    @Query("SELECT f FROM FoodRecognition f WHERE f.isFromMenu = true")
    List<FoodRecognition> findFromMenuItems();
    
    // Find recognitions not from menu items
    @Query("SELECT f FROM FoodRecognition f WHERE f.isFromMenu = false")
    List<FoodRecognition> findNotFromMenuItems();
    
    // Find by model version
    List<FoodRecognition> findByModelVersion(String modelVersion);
    
    // Find by date range
    @Query("SELECT f FROM FoodRecognition f WHERE f.createdAt BETWEEN :startDate AND :endDate")
    List<FoodRecognition> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Find recognitions with weight estimates
    @Query("SELECT f FROM FoodRecognition f WHERE f.estimatedWeightGrams IS NOT NULL")
    List<FoodRecognition> findWithWeightEstimates();
    
    // Find recognitions with volume estimates
    @Query("SELECT f FROM FoodRecognition f WHERE f.estimatedVolumeCm3 IS NOT NULL")
    List<FoodRecognition> findWithVolumeEstimates();
    
    // Find recognitions with depth estimates
    @Query("SELECT f FROM FoodRecognition f WHERE f.estimatedDepthCm IS NOT NULL")
    List<FoodRecognition> findWithDepthEstimates();
    
    // Find recognitions with segmentation masks
    @Query("SELECT f FROM FoodRecognition f WHERE f.segmentationMask IS NOT NULL")
    List<FoodRecognition> findWithSegmentationMasks();
    
    // Find recognitions with bounding boxes
    @Query("SELECT f FROM FoodRecognition f WHERE f.boundingBox IS NOT NULL")
    List<FoodRecognition> findWithBoundingBoxes();
    
    // Find by inference time range
    @Query("SELECT f FROM FoodRecognition f WHERE f.inferenceTimeMs BETWEEN :minTime AND :maxTime")
    List<FoodRecognition> findByInferenceTimeRange(
        @Param("minTime") Long minTime,
        @Param("maxTime") Long maxTime
    );
    
    // Find most confident recognitions
    @Query("SELECT f FROM FoodRecognition f ORDER BY f.confidenceScore DESC")
    List<FoodRecognition> findMostConfident();
    
    // Find recent recognitions
    @Query("SELECT f FROM FoodRecognition f ORDER BY f.createdAt DESC")
    List<FoodRecognition> findMostRecent();
    
    // Count recognitions by food name
    @Query("SELECT f.detectedFoodName, COUNT(f) FROM FoodRecognition f GROUP BY f.detectedFoodName ORDER BY COUNT(f) DESC")
    List<Object[]> countByDetectedFoodName();
    
    // Count recognitions by model version
    @Query("SELECT f.modelVersion, COUNT(f) FROM FoodRecognition f GROUP BY f.modelVersion")
    List<Object[]> countByModelVersion();
    
    // Find average confidence by food name
    @Query("SELECT f.detectedFoodName, AVG(f.confidenceScore) FROM FoodRecognition f GROUP BY f.detectedFoodName ORDER BY AVG(f.confidenceScore) DESC")
    List<Object[]> findAverageConfidenceByFoodName();
    
    // Find recognitions with nutrition estimates
    @Query("SELECT f FROM FoodRecognition f WHERE SIZE(f.nutritionEstimates) > 0")
    List<FoodRecognition> findWithNutritionEstimates();
}
