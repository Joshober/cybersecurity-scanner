// Represents a single menu item from the dining hall
// Contains all the nutrition info and details we need to display
class MenuItem {
  final String id;                    // Unique identifier for this item
  final String name;                  // What the food is called
  final String? description;          // Additional details about the item
  final String? category;             // Which meal category (breakfast, lunch, etc.)
  final List<String>? allergens;      // List of allergens (nuts, dairy, etc.)
  final Map<String, dynamic>? nutritionInfo; // Raw nutrition data from API
  final String? servingSize;          // How much is one serving
  final double? calories;             // Calories per serving
  final double? protein;              // Protein in grams
  final double? carbs;                // Carbohydrates in grams
  final double? fat;                  // Fat in grams
  final double? fiber;                // Fiber in grams
  final double? sugar;                // Sugar in grams
  final double? sodium;               // Sodium in mg

  MenuItem({
    required this.id,
    required this.name,
    this.description,
    this.category,
    this.allergens,
    this.nutritionInfo,
    this.servingSize,
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.sugar,
    this.sodium,
  });

  // Parse menu item from JSON response
  // The Sodexo API has inconsistent field names, so we check multiple possibilities
  factory MenuItem.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      return MenuItem(
        // Try different possible field names for ID
        id: json['id']?.toString() ?? json['itemId']?.toString() ?? '',
        // Try different possible field names for name
        name: json['name'] ?? json['itemName'] ?? json['title'] ?? 'Unknown Item',
        description: json['description'] ?? json['itemDescription'],
        category: json['category'] ?? json['categoryName'],
        // Convert allergens list if it exists
        allergens: json['allergens'] != null 
            ? List<String>.from(json['allergens']) 
            : null,
        nutritionInfo: json['nutritionInfo'] ?? json['nutrition'],
        servingSize: json['servingSize'] ?? json['portion'],
        // Parse nutrition values - they might be strings or numbers
        calories: _parseDouble(json['calories'] ?? json['calorie']),
        protein: _parseDouble(json['protein']),
        carbs: _parseDouble(json['carbs'] ?? json['carbohydrates']),
        fat: _parseDouble(json['fat']),
        fiber: _parseDouble(json['fiber']),
        sugar: _parseDouble(json['sugar']),
        sodium: _parseDouble(json['sodium']),
      );
    } else {
      // Fallback: if it's not a map, treat it as a simple string name
      return MenuItem(
        id: json.toString(),
        name: json.toString(),
        description: null,
        category: null,
        allergens: null,
        nutritionInfo: null,
        servingSize: null,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sugar: null,
        sodium: null,
      );
    }
  }

  // Helper method to safely parse nutrition values
  // The API sometimes returns strings, sometimes numbers
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'allergens': allergens,
      'nutritionInfo': nutritionInfo,
      'servingSize': servingSize,
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'fiber': fiber,
      'sugar': sugar,
      'sodium': sodium,
    };
  }
}
