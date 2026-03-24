package com.nutrition.repository;

import com.nutrition.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    // Find by location and date range
    @Query("SELECT m FROM MenuItem m WHERE m.location = :location AND m.date BETWEEN :startDate AND :endDate")
    List<MenuItem> findByLocationAndDateRange(
        @Param("location") String location,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find by meal type and date
    @Query("SELECT m FROM MenuItem m WHERE m.mealType = :mealType AND m.date = :date")
    List<MenuItem> findByMealTypeAndDate(
        @Param("mealType") String mealType,
        @Param("date") LocalDate date
    );
    
    // Find by category
    List<MenuItem> findByCategory(String category);
    
    // Find by name containing (case insensitive)
    @Query("SELECT m FROM MenuItem m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<MenuItem> findByNameContainingIgnoreCase(@Param("name") String name);
    
    // Find by search keywords
    @Query("SELECT m FROM MenuItem m WHERE m.searchKeywords LIKE %:keyword%")
    List<MenuItem> findBySearchKeywordsContaining(@Param("keyword") String keyword);
    
    // Find items with prior probabilities above threshold
    @Query("SELECT m FROM MenuItem m WHERE m.priorProbability >= :threshold ORDER BY m.priorProbability DESC")
    List<MenuItem> findByPriorProbabilityAbove(@Param("threshold") Double threshold);
    
    // Find by Lucene document ID
    Optional<MenuItem> findByLuceneDocId(String luceneDocId);
    
    // Find items available on a specific date
    @Query("SELECT m FROM MenuItem m WHERE m.date = :date ORDER BY m.mealType, m.category")
    List<MenuItem> findAvailableOnDate(@Param("date") LocalDate date);
    
    // Find items by location and meal type
    List<MenuItem> findByLocationAndMealType(String location, String mealType);
    
    // Find items with nutritional information
    @Query("SELECT m FROM MenuItem m WHERE m.caloriesPer100g IS NOT NULL AND m.proteinPer100g IS NOT NULL")
    List<MenuItem> findWithNutritionalInfo();
    
    // Find items with density information
    @Query("SELECT m FROM MenuItem m WHERE m.densityGPerCm3 IS NOT NULL")
    List<MenuItem> findWithDensityInfo();
    
    // Find items by feature vector similarity (placeholder for vector search)
    @Query("SELECT m FROM MenuItem m WHERE m.featureVector IS NOT NULL")
    List<MenuItem> findWithFeatureVectors();
    
    // Count items by category
    @Query("SELECT m.category, COUNT(m) FROM MenuItem m GROUP BY m.category")
    List<Object[]> countByCategory();
    
    // Find most recent items
    @Query("SELECT m FROM MenuItem m ORDER BY m.updatedAt DESC")
    List<MenuItem> findMostRecent();
    
    // Find items updated after a specific time
    @Query("SELECT m FROM MenuItem m WHERE m.updatedAt > :since")
    List<MenuItem> findUpdatedAfter(@Param("since") LocalDateTime since);
    
    // Additional methods needed by services
    List<MenuItem> findByLocationAndDateAndMealType(String location, LocalDate date, String mealType);
    
    List<MenuItem> findByNameContainingIgnoreCaseAndLocationAndMealType(String name, String location, String mealType);
    
    Optional<MenuItem> findByNameAndLocationAndDateAndMealType(String name, String location, LocalDate date, String mealType);
}
