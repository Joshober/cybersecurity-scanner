package com.nutrition.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class TypicalWeightsService {
    
    // Typical weights per unit (in grams)
    private static final Map<String, Double> TYPICAL_WEIGHTS = Map.of(
        "egg", 50.0,
        "slice", 25.0,
        "cup", 200.0,
        "piece", 75.0,
        "serving", 125.0,
        "item", 100.0
    );
    
    // Size multipliers
    private static final Map<String, Double> SIZE_MULTIPLIERS = Map.of(
        "small", 0.8,
        "medium", 1.0,
        "large", 1.2
    );
    
    /**
     * Calculate weight from count, unit, and size label
     * @param count Number of items
     * @param unit Unit type (egg, slice, cup, piece, serving, item)
     * @param sizeLabel Size label (small, medium, large)
     * @return Estimated weight in grams
     */
    public double calculateWeightFromCounts(int count, String unit, String sizeLabel) {
        double baseWeight = TYPICAL_WEIGHTS.getOrDefault(unit.toLowerCase(), 100.0);
        double multiplier = SIZE_MULTIPLIERS.getOrDefault(sizeLabel.toLowerCase(), 1.0);
        return count * baseWeight * multiplier;
    }
}

