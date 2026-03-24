import 'menu_item.dart';

// Represents the complete menu for a dining hall on a specific date
// Contains all the categories and items available
class DiningHallMenu {
  final String locationId;        // ID of the dining location
  final String locationName;      // Human-readable name of the location
  final String date;              // Date this menu is for (YYYY-MM-DD)
  final List<MenuCategory> categories; // All the menu categories (breakfast, lunch, etc.)

  DiningHallMenu({
    required this.locationId,
    required this.locationName,
    required this.date,
    required this.categories,
  });

  // Parse menu data from the Sodexo API response
  // The API sometimes returns a list directly, sometimes wrapped in an object
  factory DiningHallMenu.fromJson(dynamic json) {
    if (json is List) {
      // API returned a list of categories directly
      return DiningHallMenu(
        locationId: '48760001', // Graceland's location ID
        locationName: 'Graceland University Dining',
        date: DateTime.now().toIso8601String().split('T')[0], // Today's date
        categories: json.map((item) => MenuCategory.fromJson(item)).toList(),
      );
    } else if (json is Map<String, dynamic>) {
      // API returned a proper object with metadata
      return DiningHallMenu(
        locationId: json['locationId']?.toString() ?? '48760001',
        locationName: json['locationName'] ?? 'Graceland University Dining',
        date: json['date'] ?? DateTime.now().toIso8601String().split('T')[0],
        categories: json['categories'] != null
            ? (json['categories'] as List)
                .map((category) => MenuCategory.fromJson(category))
                .toList()
            : [],
      );
    } else {
      throw Exception('Invalid JSON format for DiningHallMenu');
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'locationId': locationId,
      'locationName': locationName,
      'date': date,
      'categories': categories.map((category) => category.toJson()).toList(),
    };
  }

  // Get all menu items from all categories as a flat list
  // Useful for searching through everything at once
  List<MenuItem> getAllMenuItems() {
    List<MenuItem> allItems = [];
    for (var category in categories) {
      allItems.addAll(category.items);
    }
    return allItems;
  }
}

// Represents a category of menu items (like "Breakfast", "Lunch", etc.)
class MenuCategory {
  final String id;              // Unique identifier for this category
  final String name;            // Display name (e.g., "Breakfast", "Lunch")
  final String? description;    // Optional description of the category
  final List<MenuItem> items;   // All the food items in this category

  MenuCategory({
    required this.id,
    required this.name,
    this.description,
    required this.items,
  });

  // Parse category from JSON - handles different API response formats
  factory MenuCategory.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      return MenuCategory(
        // Try different possible field names for ID and name
        id: json['id']?.toString() ?? json['categoryId']?.toString() ?? '',
        name: json['name'] ?? json['categoryName'] ?? 'Unknown Category',
        description: json['description'],
        // Parse all items in this category
        items: json['items'] != null
            ? (json['items'] as List)
                .map((item) => MenuItem.fromJson(item))
                .toList()
            : [],
      );
    } else {
      // Fallback: if it's not a proper category object, treat it as a single item
      return MenuCategory(
        id: 'default',
        name: 'Menu Items',
        description: null,
        items: [MenuItem.fromJson(json)],
      );
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}
