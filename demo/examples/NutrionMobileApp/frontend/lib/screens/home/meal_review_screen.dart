import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/food_recognition_service.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../widgets/meal_review_item_card.dart';
import '../../widgets/manual_food_entry_dialog.dart';
import 'dashboard_screen.dart';

class MealReviewScreen extends StatefulWidget {
  final List<FoodRecognitionResult> recognitionResults;
  final Uint8List? imageBytes;

  const MealReviewScreen({
    super.key,
    required this.recognitionResults,
    this.imageBytes,
  });

  @override
  State<MealReviewScreen> createState() => _MealReviewScreenState();
}

class _MealReviewScreenState extends State<MealReviewScreen> {
  late List<FoodRecognitionResult> _results;
  bool _isSaving = false;
  bool _isRetrying = false;
  final Set<int> _manuallyAddedIndices = {}; // Track manually added foods

  @override
  void initState() {
    super.initState();
    // Create mutable copies of results
    _results = widget.recognitionResults.map((result) {
      return FoodRecognitionResult(
        foodName: result.foodName,
        confidence: result.confidence,
        isFromMenu: result.isFromMenu,
        menuItem: result.menuItem,
        estimatedWeightGrams: result.estimatedWeightGrams,
        estimatedVolumeCm3: result.estimatedVolumeCm3,
        quantityUnit: result.quantityUnit,
        detectedCount: result.detectedCount,
        detectedUnit: result.detectedUnit,
        detectedSizeLabel: result.detectedSizeLabel,
        quantityMode: result.quantityMode,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sugar: result.sugar,
        sodium: result.sodium,
        quantityMultiplier: result.quantityMultiplier,
      );
    }).toList();
  }

  void _onQuantityChanged(int index, FoodRecognitionResult updatedResult) {
    setState(() {
      _results[index] = updatedResult;
    });
  }

  void _removeItem(int index) {
    setState(() {
      _results.removeAt(index);
    });
  }

  double _getTotalCalories() {
    return _results.fold<double>(
      0.0,
      (sum, result) => sum + (result.adjustedCalories ?? 0.0),
    );
  }

  double _getTotalProtein() {
    return _results.fold<double>(
      0.0,
      (sum, result) => sum + (result.adjustedProtein ?? 0.0),
    );
  }

  double _getTotalCarbs() {
    return _results.fold<double>(
      0.0,
      (sum, result) => sum + (result.adjustedCarbs ?? 0.0),
    );
  }

  double _getTotalFat() {
    return _results.fold<double>(
      0.0,
      (sum, result) => sum + (result.adjustedFat ?? 0.0),
    );
  }

  Future<void> _saveToLog() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated || authProvider.token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in to save food to your daily log'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    if (_results.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No food items to save'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      int successCount = 0;
      int failCount = 0;

      for (final result in _results) {
        try {
          await ApiService.createNutritionEntry(
            token: authProvider.token!,
            foodName: result.foodName,
            calories: result.adjustedCalories,
            protein: result.adjustedProtein,
            carbs: result.adjustedCarbs,
            fat: result.adjustedFat,
            fiber: result.adjustedFiber,
            sugar: result.adjustedSugar,
            sodium: result.adjustedSodium,
            quantity: result.quantityMultiplier,
            quantityUnit: result.quantityUnit,
          );
          successCount++;
        } catch (e) {
          failCount++;
          if (kDebugMode) {
            print('Error saving ${result.foodName}: $e');
          }
        }
      }

      // Refresh daily entries
      final nutritionProvider = context.read<NutritionProvider>();
      await nutritionProvider.refreshDailyEntries(authProvider.token!);

      if (mounted) {
        setState(() {
          _isSaving = false;
        });

        if (failCount == 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '✓ Successfully saved ${successCount} item${successCount != 1 ? 's' : ''} to your daily log!',
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
              action: SnackBarAction(
                label: 'View Dashboard',
                textColor: Colors.white,
                onPressed: () {
                  _navigateToDashboard();
                },
              ),
            ),
          );
          // Navigate to dashboard after a short delay
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) {
              _navigateToDashboard();
            }
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Saved $successCount item${successCount != 1 ? 's' : ''}, but $failCount failed',
              ),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save food to log: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _navigateToDashboard() {
    // Use the static callback to switch to dashboard tab
    DashboardScreen.switchToDashboard();
    // Pop back to dashboard
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _retakePhoto() {
    Navigator.of(context).pop();
  }

  Future<void> _addFoodManually() async {
    final result = await showDialog<FoodRecognitionResult>(
      context: context,
      builder: (context) => const ManualFoodEntryDialog(),
    );

    if (result != null) {
      setState(() {
        _results.add(result);
        _manuallyAddedIndices.add(_results.length - 1);
      });
    }
  }

  Future<void> _retryAnalysis() async {
    if (widget.imageBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No image available for retry'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Collect hints from manually added foods
    final hints = <String>[];
    for (int i = 0; i < _results.length; i++) {
      if (_manuallyAddedIndices.contains(i)) {
        hints.add(_results[i].foodName);
      }
    }

    if (hints.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add foods manually first to use as hints'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isRetrying = true;
    });

    try {
      final foodService = FoodRecognitionService();
      await foodService.initialize();

      // Retry recognition with hints
      final newResults = await foodService.recognizeFood(
        widget.imageBytes!,
        location: 'graceland',
        mealType: null,
        hints: hints,
      );

      // Merge new results with existing manually added foods
      setState(() {
        // Keep manually added foods
        final manuallyAdded = _results
            .asMap()
            .entries
            .where((e) => _manuallyAddedIndices.contains(e.key))
            .map((e) => e.value)
            .toList();

        // Add new photo results
        _results = [...manuallyAdded, ...newResults];
        
        // Update manually added indices
        _manuallyAddedIndices.clear();
        for (int i = 0; i < manuallyAdded.length; i++) {
          _manuallyAddedIndices.add(i);
        }

        _isRetrying = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Analysis retried with hints'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isRetrying = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to retry analysis: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Review Meal',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.grey),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _results.isEmpty
          ? _buildEmptyState()
          : Column(
              children: [
                // Image preview
                if (widget.imageBytes != null) _buildImagePreview(),
                // Food items list
                Expanded(
                  child: _buildFoodList(),
                ),
                // Summary and actions
                _buildSummaryAndActions(),
              ],
            ),
    );
  }

  Widget _buildImagePreview() {
    return Container(
      height: 200,
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.memory(
          widget.imageBytes!,
          fit: BoxFit.cover,
        ),
      ),
    );
  }

  Widget _buildFoodList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Icon(
                Icons.restaurant,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(width: 8),
              Text(
                'Foods (${_results.length})',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _results.length,
            itemBuilder: (context, index) {
              return MealReviewItemCard(
                result: _results[index],
                onRemove: () {
                  _manuallyAddedIndices.remove(index);
                  _removeItem(index);
                  // Update indices after removal
                  final newIndices = <int>{};
                  for (final idx in _manuallyAddedIndices) {
                    if (idx > index) {
                      newIndices.add(idx - 1);
                    } else if (idx < index) {
                      newIndices.add(idx);
                    }
                  }
                  _manuallyAddedIndices.clear();
                  _manuallyAddedIndices.addAll(newIndices);
                },
                onQuantityChanged: (updatedResult) {
                  _onQuantityChanged(index, updatedResult);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryAndActions() {
    final totalCalories = _getTotalCalories();
    final totalProtein = _getTotalProtein();
    final totalCarbs = _getTotalCarbs();
    final totalFat = _getTotalFat();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Nutrition summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Total Nutrition',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildSummaryItem(
                      'Calories',
                      totalCalories.toStringAsFixed(0),
                      Colors.orange,
                    ),
                    _buildSummaryItem(
                      'Protein',
                      '${totalProtein.toStringAsFixed(1)}g',
                      Colors.blue,
                    ),
                    _buildSummaryItem(
                      'Carbs',
                      '${totalCarbs.toStringAsFixed(1)}g',
                      Colors.green,
                    ),
                    _buildSummaryItem(
                      'Fat',
                      '${totalFat.toStringAsFixed(1)}g',
                      Colors.purple,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Action buttons
          if (widget.imageBytes != null && _manuallyAddedIndices.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: (_isSaving || _isRetrying) ? null : _retryAnalysis,
                  icon: _isRetrying
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh),
                  label: Text(_isRetrying ? 'Retrying...' : 'Retry Analysis with Hints'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: (_isSaving || _isRetrying) ? null : _retakePhoto,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Retake Photo'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: (_isSaving || _isRetrying) ? null : _addFoodManually,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Food'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: (_isSaving || _isRetrying) ? null : _saveToLog,
                  icon: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.check_circle),
                  label: Text(_isSaving ? 'Saving...' : 'Save to Log'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.restaurant_menu,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No food items detected',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try taking another photo',
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _retakePhoto,
            icon: const Icon(Icons.camera_alt),
            label: const Text('Retake Photo'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
