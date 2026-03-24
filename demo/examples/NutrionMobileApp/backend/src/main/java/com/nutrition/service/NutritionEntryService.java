package com.nutrition.service;

import com.nutrition.model.NutritionEntry;
import com.nutrition.repository.NutritionEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class NutritionEntryService {
    
    private static final Logger logger = LoggerFactory.getLogger(NutritionEntryService.class);
    
    @Autowired
    private NutritionEntryRepository nutritionEntryRepository;
    
    /**
     * Create a new nutrition entry
     */
    @Transactional
    public NutritionEntry createEntry(NutritionEntry entry) {
        logger.info("Creating nutrition entry for user {}: {}", entry.getUserId(), entry.getFoodName());
        return nutritionEntryRepository.save(entry);
    }
    
    /**
     * Get all entries for a user
     */
    public List<NutritionEntry> getEntriesByUserId(Long userId) {
        return nutritionEntryRepository.findByUserId(userId != null ? userId : 0L);
    }
    
    /**
     * Get entries for a user on a specific date
     */
    public List<NutritionEntry> getEntriesByUserIdAndDate(Long userId, LocalDate date) {
        return nutritionEntryRepository.findByUserIdAndEntryDate(userId != null ? userId : 0L, date);
    }
    
    /**
     * Get entries for a user within a date range
     */
    public List<NutritionEntry> getEntriesByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return nutritionEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate, endDate);
    }
    
    /**
     * Get a specific entry by ID
     */
    public Optional<NutritionEntry> getEntryById(Long id) {
        return nutritionEntryRepository.findById(id);
    }
    
    /**
     * Update an existing entry
     */
    @Transactional
    public NutritionEntry updateEntry(NutritionEntry entry) {
        logger.info("Updating nutrition entry {} for user {}", entry.getId(), entry.getUserId());
        return nutritionEntryRepository.save(entry);
    }
    
    /**
     * Delete an entry
     */
    @Transactional
    public void deleteEntry(Long id) {
        logger.info("Deleting nutrition entry {}", id);
        nutritionEntryRepository.deleteById(id);
    }
    
    /**
     * Calculate total nutrition for a user on a specific date
     */
    public NutritionTotals calculateDailyTotals(Long userId, LocalDate date) {
        List<NutritionEntry> entries = getEntriesByUserIdAndDate(userId, date);
        
        NutritionTotals totals = new NutritionTotals();
        for (NutritionEntry entry : entries) {
            totals.addEntry(entry);
        }
        
        return totals;
    }
    
    /**
     * Inner class for nutrition totals
     */
    public static class NutritionTotals {
        private double totalCalories = 0.0;
        private double totalProtein = 0.0;
        private double totalCarbs = 0.0;
        private double totalFat = 0.0;
        private double totalFiber = 0.0;
        private double totalSugar = 0.0;
        private double totalSodium = 0.0;
        private int entryCount = 0;
        
        public void addEntry(NutritionEntry entry) {
            if (entry.getCalories() != null) totalCalories += entry.getCalories();
            if (entry.getProtein() != null) totalProtein += entry.getProtein();
            if (entry.getCarbs() != null) totalCarbs += entry.getCarbs();
            if (entry.getFat() != null) totalFat += entry.getFat();
            if (entry.getFiber() != null) totalFiber += entry.getFiber();
            if (entry.getSugar() != null) totalSugar += entry.getSugar();
            if (entry.getSodium() != null) totalSodium += entry.getSodium();
            entryCount++;
        }
        
        // Getters
        public double getTotalCalories() { return totalCalories; }
        public double getTotalProtein() { return totalProtein; }
        public double getTotalCarbs() { return totalCarbs; }
        public double getTotalFat() { return totalFat; }
        public double getTotalFiber() { return totalFiber; }
        public double getTotalSugar() { return totalSugar; }
        public double getTotalSodium() { return totalSodium; }
        public int getEntryCount() { return entryCount; }
    }
}

