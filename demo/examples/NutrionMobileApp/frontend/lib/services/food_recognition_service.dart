import 'dart:typed_data';
import 'api_service.dart';
import '../models/menu_item.dart';
import '../models/dining_hall_menu.dart';

class FoodRecognitionService {
  // TODO: Implement TensorFlow Lite model loading
  // static const String _modelPath = 'assets/models/food_classifier.tflite';

  // TODO: Implement label loading for TensorFlow Lite
  // List<String> _labels = [];
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // TODO: Load labels when implementing TensorFlow Lite
      // final labelsData = await rootBundle.loadString(_labelsPath);
      // _labels = labelsData.split('\n').map((label) => label.trim()).toList();

      _isInitialized = true;
      print('Food recognition service initialized successfully with cloud API');
    } catch (e) {
      print('Error initializing food recognition service: $e');
      // For development, we'll use a mock implementation
      _isInitialized = true;
    }
  }

  Future<List<FoodRecognitionResult>> recognizeFood(
    Uint8List imageBytes, {
    DiningHallMenu? currentMenu,
    String? location,
    String? mealType,
    List<String>? hints,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    // Always use backend API recognition - no fallbacks to mock
    return await _recognizeWithBackendAPI(
        imageBytes, currentMenu, location, mealType, hints);
  }

  Future<List<FoodRecognitionResult>> _recognizeWithBackendAPI(
    Uint8List imageBytes,
    DiningHallMenu? currentMenu,
    String? location,
    String? mealType,
    List<String>? hints,
  ) async {
    // Call the backend API directly with image bytes
    final response = await ApiService.analyzePortion(
      imageFile: imageBytes, // Pass bytes directly for web compatibility
      location: location ?? 'graceland',
      date: DateTime.now(),
      mealType: mealType,
      hints: hints,
    );

    if (response['success'] == true) {
      return _parseBackendResponse(response, currentMenu);
    } else {
      throw Exception('Backend API returned error: ${response['message']}');
    }
  }

  List<FoodRecognitionResult> _parseBackendResponse(
    Map<String, dynamic> response,
    DiningHallMenu? currentMenu,
  ) {
    final results = <FoodRecognitionResult>[];

    try {
      final analysisResult = response['analysisResult'];
      if (analysisResult != null) {
        // Parse the new backend response format
        final foodRecognitions = analysisResult['foodRecognitions'] as List?;

        if (foodRecognitions != null) {
          for (final recognition in foodRecognitions) {
            final foodName = recognition['detectedFoodName'] ?? 'Unknown';
            final confidence =
                (recognition['confidenceScore'] ?? 0.0).toDouble();
            final isFromMenu = recognition['isFromMenu'] ?? false;
            
            // Parse quantity information
            final estimatedWeightGrams = recognition['estimatedWeightGrams'] != null
                ? (recognition['estimatedWeightGrams'] as num).toDouble()
                : null;
            final estimatedVolumeCm3 = recognition['estimatedVolumeCm3'] != null
                ? (recognition['estimatedVolumeCm3'] as num).toDouble()
                : null;
            
            // Parse count-based quantity information
            final detectedCount = recognition['detectedCount'] != null
                ? (recognition['detectedCount'] as num).toInt()
                : null;
            final detectedUnit = recognition['detectedUnit'] as String?;
            final detectedSizeLabel = recognition['detectedSizeLabel'] as String?;
            
            // Parse nutrition estimates
            final nutritionEstimates = recognition['nutritionEstimates'] as List?;
            double? calories;
            double? protein;
            double? carbs;
            double? fat;
            double? fiber;
            double? sugar;
            double? sodium;
            
            if (nutritionEstimates != null) {
              for (final estimate in nutritionEstimates) {
                final nutrientName = estimate['nutrientName'] as String?;
                final amount = estimate['estimatedAmount'] != null
                    ? (estimate['estimatedAmount'] as num).toDouble()
                    : null;
                
                if (nutrientName != null && amount != null) {
                  switch (nutrientName.toLowerCase()) {
                    case 'calories':
                      calories = amount;
                      break;
                    case 'protein':
                      protein = amount;
                      break;
                    case 'carbs':
                    case 'carbohydrates':
                      carbs = amount;
                      break;
                    case 'fat':
                      fat = amount;
                      break;
                    case 'fiber':
                      fiber = amount;
                      break;
                    case 'sugar':
                      sugar = amount;
                      break;
                    case 'sodium':
                      sodium = amount;
                      break;
                  }
                }
              }
            }
            
            // Try to get nutrition from menu item if available
            MenuItem? menuItem;
            if (isFromMenu && currentMenu != null) {
              final menuItems = currentMenu.getAllMenuItems();
              try {
                menuItem = menuItems.firstWhere(
                  (item) => item.name.toLowerCase().contains(foodName.toLowerCase()) ||
                      foodName.toLowerCase().contains(item.name.toLowerCase()),
                );
              } catch (e) {
                // No matching menu item found
                menuItem = null;
              }
              
              // Use menu item nutrition if available
              if (menuItem != null && menuItem.nutritionInfo != null) {
                final nutrition = menuItem.nutritionInfo!;
                calories ??= (nutrition['calories'] as num?)?.toDouble();
                protein ??= (nutrition['protein'] as num?)?.toDouble();
                carbs ??= (nutrition['carbs'] as num?)?.toDouble();
                fat ??= (nutrition['fat'] as num?)?.toDouble();
                fiber ??= (nutrition['fiber'] as num?)?.toDouble();
                sugar ??= (nutrition['sugar'] as num?)?.toDouble();
                sodium ??= (nutrition['sodium'] as num?)?.toDouble();
              }
            }

            // Initialize quantity multiplier with detected count if available, otherwise default to 1.0
            final initialMultiplier = detectedCount != null ? detectedCount.toDouble() : 1.0;
            // Determine initial mode: use count mode if count is detected, otherwise grams
            final initialMode = detectedCount != null ? QuantityMode.count : QuantityMode.grams;
            
            results.add(FoodRecognitionResult(
              foodName: foodName,
              confidence: confidence,
              isFromMenu: isFromMenu,
              menuItem: menuItem,
              estimatedWeightGrams: estimatedWeightGrams,
              estimatedVolumeCm3: estimatedVolumeCm3,
              quantityUnit: estimatedWeightGrams != null ? 'g' : 'serving',
              detectedCount: detectedCount,
              detectedUnit: detectedUnit,
              detectedSizeLabel: detectedSizeLabel,
              quantityMode: initialMode,
              calories: calories,
              protein: protein,
              carbs: carbs,
              fat: fat,
              fiber: fiber,
              sugar: sugar,
              sodium: sodium,
              quantityMultiplier: initialMultiplier,
            ));
          }
        }

        // Fallback: try to parse old format if new format is not available
        if (results.isEmpty) {
          final classification = analysisResult['classification'];
          if (classification != null && classification['predictions'] != null) {
            final predictions = classification['predictions'] as List;

            for (final prediction in predictions) {
              results.add(FoodRecognitionResult(
                foodName: prediction['foodName'] ?? 'Unknown',
                confidence: (prediction['confidence'] ?? 0.0).toDouble(),
                isFromMenu: _isFromCurrentMenu(
                    prediction['foodName'] ?? 'Unknown', currentMenu),
                quantityMode: QuantityMode.grams,
                quantityMultiplier: 1.0,
              ));
            }
          }
        }
      }

      // If no results from backend, throw an error
      if (results.isEmpty) {
        throw Exception('No food recognition results returned from backend');
      }
    } catch (e) {
      print('Error parsing backend response: $e');
      rethrow; // Re-throw the error instead of falling back to mock
    }

    // Sort by confidence and prioritize menu items
    results.sort((a, b) {
      if (a.isFromMenu && !b.isFromMenu) return -1;
      if (!a.isFromMenu && b.isFromMenu) return 1;
      return b.confidence.compareTo(a.confidence);
    });

    return results.take(5).toList();
  }

  // Image preprocessing method (kept for future use with real models)
  // List<List<List<List<double>>>> _imageToByteListFloat32(img.Image image) {
  //   // This method is available for future TensorFlow Lite integration
  //   return [];
  // }

  bool _isFromCurrentMenu(String foodName, DiningHallMenu? currentMenu) {
    if (currentMenu == null) return false;

    final menuItems = currentMenu.getAllMenuItems();
    return menuItems.any((item) =>
        item.name.toLowerCase().contains(foodName.toLowerCase()) ||
        foodName.toLowerCase().contains(item.name.toLowerCase()));
  }

  void dispose() {
    _isInitialized = false;
  }
}

enum QuantityMode {
  count,
  grams,
}

class FoodRecognitionResult {
  final String foodName;
  final double confidence;
  final bool isFromMenu;
  final MenuItem? menuItem;
  
  // Quantity information
  final double? estimatedWeightGrams;
  final double? estimatedVolumeCm3;
  final String? quantityUnit;
  
  // Count-based quantity information (from backend)
  final int? detectedCount;
  final String? detectedUnit;
  final String? detectedSizeLabel;
  
  // Quantity mode (count or grams)
  QuantityMode quantityMode;
  
  // Nutrition information
  final double? calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double? sugar;
  final double? sodium;
  
  // Quantity multiplier (for user adjustment)
  double quantityMultiplier;

  FoodRecognitionResult({
    required this.foodName,
    required this.confidence,
    required this.isFromMenu,
    this.menuItem,
    this.estimatedWeightGrams,
    this.estimatedVolumeCm3,
    this.quantityUnit,
    this.detectedCount,
    this.detectedUnit,
    this.detectedSizeLabel,
    this.quantityMode = QuantityMode.grams,
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.sugar,
    this.sodium,
    this.quantityMultiplier = 1.0,
  });

  String get confidencePercentage =>
      '${(confidence * 100).toStringAsFixed(1)}%';
  
  // Convert count to grams using typical weights
  double? _getWeightFromCount() {
    if (quantityMode != QuantityMode.count || detectedCount == null || detectedUnit == null) {
      return null;
    }
    
    // Typical weights per unit (in grams) - matches backend TypicalWeightsService
    final typicalWeights = {
      'egg': 50.0,
      'slice': 25.0,
      'cup': 200.0,
      'piece': 75.0,
      'serving': 125.0,
      'item': 100.0,
    };
    
    final baseWeight = typicalWeights[detectedUnit!.toLowerCase()] ?? 100.0;
    
    // Size multipliers
    final sizeMultipliers = {
      'small': 0.8,
      'medium': 1.0,
      'large': 1.2,
    };
    
    final multiplier = sizeMultipliers[detectedSizeLabel?.toLowerCase() ?? 'medium'] ?? 1.0;
    
    return quantityMultiplier * baseWeight * multiplier;
  }
  
  // Get nutrition values adjusted by quantity multiplier
  // In count mode, converts count to weight first, then calculates nutrition
  double? get adjustedCalories {
    if (calories == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return calories! * quantityMultiplier;
      }
      // Scale nutrition based on weight ratio
      return calories! * (weightFromCount / estimatedWeightGrams!);
    }
    return calories! * quantityMultiplier;
  }
  
  double? get adjustedProtein {
    if (protein == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return protein! * quantityMultiplier;
      }
      return protein! * (weightFromCount / estimatedWeightGrams!);
    }
    return protein! * quantityMultiplier;
  }
  
  double? get adjustedCarbs {
    if (carbs == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return carbs! * quantityMultiplier;
      }
      return carbs! * (weightFromCount / estimatedWeightGrams!);
    }
    return carbs! * quantityMultiplier;
  }
  
  double? get adjustedFat {
    if (fat == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return fat! * quantityMultiplier;
      }
      return fat! * (weightFromCount / estimatedWeightGrams!);
    }
    return fat! * quantityMultiplier;
  }
  
  double? get adjustedFiber {
    if (fiber == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return fiber! * quantityMultiplier;
      }
      return fiber! * (weightFromCount / estimatedWeightGrams!);
    }
    return fiber! * quantityMultiplier;
  }
  
  double? get adjustedSugar {
    if (sugar == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return sugar! * quantityMultiplier;
      }
      return sugar! * (weightFromCount / estimatedWeightGrams!);
    }
    return sugar! * quantityMultiplier;
  }
  
  double? get adjustedSodium {
    if (sodium == null) return null;
    if (quantityMode == QuantityMode.count) {
      final weightFromCount = _getWeightFromCount();
      if (weightFromCount == null || estimatedWeightGrams == null || estimatedWeightGrams == 0) {
        return sodium! * quantityMultiplier;
      }
      return sodium! * (weightFromCount / estimatedWeightGrams!);
    }
    return sodium! * quantityMultiplier;
  }
  
  // Get formatted quantity string
  String get quantityDisplay {
    if (quantityMode == QuantityMode.count) {
      // Count mode: show count with unit
      final count = quantityMultiplier.toInt();
      final unit = detectedUnit ?? 'item';
      if (count == 1) {
        return '$count $unit';
      }
      return '$count ${unit}s';
    } else {
      // Gram mode: show weight
      if (estimatedWeightGrams != null) {
        if (estimatedWeightGrams! >= 1000) {
          return '${(estimatedWeightGrams! / 1000 * quantityMultiplier).toStringAsFixed(2)} kg';
        }
        return '${(estimatedWeightGrams! * quantityMultiplier).toStringAsFixed(0)} g';
      }
      if (quantityUnit != null) {
        return '${quantityMultiplier.toStringAsFixed(1)} $quantityUnit';
      }
      return '${quantityMultiplier.toStringAsFixed(1)} serving${quantityMultiplier != 1.0 ? 's' : ''}';
    }
  }

  @override
  String toString() {
    return 'FoodRecognitionResult(name: $foodName, confidence: $confidencePercentage, isFromMenu: $isFromMenu)';
  }
}
