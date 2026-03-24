import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/nutrition_plan.dart';
import '../models/nutrition_calculation.dart';
import '../models/dining_hall_menu.dart';
import '../config/app_config.dart';

class ApiService {
  static String getBaseUrl() {
    return AppConfig.baseUrl;
  }

  // Builds request headers with auth token if available
  static Map<String, String> _getHeaders(String? token) {
    Map<String, String> headers = {
      'Content-Type': 'application/json',
    };

    // Add auth token if we have one
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  // User login - sends credentials to backend
  static Future<Map<String, dynamic>> login(
      String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${getBaseUrl()}/auth/login'),
        headers: _getHeaders(null), // No token needed for login
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        // Login failed - probably wrong credentials
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      // Network error or other issue
      throw Exception('Network error during login: $e');
    }
  }

  // User registration
  static Future<Map<String, dynamic>> register(
      Map<String, dynamic> userData) async {
    try {
      final response = await http.post(
        Uri.parse('${getBaseUrl()}/auth/register'),
        headers: _getHeaders(null), // No auth needed for registration
        body: jsonEncode(userData),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        // Registration failed - maybe username already exists
        throw Exception('Registration failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error during registration: $e');
    }
  }

  // Login with Auth0 token - exchanges Auth0 token for app token and user
  static Future<Map<String, dynamic>> loginWithAuth0(String auth0Token) async {
    try {
      print('🔄 Sending Auth0 token to backend: ${auth0Token.substring(0, 20)}...');
      
      final response = await http.post(
        Uri.parse('${getBaseUrl()}/auth/auth0'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'auth0Token': auth0Token,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body) as Map<String, dynamic>;
        return responseData;
      } else {
        final errorBody = response.body;
        throw Exception('Auth0 login failed (${response.statusCode}): $errorBody');
      }
    } catch (e) {
      throw Exception('Network error during Auth0 login: $e');
    }
  }

  // Get current user's profile data
  static Future<User> getCurrentUser(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${getBaseUrl()}/users/me'),
        headers: _getHeaders(token),
      );

      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to get user data: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error fetching user profile: $e');
    }
  }

  static Future<User> updateUser(
      String token, Map<String, dynamic> userData) async {
    final response = await http.put(
      Uri.parse('${getBaseUrl()}/users/me'),
      headers: _getHeaders(token),
      body: jsonEncode(userData),
    );

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update user: ${response.body}');
    }
  }

  /**
   * Update user nutrition goals
   */
  static Future<User> updateUserGoals({
    required String token,
    String? dailyCalories,
    String? carbohydratesG,
    String? proteinsG,
    String? fatsG,
  }) async {
    final userData = <String, dynamic>{};
    if (dailyCalories != null) userData['dailyCalories'] = dailyCalories;
    if (carbohydratesG != null) userData['carbohydratesG'] = carbohydratesG;
    if (proteinsG != null) userData['proteinsG'] = proteinsG;
    if (fatsG != null) userData['fatsG'] = fatsG;

    return updateUser(token, userData);
  }

  // Nutrition endpoints
  static Future<NutritionCalculationResponse> calculateNutrition(
    NutritionCalculationRequest request,
  ) async {
    final response = await http.post(
      Uri.parse('${getBaseUrl()}/nutrition/calculate'),
      headers: _getHeaders(null),
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 200) {
      return NutritionCalculationResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to calculate nutrition: ${response.body}');
    }
  }

  static Future<List<NutritionPlan>> getAllNutritionPlans() async {
    final response = await http.get(
      Uri.parse('${getBaseUrl()}/nutrition/plans'),
      headers: _getHeaders(null),
    );

    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => NutritionPlan.fromJson(json)).toList();
    } else {
      throw Exception('Failed to get nutrition plans: ${response.body}');
    }
  }

  static Future<List<NutritionPlan>> searchNutritionPlans({
    String? age,
    String? sex,
    String? height,
    String? weight,
  }) async {
    String queryParams = '';
    List<String> params = [];

    if (age != null) params.add('age=$age');
    if (sex != null) params.add('sex=$sex');
    if (height != null) params.add('height=$height');
    if (weight != null) params.add('weight=$weight');

    if (params.isNotEmpty) {
      queryParams = '?${params.join('&')}';
    }

    final response = await http.get(
      Uri.parse('${getBaseUrl()}/nutrition/plans/search$queryParams'),
      headers: _getHeaders(null),
    );

    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => NutritionPlan.fromJson(json)).toList();
    } else {
      throw Exception('Failed to search nutrition plans: ${response.body}');
    }
  }

  static Future<List<NutritionPlan>> searchNutritionPlansByName(
      String name) async {
    final response = await http.get(
      Uri.parse('${getBaseUrl()}/nutrition/plans/search/name?name=$name'),
      headers: _getHeaders(null),
    );

    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => NutritionPlan.fromJson(json)).toList();
    } else {
      throw Exception(
          'Failed to search nutrition plans by name: ${response.body}');
    }
  }

  // Fetch dining hall menu via backend
  static Future<DiningHallMenu> getDiningHallMenu({
    required String locationId,
    required String date,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${getBaseUrl()}/menu/sodexo/$locationId?date=$date'),
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return DiningHallMenu.fromJson(data);
      } else {
        throw Exception('Failed to get dining hall menu: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error fetching menu from backend: $e');
    }
  }

  // Convenience method for Graceland's dining hall specifically
  // Uses today's date if no date is provided
  static Future<DiningHallMenu> getGracelandDiningMenu({String? date}) async {
    final today = DateTime.now();
    // Format date as YYYY-MM-DD for the API
    final menuDate = date ??
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    // Graceland's location ID in the Sodexo system
    return getDiningHallMenu(
      locationId: '48760001',
      date: menuDate,
    );
  }

  // Enhanced Menu API methods
  static Future<Map<String, dynamic>> ingestMenu({
    required String location,
    required DateTime date,
    String? mealType,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${getBaseUrl()}/menu/ingest'),
        headers: _getHeaders(null),
        body: jsonEncode({
          'location': location,
          'date': date.toIso8601String(),
          if (mealType != null) 'mealType': mealType,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to ingest menu: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error ingesting menu: $e');
    }
  }

  static Future<Map<String, dynamic>> getMenuItems({
    required String location,
    required DateTime date,
    String? mealType,
    String? category,
  }) async {
    try {
      final queryParams = <String, String>{
        'location': location,
        'date': date.toIso8601String(),
        if (mealType != null) 'mealType': mealType,
        if (category != null) 'category': category,
      };

      final uri = Uri.parse('${getBaseUrl()}/menu/items')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get menu items: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting menu items: $e');
    }
  }

  static Future<Map<String, dynamic>> getPriorProbabilities({
    required String location,
    required DateTime date,
    String? mealType,
  }) async {
    try {
      final queryParams = <String, String>{
        'location': location,
        'date': date.toIso8601String(),
        if (mealType != null) 'mealType': mealType,
      };

      final uri = Uri.parse('${getBaseUrl()}/menu/priors')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get prior probabilities: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting prior probabilities: $e');
    }
  }

  // Portion Analysis API methods
  static Future<Map<String, dynamic>> analyzePortion({
    required dynamic imageFile, // Can be File or Uint8List
    required String location,
    required DateTime date,
    String? mealType,
    List<String>? hints,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${getBaseUrl()}/portion/analyze'),
      );

      // Add image file - handle both File and Uint8List
      if (imageFile is File) {
        // Mobile/Desktop: use file path
        request.files
            .add(await http.MultipartFile.fromPath('image', imageFile.path));
      } else if (imageFile is Uint8List) {
        // Web: use bytes directly
        request.files.add(http.MultipartFile.fromBytes(
          'image',
          imageFile,
          filename: 'image.jpg',
        ));
      } else {
        throw Exception('Unsupported image file type');
      }

      // Add form fields
      request.fields['location'] = location;
      request.fields['date'] = date.toIso8601String();
      if (mealType != null) {
        request.fields['mealType'] = mealType;
      }
      // Add hints if provided - send as comma-separated string
      // Backend will parse this into an array
      if (hints != null && hints.isNotEmpty) {
        request.fields['hints'] = hints.join(',');
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      // Check if response body is empty or invalid
      if (response.body.isEmpty || response.body.trim().isEmpty) {
        throw Exception('Empty response from server');
      }

      if (response.statusCode == 200) {
        try {
          return jsonDecode(response.body) as Map<String, dynamic>;
        } catch (e) {
          throw Exception('Invalid JSON response: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');
        }
      } else {
        // Try to parse error response as JSON, but don't fail if it's not
        String errorMessage = 'Failed to analyze portion (${response.statusCode})';
        try {
          final errorBody = jsonDecode(response.body) as Map<String, dynamic>;
          errorMessage = errorBody['message'] ?? errorBody['error'] ?? errorMessage;
        } catch (_) {
          // If error response is not JSON, use the raw body
          if (response.body.isNotEmpty) {
            errorMessage = response.body.length > 200 
                ? '${response.body.substring(0, 200)}...' 
                : response.body;
          }
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Error analyzing portion: $e');
    }
  }

  static Future<Map<String, dynamic>> getFoodLabels() async {
    try {
      final response = await http.get(
        Uri.parse('${getBaseUrl()}/portion/labels'),
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get food labels: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting food labels: $e');
    }
  }

  static Future<Map<String, dynamic>> getPortionHistory({
    String? location,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (location != null) queryParams['location'] = location;
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();

      final uri = Uri.parse('${getBaseUrl()}/portion/history')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get portion history: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting portion history: $e');
    }
  }

  // Nutrition Entry endpoints
  
  /**
   * Create a nutrition entry (log food to daily plan)
   */
  static Future<Map<String, dynamic>> createNutritionEntry({
    required String token,
    required String foodName,
    double? calories,
    double? protein,
    double? carbs,
    double? fat,
    double? fiber,
    double? sugar,
    double? sodium,
    double? quantity,
    String? quantityUnit,
    DateTime? entryDate,
  }) async {
    try {
      final requestBody = <String, dynamic>{
        'foodName': foodName,
        if (calories != null) 'calories': calories,
        if (protein != null) 'protein': protein,
        if (carbs != null) 'carbs': carbs,
        if (fat != null) 'fat': fat,
        if (fiber != null) 'fiber': fiber,
        if (sugar != null) 'sugar': sugar,
        if (sodium != null) 'sodium': sodium,
        if (quantity != null) 'quantity': quantity,
        if (quantityUnit != null) 'quantityUnit': quantityUnit,
        if (entryDate != null) 'entryDate': entryDate.toIso8601String().split('T')[0],
      };

      final response = await http.post(
        Uri.parse('${getBaseUrl()}/nutrition/entries'),
        headers: _getHeaders(token),
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to create nutrition entry: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error creating nutrition entry: $e');
    }
  }

  /**
   * Get nutrition entries for a specific date
   */
  static Future<List<dynamic>> getNutritionEntries({
    required String token,
    DateTime? date,
  }) async {
    try {
      String url = '${getBaseUrl()}/nutrition/entries';
      if (date != null) {
        url = '${getBaseUrl()}/nutrition/entries/date?date=${date.toIso8601String().split('T')[0]}';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data is List ? data : [data];
      } else {
        throw Exception('Failed to get nutrition entries: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting nutrition entries: $e');
    }
  }

  /**
   * Get daily nutrition totals
   */
  static Future<Map<String, dynamic>> getDailyTotals({
    required String token,
    DateTime? date,
  }) async {
    try {
      String url = '${getBaseUrl()}/nutrition/entries/totals';
      if (date != null) {
        url += '?date=${date.toIso8601String().split('T')[0]}';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(token),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get daily totals: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting daily totals: $e');
    }
  }

  /**
   * Update a nutrition entry
   */
  static Future<Map<String, dynamic>> updateNutritionEntry({
    required String token,
    required int entryId,
    String? foodName,
    double? calories,
    double? protein,
    double? carbs,
    double? fat,
    double? fiber,
    double? sugar,
    double? sodium,
    double? quantity,
    DateTime? entryDate,
  }) async {
    try {
      final requestBody = <String, dynamic>{};
      if (foodName != null) requestBody['foodName'] = foodName;
      if (calories != null) requestBody['calories'] = calories;
      if (protein != null) requestBody['protein'] = protein;
      if (carbs != null) requestBody['carbs'] = carbs;
      if (fat != null) requestBody['fat'] = fat;
      if (fiber != null) requestBody['fiber'] = fiber;
      if (sugar != null) requestBody['sugar'] = sugar;
      if (sodium != null) requestBody['sodium'] = sodium;
      if (quantity != null) requestBody['quantity'] = quantity;
      if (entryDate != null) requestBody['entryDate'] = entryDate.toIso8601String().split('T')[0];

      final response = await http.put(
        Uri.parse('${getBaseUrl()}/nutrition/entries/$entryId'),
        headers: _getHeaders(token),
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to update nutrition entry: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error updating nutrition entry: $e');
    }
  }

  /**
   * Delete a nutrition entry
   */
  static Future<void> deleteNutritionEntry({
    required String token,
    required int entryId,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${getBaseUrl()}/nutrition/entries/$entryId'),
        headers: _getHeaders(token),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete nutrition entry: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error deleting nutrition entry: $e');
    }
  }

  /**
   * Get weekly nutrition entries
   */
  static Future<Map<String, dynamic>> getWeeklyNutritionEntries({
    required String token,
    DateTime? startDate,
  }) async {
    try {
      String url = '${getBaseUrl()}/nutrition/entries/week';
      if (startDate != null) {
        url += '?startDate=${startDate.toIso8601String().split('T')[0]}';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(token),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get weekly nutrition entries: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting weekly nutrition entries: $e');
    }
  }

  /**
   * Apply a nutrition plan to the current user
   */
  static Future<User> applyNutritionPlan({
    required String token,
    required int planId,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${getBaseUrl()}/users/me/plan'),
        headers: _getHeaders(token),
        body: jsonEncode({
          'nutritionPlanId': planId,
        }),
      );

      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to apply nutrition plan: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error applying nutrition plan: $e');
    }
  }

  /**
   * Search foods (both menu items and general database)
   */
  static Future<Map<String, dynamic>> saveCustomFood({
    required String foodName,
    double? caloriesPer100g,
    double? proteinPer100g,
    double? carbsPer100g,
    double? fatPer100g,
    double? fiberPer100g,
    double? sugarPer100g,
    double? sodiumPer100g,
    String? brand,
    String? category,
    String? description,
  }) async {
    try {
      final uri = Uri.parse('${getBaseUrl()}/menu/save-custom-food');
      
      // Build query parameters
      final queryParams = <String, String>{
        'foodName': foodName,
      };
      
      if (caloriesPer100g != null) {
        queryParams['caloriesPer100g'] = caloriesPer100g.toString();
      }
      if (proteinPer100g != null) {
        queryParams['proteinPer100g'] = proteinPer100g.toString();
      }
      if (carbsPer100g != null) {
        queryParams['carbsPer100g'] = carbsPer100g.toString();
      }
      if (fatPer100g != null) {
        queryParams['fatPer100g'] = fatPer100g.toString();
      }
      if (fiberPer100g != null) {
        queryParams['fiberPer100g'] = fiberPer100g.toString();
      }
      if (sugarPer100g != null) {
        queryParams['sugarPer100g'] = sugarPer100g.toString();
      }
      if (sodiumPer100g != null) {
        queryParams['sodiumPer100g'] = sodiumPer100g.toString();
      }
      if (brand != null && brand.isNotEmpty) {
        queryParams['brand'] = brand;
      }
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (description != null && description.isNotEmpty) {
        queryParams['description'] = description;
      }
      
      final uriWithParams = uri.replace(queryParameters: queryParams);
      
      final response = await http.post(
        uriWithParams,
        headers: _getHeaders(null), // Custom foods can be saved without auth for now
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 503) {
        // Service Unavailable - migration pending, return error response
        final errorBody = jsonDecode(response.body);
        return errorBody; // Return the error response so caller can handle it
      } else {
        throw Exception('Failed to save custom food: ${response.body}');
      }
    } catch (e) {
      print('Error saving custom food: $e');
      rethrow;
    }
  }

  static Future<List<dynamic>> searchFoods({
    required String query,
    String? location,
    String? mealType,
  }) async {
    try {
      final queryParams = <String, String>{
        'query': query,
        if (location != null) 'location': location,
        if (mealType != null) 'mealType': mealType,
      };

      final uri = Uri.parse('${getBaseUrl()}/menu/search-foods')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['results'] != null) {
          return data['results'] as List;
        }
        return [];
      } else {
        throw Exception('Failed to search foods: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error searching foods: $e');
    }
  }

  /**
   * Search menu items
   */
  static Future<List<dynamic>> searchMenuItems({
    required String query,
    String? location,
    String? mealType,
  }) async {
    try {
      final queryParams = <String, String>{
        'query': query,
        if (location != null) 'location': location,
        if (mealType != null) 'mealType': mealType,
      };

      final uri = Uri.parse('${getBaseUrl()}/menu/search')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['results'] != null) {
          return data['results'] as List;
        }
        return [];
      } else {
        throw Exception('Failed to search menu items: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error searching menu items: $e');
    }
  }

  /**
   * Get top foods for a location and meal type
   */
  static Future<List<String>> getTopFoods({
    required String location,
    required DateTime date,
    String? mealType,
    int topN = 10,
  }) async {
    try {
      final queryParams = <String, String>{
        'location': location,
        'date': date.toIso8601String(),
        'topN': topN.toString(),
        if (mealType != null) 'mealType': mealType,
      };

      final uri = Uri.parse('${getBaseUrl()}/menu/top-foods')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['topFoods'] != null) {
          return List<String>.from(data['topFoods']);
        }
        return [];
      } else {
        throw Exception('Failed to get top foods: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting top foods: $e');
    }
  }

  /**
   * Get nutrition plan by ID
   */
  static Future<NutritionPlan> getNutritionPlanById(int planId) async {
    try {
      final response = await http.get(
        Uri.parse('${getBaseUrl()}/nutrition/plans/$planId'),
        headers: _getHeaders(null),
      );

      if (response.statusCode == 200) {
        return NutritionPlan.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to get nutrition plan: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error getting nutrition plan: $e');
    }
  }

  // Generate personalized nutrition plan using AI chatbot
  static Future<Map<String, dynamic>> generatePersonalizedPlan(
      String token, Map<String, dynamic> requestData) async {
    try {
      final response = await http.post(
        Uri.parse('${getBaseUrl()}/nutrition/plans/chatbot'),
        headers: _getHeaders(token),
        body: jsonEncode(requestData),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorBody = jsonDecode(response.body);
        throw Exception(errorBody['error'] ?? 'Failed to generate plan: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error generating personalized plan: $e');
    }
  }
}
