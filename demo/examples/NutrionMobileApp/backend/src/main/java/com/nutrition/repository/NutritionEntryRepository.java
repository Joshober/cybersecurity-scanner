package com.nutrition.repository;

import com.nutrition.model.NutritionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NutritionEntryRepository extends JpaRepository<NutritionEntry, Long> {
    
    // Find all entries for a user, ordered by most recent first
    @Query("SELECT n FROM NutritionEntry n WHERE n.userId = :userId ORDER BY n.createdAt DESC")
    List<NutritionEntry> findByUserId(@Param("userId") Long userId);
    
    // Find entries for a user on a specific date, ordered by most recent first
    @Query("SELECT n FROM NutritionEntry n WHERE n.userId = :userId AND n.entryDate = :entryDate ORDER BY n.createdAt DESC")
    List<NutritionEntry> findByUserIdAndEntryDate(@Param("userId") Long userId, @Param("entryDate") LocalDate entryDate);
    
    // Find entries for a user within a date range
    @Query("SELECT n FROM NutritionEntry n WHERE n.userId = :userId AND n.entryDate BETWEEN :startDate AND :endDate ORDER BY n.entryDate DESC")
    List<NutritionEntry> findByUserIdAndEntryDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find entries by food name for a user
    @Query("SELECT n FROM NutritionEntry n WHERE n.userId = :userId AND LOWER(n.foodName) LIKE LOWER(CONCAT('%', :foodName, '%'))")
    List<NutritionEntry> findByUserIdAndFoodNameContaining(
        @Param("userId") Long userId,
        @Param("foodName") String foodName
    );
}

