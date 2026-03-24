import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:responsive_framework/responsive_framework.dart';
import '../../providers/auth_provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../widgets/user_profile_card.dart';
import 'food_detection_screen.dart';
import 'profile_screen.dart';
import 'meals_screen.dart';
import 'discover_screen.dart';

// Static callback for dashboard navigation
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  static void Function()? _switchToDashboardCallback;

  static void switchToDashboard() {
    _switchToDashboardCallback?.call();
  }

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  // Method to switch to dashboard tab (for navigation from child screens)
  void switchToDashboard() {
    setState(() {
      _selectedIndex = 0;
    });
    // Refresh daily entries when switching to dashboard
    final nutritionProvider = context.read<NutritionProvider>();
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated && authProvider.token != null) {
      nutritionProvider.refreshDailyEntries(authProvider.token!);
    }
  }

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    // Register the callback
    DashboardScreen._switchToDashboardCallback = switchToDashboard;

    // Initialize screens list with callback
    _screens = [
      DashboardHome(
        onSwitchToMeals: () {
          setState(() {
            _selectedIndex = 1; // Meals tab
          });
        },
      ),
      const MealsScreen(),
      const DiscoverScreen(),
      const ProfileScreen(),
    ];

    // Load nutrition plans when dashboard loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final nutritionProvider = context.read<NutritionProvider>();
      final authProvider = context.read<AuthProvider>();
      nutritionProvider.loadAllNutritionPlans();

      // Load daily entries if user is authenticated
      if (authProvider.isAuthenticated && authProvider.token != null) {
        nutritionProvider.loadDailyEntries(authProvider.token!);
      }
    });
  }

  @override
  void dispose() {
    // Unregister the callback
    DashboardScreen._switchToDashboardCallback = null;
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh daily entries when switching to dashboard tab
    if (_selectedIndex == 0) {
      final nutritionProvider = context.read<NutritionProvider>();
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated && authProvider.token != null) {
        nutritionProvider.refreshDailyEntries(authProvider.token!);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = ResponsiveBreakpoints.of(context).largerThan(TABLET);

    if (isDesktop) {
      // Desktop layout with sidebar navigation
      return Scaffold(
        body: Row(
          children: [
            // Sidebar navigation
            Container(
              width: 250,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  right: BorderSide(
                    color: Theme.of(context).dividerColor,
                    width: 1,
                  ),
                ),
              ),
              child: Column(
                children: [
                  // App header
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(
                          Icons.restaurant,
                          color: Theme.of(context).primaryColor,
                          size: 32,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Nutrition App',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  // Navigation items
                  Expanded(
                    child: ListView(
                      children: [
                        _buildNavItem(0, Icons.home, 'Home'),
                        _buildNavItem(1, Icons.restaurant_menu, 'Meals'),
                        _buildNavItem(2, Icons.explore, 'Discover'),
                        _buildNavItem(3, Icons.person, 'Profile'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Main content
            Expanded(
              child: _screens[_selectedIndex],
            ),
          ],
        ),
      );
    } else {
      // Mobile layout with bottom navigation
      return Scaffold(
        body: _screens[_selectedIndex],
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _selectedIndex,
          onTap: (index) {
            setState(() {
              _selectedIndex = index;
            });
            // Refresh daily entries when switching to dashboard
            if (index == 0) {
              final nutritionProvider = context.read<NutritionProvider>();
              final authProvider = context.read<AuthProvider>();
              if (authProvider.isAuthenticated && authProvider.token != null) {
                nutritionProvider.refreshDailyEntries(authProvider.token!);
              }
            }
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.restaurant_menu),
              label: 'Meals',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.explore),
              label: 'Discover',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      );
    }
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      selected: _selectedIndex == index,
      selectedTileColor: Theme.of(context).primaryColor.withOpacity(0.1),
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
        // Refresh daily entries when switching to dashboard
        if (index == 0) {
          final nutritionProvider = context.read<NutritionProvider>();
          final authProvider = context.read<AuthProvider>();
          if (authProvider.isAuthenticated && authProvider.token != null) {
            nutritionProvider.refreshDailyEntries(authProvider.token!);
          }
        }
      },
    );
  }
}

class DashboardHome extends StatelessWidget {
  final VoidCallback? onSwitchToMeals;

  const DashboardHome({super.key, this.onSwitchToMeals});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        context.read<AuthProvider>().logout();
                        Navigator.of(context).pop();
                      },
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer2<AuthProvider, NutritionProvider>(
        builder: (context, authProvider, nutritionProvider, child) {
          if (authProvider.user == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              if (authProvider.token != null) {
                await nutritionProvider
                    .refreshDailyEntries(authProvider.token!);
              }
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  UserProfileCard(user: authProvider.user!),
                  const SizedBox(height: 24),

                  // Prominent Scan Food Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const FoodDetectionScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.camera_alt, size: 28),
                      label: const Text(
                        'Scan Food',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Daily Totals with Progress
                  Consumer<NutritionProvider>(
                    builder: (context, nutritionProvider, child) {
                      final totals = nutritionProvider.dailyTotals;
                      if (totals != null) {
                        return _buildDailyProgressCard(context, totals);
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  const SizedBox(height: 24),

                  // Recent Meals Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Meals',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      if (onSwitchToMeals != null)
                        TextButton(
                          onPressed: onSwitchToMeals,
                          child: const Text('View All'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Consumer<NutritionProvider>(
                    builder: (context, nutritionProvider, child) {
                      if (nutritionProvider.isLoadingEntries) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final entries = nutritionProvider.dailyEntries;

                      if (entries.isEmpty) {
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              children: [
                                Icon(Icons.restaurant_menu,
                                    size: 64, color: Colors.grey[400]),
                                const SizedBox(height: 16),
                                Text(
                                  'No meals logged today',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Tap "Scan Food" to start tracking!',
                                  style: TextStyle(color: Colors.grey[600]),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      // Show last 5 meals
                      final recentEntries = entries.take(5).toList();
                      return Column(
                        children: recentEntries
                            .map((entry) => Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.green[100],
                                      child: Icon(Icons.restaurant,
                                          color: Colors.green[700]),
                                    ),
                                    title: Text(
                                      entry['foodName'] ?? 'Unknown',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        if (entry['calories'] != null)
                                          Text(
                                              '${entry['calories']?.toStringAsFixed(0) ?? '0'} kcal'),
                                        if (entry['protein'] != null ||
                                            entry['carbs'] != null ||
                                            entry['fat'] != null)
                                          Text(
                                            [
                                              if (entry['protein'] != null)
                                                'P: ${entry['protein']?.toStringAsFixed(1)}g',
                                              if (entry['carbs'] != null)
                                                'C: ${entry['carbs']?.toStringAsFixed(1)}g',
                                              if (entry['fat'] != null)
                                                'F: ${entry['fat']?.toStringAsFixed(1)}g',
                                            ].join(' • '),
                                            style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600]),
                                          ),
                                      ],
                                    ),
                                    trailing: Text(
                                      _formatEntryTime(entry['createdAt']),
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[500]),
                                    ),
                                  ),
                                ))
                            .toList(),
                      );
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDailyProgressCard(
      BuildContext context, Map<String, dynamic> totals) {
    final calories = totals['totalCalories']?.toDouble() ?? 0.0;
    final protein = totals['totalProtein']?.toDouble() ?? 0.0;
    final carbs = totals['totalCarbs']?.toDouble() ?? 0.0;
    final fat = totals['totalFat']?.toDouble() ?? 0.0;

    // Default goals (can be customized later)
    const goalCalories = 2000.0;
    const goalProtein = 150.0;
    const goalCarbs = 250.0;
    const goalFat = 65.0;

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.analytics, color: Theme.of(context).primaryColor),
                const SizedBox(width: 8),
                Text(
                  'Today\'s Progress',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildProgressBar(
                'Calories', calories, goalCalories, Colors.orange, 'kcal'),
            const SizedBox(height: 12),
            _buildProgressBar(
                'Protein', protein, goalProtein, Colors.blue, 'g'),
            const SizedBox(height: 12),
            _buildProgressBar('Carbs', carbs, goalCarbs, Colors.green, 'g'),
            const SizedBox(height: 12),
            _buildProgressBar('Fat', fat, goalFat, Colors.purple, 'g'),
          ],
        ),
      ),
    );
  }

  static Widget _buildProgressBar(
      String label, double current, double goal, Color color, String unit) {
    final percentage = (current / goal).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            Text(
              '${current.toStringAsFixed(0)} / ${goal.toStringAsFixed(0)} $unit',
              style: TextStyle(
                color: percentage > 1.0 ? Colors.red : Colors.grey[700],
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage,
          backgroundColor: color.withOpacity(0.2),
          valueColor: AlwaysStoppedAnimation<Color>(
            percentage > 1.0 ? Colors.red : color,
          ),
          minHeight: 8,
        ),
      ],
    );
  }

  String _formatEntryTime(dynamic createdAt) {
    if (createdAt == null) return '';
    try {
      // Parse the ISO 8601 datetime string
      DateTime dateTime;
      if (createdAt is String) {
        // Handle ISO 8601 format: "2025-12-09T04:44:43" or "2025-12-09T04:44:43.123"
        // If no timezone info, assume UTC and convert to local
        if (createdAt.contains('Z') || createdAt.contains('+') || createdAt.contains('-', 10)) {
          // Has timezone info
          dateTime = DateTime.parse(createdAt).toLocal();
        } else {
          // No timezone info - assume UTC and convert to local
          dateTime = DateTime.parse('${createdAt}Z').toLocal();
        }
      } else {
        return '';
      }
      
      // Format as 12-hour time with AM/PM
      final hour = dateTime.hour;
      final minute = dateTime.minute.toString().padLeft(2, '0');
      final period = hour >= 12 ? 'PM' : 'AM';
      final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return '$displayHour:$minute $period';
    } catch (e) {
      // Fallback to original string if parsing fails
      try {
        String dateStr = createdAt.toString();
        if (dateStr.contains('T')) {
          dateStr = dateStr.split('T')[1].split('.')[0];
          final parts = dateStr.split(':');
          if (parts.length >= 2) {
            final hour = int.parse(parts[0]);
            final minute = parts[1];
            final period = hour >= 12 ? 'PM' : 'AM';
            final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
            return '$displayHour:$minute $period';
          }
        }
        return dateStr;
      } catch (e2) {
        return '';
      }
    }
  }
}
