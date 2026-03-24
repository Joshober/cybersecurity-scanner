import 'package:flutter/material.dart';
import '../models/nutrition_plan.dart';
import '../models/nutrition_calculation.dart';
import '../services/api_service.dart';

class NutritionProvider with ChangeNotifier {
  List<NutritionPlan> _nutritionPlans = [];
  NutritionCalculationResponse? _calculationResult;
  bool _isLoading = false;
  String? _error;

  // Daily nutrition entries
  List<Map<String, dynamic>> _dailyEntries = [];
  Map<String, dynamic>? _dailyTotals;
  bool _isLoadingEntries = false;

  List<NutritionPlan> get nutritionPlans => _nutritionPlans;
  NutritionCalculationResponse? get calculationResult => _calculationResult;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Map<String, dynamic>> get dailyEntries => _dailyEntries;
  Map<String, dynamic>? get dailyTotals => _dailyTotals;
  bool get isLoadingEntries => _isLoadingEntries;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  Future<void> loadAllNutritionPlans() async {
    _setLoading(true);
    _setError(null);

    try {
      _nutritionPlans = await ApiService.getAllNutritionPlans();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> searchNutritionPlans({
    String? age,
    String? sex,
    String? height,
    String? weight,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      _nutritionPlans = await ApiService.searchNutritionPlans(
        age: age,
        sex: sex,
        height: height,
        weight: weight,
      );
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> searchNutritionPlansByName(String name) async {
    _setLoading(true);
    _setError(null);

    try {
      _nutritionPlans = await ApiService.searchNutritionPlansByName(name);
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> calculateNutrition(NutritionCalculationRequest request) async {
    _setLoading(true);
    _setError(null);

    try {
      _calculationResult = await ApiService.calculateNutrition(request);
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  void clearError() {
    _setError(null);
  }

  void clearCalculationResult() {
    _calculationResult = null;
    notifyListeners();
  }

  // Daily nutrition entries methods

  Future<void> loadDailyEntries(String token, {DateTime? date}) async {
    _isLoadingEntries = true;
    notifyListeners();

    try {
      final entries = await ApiService.getNutritionEntries(
        token: token,
        date: date,
      );
      _dailyEntries = entries.cast<Map<String, dynamic>>();
      await loadDailyTotals(token, date: date);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoadingEntries = false;
      notifyListeners();
    }
  }

  Future<void> loadDailyTotals(String token, {DateTime? date}) async {
    try {
      _dailyTotals = await ApiService.getDailyTotals(
        token: token,
        date: date,
      );
      notifyListeners();
    } catch (e) {
      // Don't set error for totals, just log it
      print('Error loading daily totals: $e');
    }
  }

  Future<void> refreshDailyEntries(String token) async {
    await loadDailyEntries(token);
  }

  Future<void> updateEntry(
      String token, int entryId, Map<String, dynamic> updatedData) async {
    try {
      await ApiService.updateNutritionEntry(
        token: token,
        entryId: entryId,
        foodName: updatedData['foodName'] as String?,
        calories: updatedData['calories'] as double?,
        protein: updatedData['protein'] as double?,
        carbs: updatedData['carbs'] as double?,
        fat: updatedData['fat'] as double?,
        fiber: updatedData['fiber'] as double?,
        sugar: updatedData['sugar'] as double?,
        sodium: updatedData['sodium'] as double?,
      );
      // Refresh entries and totals
      await loadDailyEntries(token);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteEntry(String token, int entryId) async {
    try {
      await ApiService.deleteNutritionEntry(token: token, entryId: entryId);
      // Remove from local list
      _dailyEntries.removeWhere((entry) => entry['id'] == entryId);
      // Refresh totals
      await loadDailyTotals(token);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Weekly entries
  List<Map<String, dynamic>> _weeklyEntries = [];
  Map<String, dynamic>? _weeklyData;
  bool _isLoadingWeekly = false;

  List<Map<String, dynamic>> get weeklyEntries => _weeklyEntries;
  Map<String, dynamic>? get weeklyData => _weeklyData;
  bool get isLoadingWeekly => _isLoadingWeekly;

  Future<void> loadWeeklyEntries(String token, {DateTime? startDate}) async {
    _isLoadingWeekly = true;
    notifyListeners();

    try {
      final data = await ApiService.getWeeklyNutritionEntries(
        token: token,
        startDate: startDate,
      );
      _weeklyData = data;
      _weeklyEntries =
          (data['entries'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoadingWeekly = false;
      notifyListeners();
    }
  }
}
