import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../services/food_recognition_service.dart';
import '../services/api_service.dart';
import 'food_search_dialog.dart';

class ManualFoodEntryDialog extends StatefulWidget {
  final String? location;
  final String? mealType;
  final Function(FoodRecognitionResult)? onFoodAdded;

  const ManualFoodEntryDialog({
    super.key,
    this.location,
    this.mealType,
    this.onFoodAdded,
  });

  @override
  State<ManualFoodEntryDialog> createState() => _ManualFoodEntryDialogState();
}

class _ManualFoodEntryDialogState extends State<ManualFoodEntryDialog> {
  final _formKey = GlobalKey<FormState>();
  final _foodNameController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _fiberController = TextEditingController();
  final _sugarController = TextEditingController();
  final _sodiumController = TextEditingController();
  final _quantityController = TextEditingController(text: '1.0');
  
  QuantityMode _quantityMode = QuantityMode.grams;
  bool _isSearchMode = true;

  @override
  void dispose() {
    _foodNameController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    _fiberController.dispose();
    _sugarController.dispose();
    _sodiumController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _showFoodSearch() async {
    final result = await showDialog<FoodSearchResult>(
      context: context,
      builder: (context) => FoodSearchDialog(
        location: widget.location,
        mealType: widget.mealType,
      ),
    );

    if (result != null) {
      // Pre-fill form with search result
      setState(() {
        _foodNameController.text = result.foodName;
        // Store base nutrition values (per 100g) for calculation
        // Backend returns nutrition per 100g for both menu items and USDA foods
        _baseCalories = result.calories;
        _baseProtein = result.protein;
        _baseCarbs = result.carbs;
        _baseFat = result.fat;
        _baseFiber = result.fiber;
        _baseSugar = result.sugar;
        _baseSodium = result.sodium;
        
        // Set default quantity based on mode
        if (_quantityMode == QuantityMode.grams) {
          _quantityController.text = '100.0'; // Default to 100g for grams mode
        } else {
          _quantityController.text = '1.0'; // Default to 1 item for count mode
        }
        
        // Calculate nutrition based on current quantity
        // Force recalculation by calling setState again if needed
        _updateNutritionFromQuantity();
        _isSearchMode = false;
      });
      
      // Ensure calculation happens after state update
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _updateNutritionFromQuantity();
          });
        }
      });
    }
  }
  
  // Store base nutrition values (per 100g) from search result
  double? _baseCalories;
  double? _baseProtein;
  double? _baseCarbs;
  double? _baseFat;
  double? _baseFiber;
  double? _baseSugar;
  double? _baseSodium;
  
  // Update nutrition values based on quantity
  void _updateNutritionFromQuantity() {
    // Check if we have any base values to calculate from
    final hasBaseValues = _baseCalories != null || _baseProtein != null || 
                         _baseCarbs != null || _baseFat != null ||
                         _baseFiber != null || _baseSugar != null || _baseSodium != null;
    
    if (!hasBaseValues) {
      // Clear nutrition fields if no base values
      if (_baseCalories == null) _caloriesController.clear();
      if (_baseProtein == null) _proteinController.clear();
      if (_baseCarbs == null) _carbsController.clear();
      if (_baseFat == null) _fatController.clear();
      if (_baseFiber == null) _fiberController.clear();
      if (_baseSugar == null) _sugarController.clear();
      if (_baseSodium == null) _sodiumController.clear();
      return;
    }
    
    final quantity = double.tryParse(_quantityController.text) ?? 1.0;
    if (quantity <= 0) {
      return; // Invalid quantity
    }
    
    double multiplier;
    
    if (_quantityMode == QuantityMode.grams) {
      // For grams mode: nutrition is per 100g, so divide quantity by 100
      // Example: 200g of food = 200/100 = 2.0x the per-100g values
      multiplier = quantity / 100.0;
    } else {
      // For count mode: use typical weights per unit
      // Then convert to grams and divide by 100 to get multiplier
      double typicalWeightPerUnit = 100.0; // Default 100g per item
      
      // Try to estimate based on food name (simplified)
      final foodName = _foodNameController.text.toLowerCase();
      if (foodName.contains('egg')) {
        typicalWeightPerUnit = 50.0; // ~50g per egg
      } else if (foodName.contains('apple') || foodName.contains('banana')) {
        typicalWeightPerUnit = 150.0; // ~150g per fruit
      } else if (foodName.contains('slice') || foodName.contains('bread')) {
        typicalWeightPerUnit = 30.0; // ~30g per slice
      } else if (foodName.contains('cup')) {
        typicalWeightPerUnit = 240.0; // ~240g per cup
      } else if (foodName.contains('piece') || foodName.contains('item')) {
        typicalWeightPerUnit = 100.0; // Default 100g per piece
      }
      
      // Calculate total grams: quantity * weight per unit
      // Then divide by 100 to get multiplier (since nutrition is per 100g)
      final totalGrams = quantity * typicalWeightPerUnit;
      multiplier = totalGrams / 100.0;
    }
    
    // Update nutrition fields with calculated values
    // Only update fields that have base values
    if (_baseCalories != null) {
      final calculated = _baseCalories! * multiplier;
      _caloriesController.text = calculated.toStringAsFixed(0);
    } else {
      _caloriesController.clear();
    }
    
    if (_baseProtein != null) {
      final calculated = _baseProtein! * multiplier;
      _proteinController.text = calculated.toStringAsFixed(1);
    } else {
      _proteinController.clear();
    }
    
    if (_baseCarbs != null) {
      final calculated = _baseCarbs! * multiplier;
      _carbsController.text = calculated.toStringAsFixed(1);
    } else {
      _carbsController.clear();
    }
    
    if (_baseFat != null) {
      final calculated = _baseFat! * multiplier;
      _fatController.text = calculated.toStringAsFixed(1);
    } else {
      _fatController.clear();
    }
    
    if (_baseFiber != null) {
      final calculated = _baseFiber! * multiplier;
      _fiberController.text = calculated.toStringAsFixed(1);
    } else {
      _fiberController.clear();
    }
    
    if (_baseSugar != null) {
      final calculated = _baseSugar! * multiplier;
      _sugarController.text = calculated.toStringAsFixed(1);
    } else {
      _sugarController.clear();
    }
    
    if (_baseSodium != null) {
      final calculated = _baseSodium! * multiplier;
      _sodiumController.text = calculated.toStringAsFixed(0);
    } else {
      _sodiumController.clear();
    }
  }

  void _createFoodRecognitionResult() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final foodName = _foodNameController.text.trim();
    if (foodName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a food name')),
      );
      return;
    }

    // Parse nutrition values
    final calories = double.tryParse(_caloriesController.text);
    final protein = double.tryParse(_proteinController.text);
    final carbs = double.tryParse(_carbsController.text);
    final fat = double.tryParse(_fatController.text);
    final fiber = double.tryParse(_fiberController.text);
    final sugar = double.tryParse(_sugarController.text);
    final sodium = double.tryParse(_sodiumController.text);
    final quantity = double.tryParse(_quantityController.text) ?? 1.0;

    // Calculate nutrition per 100g from entered values and quantity
    // This is needed to save to the database (which stores per 100g)
    double? caloriesPer100g;
    double? proteinPer100g;
    double? carbsPer100g;
    double? fatPer100g;
    double? fiberPer100g;
    double? sugarPer100g;
    double? sodiumPer100g;
    
    if (_quantityMode == QuantityMode.grams && quantity > 0) {
      // For grams mode: nutrition values are already for the entered quantity
      // Convert to per 100g
      final multiplier = 100.0 / quantity;
      if (calories != null) caloriesPer100g = calories * multiplier;
      if (protein != null) proteinPer100g = protein * multiplier;
      if (carbs != null) carbsPer100g = carbs * multiplier;
      if (fat != null) fatPer100g = fat * multiplier;
      if (fiber != null) fiberPer100g = fiber * multiplier;
      if (sugar != null) sugarPer100g = sugar * multiplier;
      if (sodium != null) sodiumPer100g = sodium * multiplier;
    } else if (_quantityMode == QuantityMode.count && quantity > 0) {
      // For count mode: estimate typical weight per unit, then convert to per 100g
      double typicalWeightPerUnit = 100.0; // Default
      final foodNameLower = foodName.toLowerCase();
      if (foodNameLower.contains('egg')) {
        typicalWeightPerUnit = 50.0;
      } else if (foodNameLower.contains('apple') || foodNameLower.contains('banana')) {
        typicalWeightPerUnit = 150.0;
      } else if (foodNameLower.contains('slice') || foodNameLower.contains('bread')) {
        typicalWeightPerUnit = 30.0;
      } else if (foodNameLower.contains('cup')) {
        typicalWeightPerUnit = 240.0;
      }
      
      final totalGrams = quantity * typicalWeightPerUnit;
      final multiplier = 100.0 / totalGrams;
      if (calories != null) caloriesPer100g = calories * multiplier;
      if (protein != null) proteinPer100g = protein * multiplier;
      if (carbs != null) carbsPer100g = carbs * multiplier;
      if (fat != null) fatPer100g = fat * multiplier;
      if (fiber != null) fiberPer100g = fiber * multiplier;
      if (sugar != null) sugarPer100g = sugar * multiplier;
      if (sodium != null) sodiumPer100g = sodium * multiplier;
    } else if (_baseCalories != null || _baseProtein != null) {
      // If we have base values (from search), use those (already per 100g)
      caloriesPer100g = _baseCalories;
      proteinPer100g = _baseProtein;
      carbsPer100g = _baseCarbs;
      fatPer100g = _baseFat;
      fiberPer100g = _baseFiber;
      sugarPer100g = _baseSugar;
      sodiumPer100g = _baseSodium;
    }

    // Try to extract brand from food name (e.g., "Pizza Hut 12 inch pepperoni pizza")
    String? brand;
    final brandPatterns = ['pizza hut', 'domino', 'papa john', 'mcdonald', 'burger king', 
                          'wendy', 'subway', 'kfc', 'taco bell', 'chipotle'];
    final foodNameLower = foodName.toLowerCase();
    for (final pattern in brandPatterns) {
      if (foodNameLower.contains(pattern)) {
        brand = pattern.split(' ').map((w) => w[0].toUpperCase() + w.substring(1)).join(' ');
        break;
      }
    }

    // Save to custom foods database (silently, don't block user)
    // This will fail if migration hasn't run yet, but that's OK
    try {
      final response = await ApiService.saveCustomFood(
        foodName: foodName,
        caloriesPer100g: caloriesPer100g,
        proteinPer100g: proteinPer100g,
        carbsPer100g: carbsPer100g,
        fatPer100g: fatPer100g,
        fiberPer100g: fiberPer100g,
        sugarPer100g: sugarPer100g,
        sodiumPer100g: sodiumPer100g,
        brand: brand,
        category: null,
        description: null,
      );
      
      // Check if it's a migration pending error (503) - this is expected and OK
      if (response['error'] == 'MIGRATION_PENDING' || 
          response['success'] == false && 
          response['message']?.toString().contains('migration') == true) {
        // Migration hasn't run yet - this is fine, just skip saving
        // The food will still be added to the meal log
        if (kDebugMode) {
          print('Custom foods table not available yet (migration pending) - food will still be added to meal log');
        }
      }
    } catch (e) {
      // Silently fail - don't block user from adding food
      // This could be network error, 503 (migration pending), or other issues
      // All are OK - the food will still be added to the meal log
      if (kDebugMode) {
        print('Failed to save custom food (non-blocking): $e');
      }
    }

    // Create FoodRecognitionResult
    final result = FoodRecognitionResult(
      foodName: foodName,
      confidence: 1.0, // Manual entry is 100% confident
      isFromMenu: false,
      estimatedWeightGrams: _quantityMode == QuantityMode.grams ? quantity : null,
      detectedCount: _quantityMode == QuantityMode.count ? quantity.toInt() : null,
      detectedUnit: _quantityMode == QuantityMode.count ? 'item' : null,
      quantityMode: _quantityMode,
      quantityMultiplier: quantity,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      fiber: fiber,
      sugar: sugar,
      sodium: sodium,
    );

    if (widget.onFoodAdded != null) {
      widget.onFoodAdded!(result);
    }

    Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    if (_isSearchMode) {
      return Dialog(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search, size: 64, color: Colors.blue),
              const SizedBox(height: 16),
              const Text(
                'Search for Food',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Search our database first, or enter manually',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _showFoodSearch,
                icon: const Icon(Icons.search),
                label: const Text('Search Food'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  setState(() {
                    _isSearchMode = false;
                  });
                },
                child: const Text('Enter Manually Instead'),
              ),
            ],
          ),
        ),
      );
    }

    return Dialog(
      child: SingleChildScrollView(
        child: Container(
          width: MediaQuery.of(context).size.width * 0.9,
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Add Food Manually',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Food name
                TextFormField(
                  controller: _foodNameController,
                  decoration: const InputDecoration(
                    labelText: 'Food Name *',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter a food name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Quantity mode toggle
                Row(
                  children: [
                    const Text('Quantity Mode:', style: TextStyle(fontWeight: FontWeight.w500)),
                    const SizedBox(width: 16),
                    ToggleButtons(
                      isSelected: [
                        _quantityMode == QuantityMode.count,
                        _quantityMode == QuantityMode.grams,
                      ],
                      onPressed: (index) {
                        setState(() {
                          _quantityMode = index == 0 ? QuantityMode.count : QuantityMode.grams;
                          _updateNutritionFromQuantity();
                        });
                      },
                      children: const [
                        Text('Count'),
                        Text('Grams'),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Quantity
                TextFormField(
                  controller: _quantityController,
                  decoration: InputDecoration(
                    labelText: _quantityMode == QuantityMode.count ? 'Count *' : 'Grams *',
                    border: const OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (value) {
                    // Recalculate nutrition when quantity changes
                    if (_baseCalories != null || _baseProtein != null) {
                      setState(() {
                        _updateNutritionFromQuantity();
                      });
                    }
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a quantity';
                    }
                    if (double.tryParse(value) == null) {
                      return 'Please enter a valid number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                const Text(
                  'Nutrition Information (optional)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                // Nutrition fields in a grid
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _caloriesController,
                        decoration: const InputDecoration(
                          labelText: 'Calories',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _proteinController,
                        decoration: const InputDecoration(
                          labelText: 'Protein (g)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _carbsController,
                        decoration: const InputDecoration(
                          labelText: 'Carbs (g)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _fatController,
                        decoration: const InputDecoration(
                          labelText: 'Fat (g)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _fiberController,
                        decoration: const InputDecoration(
                          labelText: 'Fiber (g)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _sugarController,
                        decoration: const InputDecoration(
                          labelText: 'Sugar (g)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _sodiumController,
                  decoration: const InputDecoration(
                    labelText: 'Sodium (mg)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _createFoodRecognitionResult,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Add Food'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

