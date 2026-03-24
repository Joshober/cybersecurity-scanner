package com.nutrition.repository;

import com.nutrition.model.NutritionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NutritionPlanRepository extends JpaRepository<NutritionPlan, Long> {
    
    @Query("SELECT np FROM NutritionPlan np WHERE " +
           "(:age IS NULL OR np.age = :age OR np.age = 'A') AND " +
           "(:sex IS NULL OR np.sex = :sex OR np.sex = 'A') AND " +
           "(:height IS NULL OR np.height = :height OR np.height = 'A') AND " +
           "(:weight IS NULL OR np.weight = :weight OR np.weight = 'A')")
    List<NutritionPlan> findMatchingPlans(@Param("age") String age, 
                                         @Param("sex") String sex, 
                                         @Param("height") String height, 
                                         @Param("weight") String weight);
    
    List<NutritionPlan> findByNameContainingIgnoreCase(String name);
}
