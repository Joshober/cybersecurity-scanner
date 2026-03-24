package com.nutrition.repository;

import com.nutrition.model.CustomFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFoodRepository extends JpaRepository<CustomFood, Long> {
    
    /**
     * Find custom food by exact name and brand (for duplicate checking)
     */
    Optional<CustomFood> findByFoodNameAndBrand(String foodName, String brand);
    
    /**
     * Search custom foods by name (case-insensitive, partial match)
     */
    @Query("SELECT cf FROM CustomFood cf WHERE " +
           "LOWER(cf.foodName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(cf.searchKeywords) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(cf.brand) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CustomFood> searchCustomFoods(@Param("query") String query);
    
    /**
     * Find all custom foods, ordered by usage count (most used first)
     */
    List<CustomFood> findAllByOrderByUsageCountDesc();
}

