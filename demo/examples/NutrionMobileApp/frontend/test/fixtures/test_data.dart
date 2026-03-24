import 'package:nutrition_app/models/user.dart';
import 'package:nutrition_app/models/menu_item.dart';
import 'package:nutrition_app/models/dining_hall_menu.dart';
import 'package:nutrition_app/models/nutrition_calculation.dart';
import 'package:nutrition_app/models/nutrition_plan.dart';

/// Test data factory for creating test objects
class TestData {
  /// Create a test user
  static User createTestUser() {
    return User(
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      age: 25,
      weight: '70.0',
      height: '175.0',
      activityLevel: 'moderate',
      vegan: false,
      vegetarian: false,
    );
  }

  /// Create a test user with custom values
  static User createTestUserWith({
    int? id,
    String? username,
    String? email,
    int? age,
    String? weight,
    String? height,
    String? activityLevel,
    bool? vegan,
    bool? vegetarian,
  }) {
    return User(
      id: id ?? 1,
      username: username ?? 'testuser',
      email: email ?? 'test@example.com',
      age: age ?? 25,
      weight: weight ?? '70.0',
      height: height ?? '175.0',
      activityLevel: activityLevel ?? 'moderate',
      vegan: vegan ?? false,
      vegetarian: vegetarian ?? false,
    );
  }

  /// Create a test menu item
  static MenuItem createTestMenuItem() {
    return MenuItem(
      id: '1',
      name: 'Test Food Item',
      description: 'A test food item for testing purposes',
      category: 'Test Category',
      calories: 250.0,
      protein: 15.0,
      carbs: 30.0,
      fat: 10.0,
    );
  }

  /// Create a test menu item with custom values
  static MenuItem createTestMenuItemWith({
    String? id,
    String? name,
    String? description,
    String? category,
    double? calories,
    double? protein,
    double? carbs,
    double? fat,
  }) {
    return MenuItem(
      id: id ?? '1',
      name: name ?? 'Test Food Item',
      description: description ?? 'A test food item for testing purposes',
      category: category ?? 'Test Category',
      calories: calories ?? 250.0,
      protein: protein ?? 15.0,
      carbs: carbs ?? 30.0,
      fat: fat ?? 10.0,
    );
  }

  /// Create a list of test menu items
  static List<MenuItem> createTestMenuItems(int count) {
    final List<MenuItem> items = [];
    final List<String> categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    final List<String> foodNames = [
      'Scrambled Eggs',
      'Grilled Chicken',
      'Salad',
      'Pasta',
      'Rice',
      'Bread'
    ];

    for (int i = 0; i < count; i++) {
      items.add(createTestMenuItemWith(
        id: (i + 1).toString(),
        name: foodNames[i % foodNames.length],
        category: categories[i % categories.length],
        calories: 200.0 + (i * 50.0),
        protein: 10.0 + (i * 5.0),
      ));
    }

    return items;
  }

  /// Create a test dining hall menu
  static DiningHallMenu createTestDiningHallMenu() {
    return DiningHallMenu(
      locationId: '48760001',
      locationName: 'Test Dining Hall',
      date: '2024-01-15',
      categories: [
        MenuCategory(
          id: '1',
          name: 'Breakfast',
          items: createTestMenuItems(2),
        ),
        MenuCategory(
          id: '2',
          name: 'Lunch',
          items: createTestMenuItems(3),
        ),
      ],
    );
  }

  /// Create a test dining hall menu with custom values
  static DiningHallMenu createTestDiningHallMenuWith({
    String? locationId,
    String? locationName,
    String? date,
    List<MenuCategory>? categories,
  }) {
    return DiningHallMenu(
      locationId: locationId ?? '48760001',
      locationName: locationName ?? 'Test Dining Hall',
      date: date ?? '2024-01-15',
      categories: categories ??
          [
            MenuCategory(
              id: '1',
              name: 'Breakfast',
              items: createTestMenuItems(2),
            ),
          ],
    );
  }

  /// Create a test nutrition calculation request
  static NutritionCalculationRequest createTestNutritionCalculationRequest() {
    return NutritionCalculationRequest(
      sex: 'male',
      weight: 70.0,
      height: 175.0,
      age: 25,
      activityLevel: 'moderate',
      factorValue: '1.5',
    );
  }

  /// Create a test nutrition calculation request with custom values
  static NutritionCalculationRequest createTestNutritionCalculationRequestWith({
    String? sex,
    double? weight,
    double? height,
    int? age,
    String? activityLevel,
    String? factorValue,
  }) {
    return NutritionCalculationRequest(
      sex: sex ?? 'male',
      weight: weight ?? 70.0,
      height: height ?? 175.0,
      age: age ?? 25,
      activityLevel: activityLevel ?? 'moderate',
      factorValue: factorValue ?? '1.5',
    );
  }

  /// Create a test nutrition plan
  static NutritionPlan createTestNutritionPlan() {
    return NutritionPlan(
      id: 1,
      name: 'Test Nutrition Plan',
      description: 'A test nutrition plan for testing purposes',
      age: '25',
      sex: 'male',
      height: '175.0',
      weight: '70.0',
      dailyCalories: '2000',
      carbohydratesG: '250',
      proteinsG: '150',
      fatsG: '65',
    );
  }

  /// Create a test nutrition plan with custom values
  static NutritionPlan createTestNutritionPlanWith({
    int? id,
    String? name,
    String? description,
    String? age,
    String? sex,
    String? height,
    String? weight,
    String? dailyCalories,
    String? carbohydratesG,
    String? proteinsG,
    String? fatsG,
  }) {
    return NutritionPlan(
      id: id ?? 1,
      name: name ?? 'Test Nutrition Plan',
      description: description ?? 'A test nutrition plan for testing purposes',
      age: age ?? '25',
      sex: sex ?? 'male',
      height: height ?? '175.0',
      weight: weight ?? '70.0',
      dailyCalories: dailyCalories ?? '2000',
      carbohydratesG: carbohydratesG ?? '250',
      proteinsG: proteinsG ?? '150',
      fatsG: fatsG ?? '65',
    );
  }

  /// Create a list of test nutrition plans
  static List<NutritionPlan> createTestNutritionPlans(int count) {
    final List<NutritionPlan> plans = [];
    final List<String> planNames = [
      'Weight Loss Plan',
      'Muscle Gain Plan',
      'Maintenance Plan',
      'Athletic Performance Plan'
    ];

    for (int i = 0; i < count; i++) {
      plans.add(createTestNutritionPlanWith(
        id: i + 1,
        name: planNames[i % planNames.length],
        dailyCalories: (1500 + (i * 200)).toString(),
        proteinsG: (100 + (i * 25)).toString(),
      ));
    }

    return plans;
  }

  /// Create a random string of specified length
  static String createRandomString(int length) {
    const String chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final StringBuffer buffer = StringBuffer();
    for (int i = 0; i < length; i++) {
      buffer.write(
          chars[(DateTime.now().millisecondsSinceEpoch + i) % chars.length]);
    }
    return buffer.toString();
  }

  /// Create a random email address
  static String createRandomEmail() {
    return '${createRandomString(8)}@example.com';
  }

  /// Create a random username
  static String createRandomUsername() {
    return 'user${createRandomString(6)}';
  }

  /// Create a random date string
  static String createRandomDate() {
    final DateTime now = DateTime.now();
    final DateTime randomDate =
        now.subtract(Duration(days: (now.millisecondsSinceEpoch % 30)));
    return '${randomDate.year}-${randomDate.month.toString().padLeft(2, '0')}-${randomDate.day.toString().padLeft(2, '0')}';
  }
}
