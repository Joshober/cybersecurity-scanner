import 'package:flutter/material.dart';
import '../services/food_recognition_service.dart';

// Import QuantityMode enum

class MealReviewItemCard extends StatefulWidget {
  final FoodRecognitionResult result;
  final VoidCallback? onRemove;
  final ValueChanged<FoodRecognitionResult>? onQuantityChanged;

  const MealReviewItemCard({
    super.key,
    required this.result,
    this.onRemove,
    this.onQuantityChanged,
  });

  @override
  State<MealReviewItemCard> createState() => _MealReviewItemCardState();
}

class _MealReviewItemCardState extends State<MealReviewItemCard> {
  late FoodRecognitionResult _result;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
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

  void _updateQuantity(double delta) {
    setState(() {
      final newMultiplier =
          (_result.quantityMultiplier + delta).clamp(0.1, 10.0);
      _result = FoodRecognitionResult(
        foodName: _result.foodName,
        confidence: _result.confidence,
        isFromMenu: _result.isFromMenu,
        menuItem: _result.menuItem,
        estimatedWeightGrams: _result.estimatedWeightGrams,
        estimatedVolumeCm3: _result.estimatedVolumeCm3,
        quantityUnit: _result.quantityUnit,
        detectedCount: _result.detectedCount,
        detectedUnit: _result.detectedUnit,
        detectedSizeLabel: _result.detectedSizeLabel,
        quantityMode: _result.quantityMode,
        calories: _result.calories,
        protein: _result.protein,
        carbs: _result.carbs,
        fat: _result.fat,
        fiber: _result.fiber,
        sugar: _result.sugar,
        sodium: _result.sodium,
        quantityMultiplier: newMultiplier,
      );
    });
    widget.onQuantityChanged?.call(_result);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: _result.isFromMenu
              ? Border.all(color: Colors.green.withOpacity(0.3), width: 2)
              : null,
        ),
        child: Column(
          children: [
            // Header - always visible
            InkWell(
              onTap: () {
                setState(() {
                  _isExpanded = !_isExpanded;
                });
              },
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
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
                        color:
                            _result.isFromMenu ? Colors.green : Colors.orange,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Food name and info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _result.foodName,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (_result.isFromMenu)
                                Container(
                                  margin: const EdgeInsets.only(left: 8),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'MENU',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
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
                              const SizedBox(width: 12),
                              Icon(
                                Icons.scale,
                                size: 14,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _result.quantityDisplay,
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Expand/collapse icon
                    Icon(
                      _isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: Colors.grey[600],
                    ),
                  ],
                ),
              ),
            ),
            // Expandable content
            if (_isExpanded) ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quantity adjustment with mode toggle
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Quantity:',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _result.quantityDisplay,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
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
                        const SizedBox(height: 12),
                        // Scroll wheel quantity adjustment
                        _buildScrollWheelQuantityAdjuster(),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Nutrition information
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
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Nutrition Information',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 16,
                              runSpacing: 12,
                              children: [
                                if (_result.adjustedCalories != null)
                                  _buildNutritionChip(
                                    'Calories',
                                    _result.adjustedCalories!
                                        .toStringAsFixed(0),
                                    'kcal',
                                    Colors.orange,
                                  ),
                                if (_result.adjustedProtein != null)
                                  _buildNutritionChip(
                                    'Protein',
                                    _result.adjustedProtein!.toStringAsFixed(1),
                                    'g',
                                    Colors.blue,
                                  ),
                                if (_result.adjustedCarbs != null)
                                  _buildNutritionChip(
                                    'Carbs',
                                    _result.adjustedCarbs!.toStringAsFixed(1),
                                    'g',
                                    Colors.green,
                                  ),
                                if (_result.adjustedFat != null)
                                  _buildNutritionChip(
                                    'Fat',
                                    _result.adjustedFat!.toStringAsFixed(1),
                                    'g',
                                    Colors.purple,
                                  ),
                                if (_result.adjustedFiber != null)
                                  _buildNutritionChip(
                                    'Fiber',
                                    _result.adjustedFiber!.toStringAsFixed(1),
                                    'g',
                                    Colors.brown,
                                  ),
                                if (_result.adjustedSugar != null)
                                  _buildNutritionChip(
                                    'Sugar',
                                    _result.adjustedSugar!.toStringAsFixed(1),
                                    'g',
                                    Colors.pink,
                                  ),
                                if (_result.adjustedSodium != null)
                                  _buildNutritionChip(
                                    'Sodium',
                                    _result.adjustedSodium!.toStringAsFixed(0),
                                    'mg',
                                    Colors.teal,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    // Remove button
                    if (widget.onRemove != null) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: widget.onRemove,
                          icon: const Icon(Icons.delete_outline, size: 18),
                          label: const Text('Remove Item'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNutritionChip(
    String label,
    String value,
    String unit,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(width: 2),
              Text(
                unit,
                style: TextStyle(
                  fontSize: 11,
                  color: color.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildScrollWheelQuantityAdjuster() {
    return GestureDetector(
      onVerticalDragUpdate: (details) {
        // Determine step size based on mode
        final step = _result.quantityMode == QuantityMode.count ? 1.0 : 0.1;
        // Invert drag direction: drag up increases, drag down decreases
        final delta = -details.delta.dy / 10.0; // Scale down for smoother control
        _updateQuantity(delta * step);
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



