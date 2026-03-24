import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:universal_platform/universal_platform.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth0_service.dart';
import '../config/app_config.dart';

class AuthProvider with ChangeNotifier {
  final SharedPreferences prefs;

  AuthProvider({required this.prefs});

  User? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _user != null;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await ApiService.login(username, password);

      if (response.containsKey('token') && response.containsKey('user')) {
        _token = response['token'];
        _user = User.fromJson(response['user']);

        // Save to SharedPreferences
        await prefs.setString('token', _token!);
        await prefs.setString('user', _user!.toJson().toString());

        _setError(null);
      } else {
        _setError('Invalid response from server');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> register(Map<String, dynamic> userData) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await ApiService.register(userData);

      if (response.containsKey('token') && response.containsKey('user')) {
        _token = response['token'];
        _user = User.fromJson(response['user']);

        // Save to SharedPreferences
        await prefs.setString('token', _token!);
        await prefs.setString('user', _user!.toJson().toString());

        _setError(null);
      } else {
        _setError('Invalid response from server');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadStoredAuth() async {
    _setLoading(true);

    try {
      // Handle Auth0 callback on web (if present in URL)
      if (UniversalPlatform.isWeb && AppConfig.isAuth0Configured) {
        try {
          final credentials = await Auth0Service.handleWebCallback();
          if (credentials != null && credentials.accessToken.isNotEmpty) {
            // Exchange Auth0 ID token with backend to get/create user
            // Use idToken (not accessToken) because it contains user profile info (email, name, etc.)
            final idToken = credentials.idToken.isNotEmpty
                ? credentials.idToken
                : credentials
                    .accessToken; // Fallback to accessToken if idToken not available
            final response = await ApiService.loginWithAuth0(idToken);

            if (response.containsKey('token') && response.containsKey('user')) {
              _token = response['token'] as String;
              _user = User.fromJson(response['user'] as Map<String, dynamic>);

              // Save to SharedPreferences
              await prefs.setString('token', _token!);
              await prefs.setString('user', _user!.toJson().toString());

              _setError(null);
              notifyListeners(); // Notify listeners that auth state changed
              _setLoading(false);

              return; // Successfully logged in via Auth0 callback
            } else {
              _setError('Invalid response from server: missing token or user');
            }
          } else {}
        } catch (e, stackTrace) {
          // Auth0 callback failed or not present - log error and continue with normal flow
          _setError('Auth0 login failed: $e');
          // Don't throw - allow app to continue with normal auth flow
        }
      }

      final storedToken = prefs.getString('token');
      final storedUser = prefs.getString('user');

      if (storedToken != null && storedUser != null) {
        _token = storedToken;
        try {
          // Try to parse stored user data
          // Handle both JSON string format and query string format
          Map<String, dynamic> userData;
          if (storedUser.startsWith('{')) {
            // JSON format
            userData = jsonDecode(storedUser) as Map<String, dynamic>;
          } else {
            // Query string format (legacy)
            userData =
                Map<String, dynamic>.from(Uri.splitQueryString(storedUser));
          }

          if (userData.isNotEmpty && userData.containsKey('username')) {
            _user = User.fromJson(userData);

            // Verify token is still valid by fetching current user
            try {
              _user = await ApiService.getCurrentUser(_token!);
            } catch (e) {
              // Token is invalid, clear stored data
              await logout();
            }
          } else {
            // Invalid user data, clear it
            await prefs.remove('user');
            await prefs.remove('token');
          }
        } catch (e) {
          // Failed to parse user data, clear stored data
          await prefs.remove('user');
          await prefs.remove('token');
        }
      }
    } catch (e) {
      _setError('Failed to load stored authentication');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateUser(Map<String, dynamic> userData) async {
    if (_token == null) return;

    _setLoading(true);
    _setError(null);

    try {
      _user = await ApiService.updateUser(_token!, userData);
      await prefs.setString('user', _user!.toJson().toString());
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshUser() async {
    if (_token == null) {
      return;
    }

    try {
      _user = await ApiService.getCurrentUser(_token!);
      await prefs.setString('user', _user!.toJson().toString());
      notifyListeners();
    } catch (e) {
      // Silently fail - user might not be logged in
    }
  }

  Future<void> applyNutritionPlan(int planId) async {
    if (_token == null) {
      _setError('Not authenticated');
      return;
    }

    _setLoading(true);
    _setError(null);

    try {
      _user = await ApiService.applyNutritionPlan(
        token: _token!,
        planId: planId,
      );
      await prefs.setString('user', _user!.toJson().toString());
      _setError(null);
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  /// Sign in with Google using Auth0
  Future<void> signInWithGoogle() async {
    if (!AppConfig.isAuth0Configured) {
      _setError('Auth0 is not configured. Please configure Auth0 settings.');
      return;
    }

    _setLoading(true);
    _setError(null);

    try {
      // Sign in with Google via Auth0
      final credentials = await Auth0Service.signInWithGoogle();

      // If credentials is null, the redirect happened and we'll handle it in handleCallback
      if (credentials == null) {
        return; // Redirect is happening, callback will handle the rest
      }

      if (credentials.accessToken.isEmpty) {
        _setError('Failed to get access token from Auth0');
        return;
      }

      // Exchange Auth0 ID token with backend to get/create user
      // Use idToken (not accessToken) because it contains user profile info (email, name, etc.)
      final idToken = credentials.idToken.isNotEmpty
          ? credentials.idToken
          : credentials
              .accessToken; // Fallback to accessToken if idToken not available
      final response = await ApiService.loginWithAuth0(idToken);

      if (response.containsKey('token') && response.containsKey('user')) {
        _token = response['token'];
        _user = User.fromJson(response['user']);

        // Save to SharedPreferences
        await prefs.setString('token', _token!);
        await prefs.setString('user', _user!.toJson().toString());

        _setError(null);
      } else {
        _setError('Invalid response from server');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    // Sign out from Auth0 if configured
    try {
      if (AppConfig.isAuth0Configured) {
        await Auth0Service.signOut();
      }
    } catch (e) {
      // Ignore Auth0 logout errors
    }

    _user = null;
    _token = null;
    _error = null;

    // Clear SharedPreferences
    await prefs.remove('token');
    await prefs.remove('user');

    notifyListeners();
  }

  void clearError() {
    _setError(null);
  }
}
