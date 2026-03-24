import 'package:flutter/material.dart';
import '../models/dining_hall_menu.dart';
import '../services/api_service.dart';

// Manages the dining hall menu state for the app
// Handles loading menu data, error states, and date selection
class MenuProvider with ChangeNotifier {
  DiningHallMenu? _currentMenu;    // The currently loaded menu
  bool _isLoading = false;         // Whether we're currently fetching data
  String? _error;                  // Any error message from API calls
  String? _selectedDate;           // The date the user selected to view

  // Getters for the UI to access our state
  DiningHallMenu? get currentMenu => _currentMenu;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedDate => _selectedDate;

  // Helper methods to update state and notify listeners
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners(); // Tell the UI to rebuild
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners(); // Tell the UI to rebuild
  }

  // Load the menu for Graceland's dining hall
  // If no date is provided, uses today's date
  Future<void> loadGracelandDiningMenu({String? date}) async {
    _setLoading(true);
    _setError(null); // Clear any previous errors

    try {
      _currentMenu = await ApiService.getGracelandDiningMenu(date: date);
      _selectedDate = date;
    } catch (e) {
      // Something went wrong - show error to user
      _setError(e.toString());
    } finally {
      _setLoading(false); // Always stop loading, even if there was an error
    }
  }

  // Load menu for any dining hall (more generic method)
  // Useful if we want to support multiple dining halls in the future
  Future<void> loadDiningHallMenu({
    required String locationId,
    required String date,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      _currentMenu = await ApiService.getDiningHallMenu(
        locationId: locationId,
        date: date,
      );
      _selectedDate = date;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Clear any error messages
  void clearError() {
    _setError(null);
  }

  // Reset the menu data (useful for logout or app reset)
  void clearMenu() {
    _currentMenu = null;
    _selectedDate = null;
    notifyListeners();
  }
}

