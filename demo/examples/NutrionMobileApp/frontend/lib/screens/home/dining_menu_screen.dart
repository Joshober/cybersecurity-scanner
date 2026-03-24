import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/menu_provider.dart';
import '../../models/dining_hall_menu.dart';
import '../../models/menu_item.dart';

// Screen that displays the dining hall menu
// Users can select different dates and view menu items with nutrition info
class DiningMenuScreen extends StatefulWidget {
  const DiningMenuScreen({super.key});

  @override
  State<DiningMenuScreen> createState() => _DiningMenuScreenState();
}

class _DiningMenuScreenState extends State<DiningMenuScreen> {
  DateTime _selectedDate = DateTime.now(); // Start with today's date

  @override
  void initState() {
    super.initState();
    // Load today's menu when the screen first opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadMenuForDate(_selectedDate);
    });
  }

  // Convert DateTime to the format the API expects (YYYY-MM-DD)
  void _loadMenuForDate(DateTime date) {
    final dateString = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    context.read<MenuProvider>().loadGracelandDiningMenu(date: dateString);
  }

  // Show date picker dialog for user to select a different date
  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 7)), // Can go back 1 week
      lastDate: DateTime.now().add(const Duration(days: 30)), // Can go forward 1 month
    );
    
    // If user picked a new date, update our state and load that menu
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _loadMenuForDate(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dining Hall Menu'),
        actions: [
          // Calendar button to pick a different date
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDate(context),
          ),
        ],
      ),
      body: Consumer<MenuProvider>(
        builder: (context, menuProvider, child) {
          // Show loading spinner while fetching menu data
          if (menuProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          // Show error message if something went wrong
          if (menuProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading menu',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    menuProvider.error!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _loadMenuForDate(_selectedDate),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // Show message if no menu data is available
          if (menuProvider.currentMenu == null) {
            return const Center(
              child: Text('No menu data available'),
            );
          }

          // Show the actual menu content
          return _buildMenuContent(menuProvider.currentMenu!);
        },
      ),
    );
  }

  // Build the main menu content with header and categories
  Widget _buildMenuContent(DiningHallMenu menu) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMenuHeader(menu), // Show location and date info
          const SizedBox(height: 24),
          // Show message if no categories available
          if (menu.categories.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('No menu items available for this date'),
              ),
            )
          else
            // Show each category as an expandable card
            ...menu.categories.map((category) => _buildCategoryCard(category)),
        ],
      ),
    );
  }

  // Build the header card showing location and date info
  Widget _buildMenuHeader(DiningHallMenu menu) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              menu.locationName,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Date: ${_formatDate(menu.date)}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${menu.categories.length} categories available',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Build an expandable card for each menu category (Breakfast, Lunch, etc.)
  Widget _buildCategoryCard(MenuCategory category) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16.0),
      child: ExpansionTile(
        title: Text(
          category.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: category.description != null
            ? Text(category.description!)
            : Text('${category.items.length} items'),
        children: category.items.map((item) => _buildMenuItem(item)).toList(),
      ),
    );
  }

  // Build a list item for each menu item with nutrition info and allergens
  Widget _buildMenuItem(MenuItem item) {
    return ListTile(
      title: Text(item.name),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Show description if available
          if (item.description != null) ...[
            const SizedBox(height: 4),
            Text(
              item.description!,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
          // Show allergen warnings as colored chips
          if (item.allergens != null && item.allergens!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 4,
              children: item.allergens!.map((allergen) => Chip(
                label: Text(
                  allergen,
                  style: const TextStyle(fontSize: 10),
                ),
                backgroundColor: Colors.red[100],
                labelStyle: TextStyle(color: Colors.red[800]),
              )).toList(),
            ),
          ],
          // Show nutrition info if available
          if (item.calories != null) ...[
            const SizedBox(height: 4),
            _buildNutritionInfo(item),
          ],
        ],
      ),
      // Show calories and serving size on the right side
      trailing: item.calories != null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${item.calories!.toInt()} cal',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                if (item.servingSize != null)
                  Text(
                    item.servingSize!,
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            )
          : null,
    );
  }

  // Build a compact nutrition info display with protein, carbs, and fat
  Widget _buildNutritionInfo(MenuItem item) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Show protein if available
          if (item.protein != null) ...[
            _buildNutritionChip('P', item.protein!, 'g'),
            const SizedBox(width: 4),
          ],
          // Show carbs if available
          if (item.carbs != null) ...[
            _buildNutritionChip('C', item.carbs!, 'g'),
            const SizedBox(width: 4),
          ],
          // Show fat if available
          if (item.fat != null) ...[
            _buildNutritionChip('F', item.fat!, 'g'),
          ],
        ],
      ),
    );
  }

  // Build a small chip showing nutrition value (P: 25g, C: 30g, etc.)
  Widget _buildNutritionChip(String label, double value, String unit) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.blue[100],
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        '$label: ${value.toInt()}$unit',
        style: TextStyle(
          fontSize: 10,
          color: Colors.blue[800],
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  // Convert API date format (YYYY-MM-DD) to display format (MM/DD/YYYY)
  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      // If parsing fails, just return the original string
      return dateString;
    }
  }
}

