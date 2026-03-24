import 'package:flutter/material.dart';
import '../services/food_recognition_service.dart';

class FoodRecognitionResultCard extends StatefulWidget {
  final FoodRecognitionResult result;
  final VoidCallback? onTap;
  final Function(FoodRecognitionResult)? onLogFood;
  
  const FoodRecognitionResultCard({
    super.key,
    required this.result,
    this.onTap,
    this.onLogFood,
  });

  @override
  State<FoodRecognitionResultCard> createState() => _FoodRecognitionResultCardState();
}

class _FoodRecognitionResultCardState extends State<FoodRecognitionResultCard> {
  late FoodRecognitionResult _result;
  
  @override
  void initState() {
    super.initState();
    // Create a mutable copy of the result
    _result = FoodRecognitionResult(
      foodName: widget.result.foodName,
      confidence: widget.result.confidence,
      isFromMenu: widget.result.isFromMenu,
      menuItem: widget.result.menuItem,
      estimatedWeightGrams: widget.result.estimatedWeightGrams,
      estimatedVolumeCm3: widget.result.estimatedVolumeCm3,
      quantityUnit: widget.result.quantityUnit,
      detectedCount: widget.result.detectedCount,
      detectedUnit: widget.result.detectedUnit,
      detectedSizeLabel: widget.result.detectedSizeLabel,
      quantityMode: widget.result.quantityMode,
      calories: widget.result.calories,
      protein: widget.result.protein,
      carbs: widget.result.carbs,
      fat: widget.result.fat,
      fiber: widget.result.fiber,
      sugar: widget.result.sugar,
      sodium: widget.result.sodium,
      quantityMultiplier: widget.result.quantityMultiplier,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: _result.isFromMenu 
            ? Border.all(color: Colors.green.withOpacity(0.3), width: 2)
            : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with food name and menu badge
            Row(
              children: [
                // Food icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _result.isFromMenu 
                      ? Colors.green.withOpacity(0.1)
                      : Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(
                    _result.isFromMenu ? Icons.restaurant : Icons.fastfood,
                    color: _result.isFromMenu ? Colors.green : Colors.orange,
                    size: 24,
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Food name
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _result.foodName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.analytics,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _result.confidencePercentage,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                if (_result.isFromMenu)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'MENU',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Quantity section with mode toggle and scroll wheel
            Column(
              children: [
                Row(
                  children: [
                    Icon(Icons.scale, size: 16, color: Colors.grey[700]),
                    const SizedBox(width: 4),
                    Text(
                      'Quantity: ${_result.quantityDisplay}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[800],
                      ),
                    ),
                    const Spacer(),
                    // Mode toggle (only show if count info is available)
                    if (_result.detectedCount != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _result.quantityMode = QuantityMode.count;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _result.quantityMode == QuantityMode.count
                                    ? Colors.blue
                                    : Colors.grey[300],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Count',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: _result.quantityMode == QuantityMode.count
                                      ? Colors.white
                                      : Colors.grey[700],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _result.quantityMode = QuantityMode.grams;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _result.quantityMode == QuantityMode.grams
                                    ? Colors.blue
                                    : Colors.grey[300],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Grams',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: _result.quantityMode == QuantityMode.grams
                                      ? Colors.white
                                      : Colors.grey[700],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                // Scroll wheel quantity adjustment
                _buildScrollWheelQuantityAdjuster(),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Nutrition info
            if (_result.adjustedCalories != null || 
                _result.adjustedProtein != null ||
                _result.adjustedCarbs != null ||
                _result.adjustedFat != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    if (_result.adjustedCalories != null)
                      _buildNutritionItem(
                        'Calories',
                        _result.adjustedCalories!.toStringAsFixed(0),
                        Colors.orange,
                      ),
                    if (_result.adjustedProtein != null)
                      _buildNutritionItem(
                        'Protein',
                        '${_result.adjustedProtein!.toStringAsFixed(1)}g',
                        Colors.blue,
                      ),
                    if (_result.adjustedCarbs != null)
                      _buildNutritionItem(
                        'Carbs',
                        '${_result.adjustedCarbs!.toStringAsFixed(1)}g',
                        Colors.green,
                      ),
                    if (_result.adjustedFat != null)
                      _buildNutritionItem(
                        'Fat',
                        '${_result.adjustedFat!.toStringAsFixed(1)}g',
                        Colors.purple,
                      ),
                  ],
                ),
              ),
            
            const SizedBox(height: 12),
            
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: widget.onTap,
                    icon: const Icon(Icons.info_outline, size: 18),
                    label: const Text('Details'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: widget.onLogFood != null
                        ? () => widget.onLogFood!(_result)
                        : null,
                    icon: const Icon(Icons.add_circle, size: 18),
                    label: const Text('Add to Log'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildNutritionItem(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
  
  Widget _buildScrollWheelQuantityAdjuster() {
    return GestureDetector(
      onVerticalDragUpdate: (details) {
        setState(() {
          // Determine step size based on mode
          final step = _result.quantityMode == QuantityMode.count ? 1.0 : 0.1;
          // Invert drag direction: drag up increases, drag down decreases
          final delta = -details.delta.dy / 10.0; // Scale down for smoother control
          final newMultiplier = (_result.quantityMultiplier + (delta * step)).clamp(0.1, 100.0);
          _result.quantityMultiplier = newMultiplier;
        });
      },
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.remove, color: Colors.grey[600], size: 20),
            const SizedBox(width: 16),
            Container(
              width: 80,
              alignment: Alignment.center,
              child: Text(
                _result.quantityMode == QuantityMode.count
                    ? _result.quantityMultiplier.toInt().toString()
                    : _result.quantityMultiplier.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Icon(Icons.add, color: Colors.grey[600], size: 20),
          ],
        ),
      ),
    );
  }
}
