import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/menu_provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/dining_hall_menu.dart';
import '../../models/menu_item.dart';
import '../../models/nutrition_plan.dart';
import '../../services/api_service.dart';
import '../../widgets/nutrition_card.dart';
import '../../widgets/nutrition_chatbot.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _menuSearchController = TextEditingController();
  final TextEditingController _planSearchController = TextEditingController();
  
  List<dynamic> _menuSearchResults = [];
  bool _isSearchingMenu = false;
  List<String> _topFoods = [];
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadMenu();
    _loadTopFoods();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _menuSearchController.dispose();
    _planSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadMenu() async {
    final dateString = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
    await context.read<MenuProvider>().loadGracelandDiningMenu(date: dateString);
  }

  Future<void> _loadTopFoods() async {
    try {
      final topFoods = await ApiService.getTopFoods(
        location: 'graceland',
        date: _selectedDate,
        topN: 10,
      );
      setState(() {
        _topFoods = topFoods;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load top foods: $e')),
        );
      }
    }
  }

  Future<void> _searchMenuItems(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _menuSearchResults = [];
        _isSearchingMenu = false;
      });
      return;
    }

    setState(() {
      _isSearchingMenu = true;
    });

    try {
      final results = await ApiService.searchMenuItems(
        query: query,
        location: 'graceland',
      );
      setState(() {
        _menuSearchResults = results;
        _isSearchingMenu = false;
      });
    } catch (e) {
      setState(() {
        _isSearchingMenu = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Search failed: $e')),
        );
      }
    }
  }

  Future<void> _addMenuItemToMeal(MenuItem item) async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated || authProvider.token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in to add items to your meals'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    try {
      await ApiService.createNutritionEntry(
        token: authProvider.token!,
        foodName: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Added ${item.name} to your meals'),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'View Meals',
              textColor: Colors.white,
              onPressed: () {
                // Navigate to meals tab - will be handled by parent
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add item: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showPlanDetails(NutritionPlan plan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(plan.name),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (plan.description != null) ...[
                Text(
                  plan.description!,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
              ],
              if (plan.dailyCalories != null)
                _buildDetailRow('Daily Calories', plan.dailyCalories!),
              if (plan.proteinsG != null)
                _buildDetailRow('Protein', '${plan.proteinsG}g'),
              if (plan.carbohydratesG != null)
                _buildDetailRow('Carbs', '${plan.carbohydratesG}g'),
              if (plan.fatsG != null)
                _buildDetailRow('Fat', '${plan.fatsG}g'),
              if (plan.hydration != null)
                _buildDetailRow('Hydration', plan.hydration!),
              const SizedBox(height: 8),
              if (plan.age != null || plan.sex != null || plan.height != null || plan.weight != null) ...[
                const Divider(),
                const SizedBox(height: 8),
                const Text(
                  'Target Profile:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                if (plan.age != null) _buildDetailRow('Age', plan.age!),
                if (plan.sex != null) _buildDetailRow('Sex', plan.sex!),
                if (plan.height != null) _buildDetailRow('Height', plan.height!),
                if (plan.weight != null) _buildDetailRow('Weight', plan.weight!),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () async {
              final authProvider = context.read<AuthProvider>();
              if (authProvider.token == null) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please log in to apply a plan'),
                    backgroundColor: Colors.orange,
                  ),
                );
                return;
              }

              Navigator.pop(context);
              
              // Show loading
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(
                  child: CircularProgressIndicator(),
                ),
              );

              try {
                await authProvider.applyNutritionPlan(plan.id!);
                if (context.mounted) {
                  Navigator.pop(context); // Close loading dialog
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${plan.name} applied successfully!'),
                      backgroundColor: Colors.green,
                      action: SnackBarAction(
                        label: 'View Profile',
                        textColor: Colors.white,
                        onPressed: () {
                          // Navigate to profile - will be handled by parent
                        },
                      ),
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  Navigator.pop(context); // Close loading dialog
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to apply plan: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Apply Plan'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700])),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Dining Menu'),
            Tab(text: 'Nutrition Plans'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime.now().subtract(const Duration(days: 7)),
                lastDate: DateTime.now().add(const Duration(days: 30)),
              );
              if (picked != null && picked != _selectedDate) {
                setState(() {
                  _selectedDate = picked;
                });
                _loadMenu();
                _loadTopFoods();
              }
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildMenuTab(),
          _buildPlansTab(),
        ],
      ),
    );
  }

  Widget _buildMenuTab() {
    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _menuSearchController,
            decoration: InputDecoration(
              hintText: 'Search menu items...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _menuSearchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _menuSearchController.clear();
                        _searchMenuItems('');
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (value) {
              _searchMenuItems(value);
            },
          ),
        ),

        // Content
        Expanded(
          child: _isSearchingMenu
              ? const Center(child: CircularProgressIndicator())
              : _menuSearchController.text.trim().isNotEmpty
                  ? _buildMenuSearchResults()
                  : _buildMenuContent(),
        ),
      ],
    );
  }

  Widget _buildMenuSearchResults() {
    if (_menuSearchResults.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No results found'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _menuSearchResults.length,
      itemBuilder: (context, index) {
        final itemData = _menuSearchResults[index];
        // Try to parse as MenuItem
        if (itemData is Map<String, dynamic>) {
          try {
            final item = MenuItem.fromJson(itemData);
            return _buildMenuItemCard(item);
          } catch (e) {
            // Fallback to basic display
            return Card(
              child: ListTile(
                title: Text(itemData['name']?.toString() ?? 'Unknown'),
                subtitle: Text(itemData['description']?.toString() ?? ''),
                trailing: itemData['calories'] != null
                    ? Text('${itemData['calories']} cal')
                    : null,
                onTap: () {
                  // Try to add if we can parse it
                  try {
                    final item = MenuItem.fromJson(itemData);
                    _addMenuItemToMeal(item);
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Unable to add this item')),
                    );
                  }
                },
              ),
            );
          }
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildMenuContent() {
    return Consumer<MenuProvider>(
      builder: (context, menuProvider, child) {
        if (menuProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (menuProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                const SizedBox(height: 16),
                Text('Error loading menu'),
                const SizedBox(height: 8),
                Text(menuProvider.error!),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadMenu,
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        if (menuProvider.currentMenu == null) {
          return const Center(child: Text('No menu available'));
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Foods Section
              if (_topFoods.isNotEmpty) ...[
                Text(
                  'Popular Today',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _topFoods.map((food) {
                    return Chip(
                      label: Text(food),
                      avatar: const Icon(Icons.trending_up, size: 16),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
              ],

              // Menu Categories
              Text(
                'Menu Categories',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ...menuProvider.currentMenu!.categories.map(
                (category) => _buildCategoryCard(category),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCategoryCard(MenuCategory category) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ExpansionTile(
        title: Text(
          category.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('${category.items.length} items'),
        children: category.items.map((item) => _buildMenuItemCard(item)).toList(),
      ),
    );
  }

  Widget _buildMenuItemCard(MenuItem item) {
    return ListTile(
      title: Text(item.name),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.description != null) ...[
            const SizedBox(height: 4),
            Text(
              item.description!,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
          if (item.allergens != null && item.allergens!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 4,
              children: item.allergens!.map((allergen) => Chip(
                label: Text(allergen, style: const TextStyle(fontSize: 10)),
                backgroundColor: Colors.red[100],
                labelStyle: TextStyle(color: Colors.red[800]),
              )).toList(),
            ),
          ],
          if (item.calories != null || item.protein != null || item.carbs != null || item.fat != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                if (item.calories != null)
                  Text(
                    '${item.calories!.toInt()} cal',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                if (item.protein != null) ...[
                  const SizedBox(width: 8),
                  Text('P: ${item.protein!.toInt()}g', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
                if (item.carbs != null) ...[
                  const SizedBox(width: 8),
                  Text('C: ${item.carbs!.toInt()}g', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
                if (item.fat != null) ...[
                  const SizedBox(width: 8),
                  Text('F: ${item.fat!.toInt()}g', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
              ],
            ),
          ],
        ],
      ),
      trailing: IconButton(
        icon: const Icon(Icons.add_circle, color: Colors.green),
        onPressed: () => _addMenuItemToMeal(item),
        tooltip: 'Add to meal',
      ),
    );
  }

  Widget _buildPlansTab() {
    return Column(
      children: [
        // Chatbot Button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: ElevatedButton.icon(
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => DraggableScrollableSheet(
                  initialChildSize: 0.9,
                  minChildSize: 0.5,
                  maxChildSize: 0.95,
                  builder: (context, scrollController) => const NutritionChatbot(),
                ),
              );
            },
            icon: const Icon(Icons.smart_toy),
            label: const Text('Get Personalized Plan with AI'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        
        // Search Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: TextField(
            controller: _planSearchController,
            decoration: InputDecoration(
              hintText: 'Search nutrition plans...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _planSearchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _planSearchController.clear();
                        context.read<NutritionProvider>().loadAllNutritionPlans();
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (value) {
              if (value.trim().isEmpty) {
                context.read<NutritionProvider>().loadAllNutritionPlans();
              } else {
                context.read<NutritionProvider>().searchNutritionPlansByName(value);
              }
            },
          ),
        ),

        // Plans List
        Expanded(
          child: Consumer<NutritionProvider>(
            builder: (context, nutritionProvider, child) {
              if (nutritionProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (nutritionProvider.error != null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                      const SizedBox(height: 16),
                      Text('Error loading plans'),
                      const SizedBox(height: 8),
                      Text(nutritionProvider.error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          nutritionProvider.clearError();
                          nutritionProvider.loadAllNutritionPlans();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              }

              if (nutritionProvider.nutritionPlans.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.restaurant_menu, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No nutrition plans available'),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: nutritionProvider.nutritionPlans.length,
                itemBuilder: (context, index) {
                  final plan = nutritionProvider.nutritionPlans[index];
                  return GestureDetector(
                    onTap: () => _showPlanDetails(plan),
                    child: NutritionCard(plan: plan),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

