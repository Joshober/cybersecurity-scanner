import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/nutrition_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/app_colors.dart';
import '../../widgets/edit_meal_dialog.dart';
import 'food_detection_screen.dart';
import 'dining_menu_screen.dart';

class MealsScreen extends StatefulWidget {
  const MealsScreen({super.key});

  @override
  State<MealsScreen> createState() => _MealsScreenState();
}

class _MealsScreenState extends State<MealsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && !_tabController.indexIsChanging) {
        // Load weekly entries when switching to week tab
        _loadWeeklyEntries();
      }
    });
    _loadEntries();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadEntries() async {
    final authProvider = context.read<AuthProvider>();
    final nutritionProvider = context.read<NutritionProvider>();
    
    if (authProvider.isAuthenticated && authProvider.token != null) {
      await nutritionProvider.loadDailyEntries(
        authProvider.token!,
        date: _selectedDate,
      );
    }
  }

  Future<void> _loadWeeklyEntries() async {
    final authProvider = context.read<AuthProvider>();
    final nutritionProvider = context.read<NutritionProvider>();
    
    if (authProvider.isAuthenticated && authProvider.token != null) {
      final startDate = DateTime.now().subtract(const Duration(days: 6));
      await nutritionProvider.loadWeeklyEntries(
        authProvider.token!,
        startDate: startDate,
      );
    }
  }

  String _getMealType(DateTime entryTime) {
    final hour = entryTime.hour;
    if (hour >= 6 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 21) return 'Dinner';
    return 'Snacks';
  }

  Map<String, List<Map<String, dynamic>>> _groupEntriesByMealType(List<Map<String, dynamic>> entries) {
    final grouped = <String, List<Map<String, dynamic>>>{};
    
    for (final entry in entries) {
      DateTime? entryTime;
      try {
        if (entry['entryDate'] != null) {
          entryTime = DateTime.parse(entry['entryDate'].toString());
        } else if (entry['createdAt'] != null) {
          entryTime = DateTime.parse(entry['createdAt'].toString());
        } else {
          entryTime = DateTime.now();
        }
      } catch (e) {
        entryTime = DateTime.now();
      }
      
      final mealType = _getMealType(entryTime);
      grouped.putIfAbsent(mealType, () => []).add(entry);
    }
    
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'My Meals',
          style: TextStyle(
            color: AppColors.gray700,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: AppColors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.green600,
              unselectedLabelColor: AppColors.gray600,
              indicatorColor: AppColors.green600,
              tabs: const [
                Tab(text: 'Today'),
                Tab(text: 'Week'),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today, color: AppColors.gray600),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 7)),
              );
              if (picked != null && picked != _selectedDate) {
                setState(() {
                  _selectedDate = picked;
                });
                _loadEntries();
              }
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDailyView(),
          _buildWeeklyView(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddMealOptions,
        backgroundColor: AppColors.green600,
        icon: const Icon(Icons.add, color: AppColors.white),
        label: const Text(
          'Add Meal',
          style: TextStyle(color: AppColors.white),
        ),
      ),
    );
  }

  Widget _buildDailyView() {
    return Consumer2<AuthProvider, NutritionProvider>(
      builder: (context, authProvider, nutritionProvider, child) {
        if (!authProvider.isAuthenticated || authProvider.token == null) {
          return const Center(
            child: Text('Please log in to track your meals'),
          );
        }

        if (nutritionProvider.isLoadingEntries) {
          return const Center(child: CircularProgressIndicator());
        }

        final entries = nutritionProvider.dailyEntries;
        final totals = nutritionProvider.dailyTotals;

        return RefreshIndicator(
          onRefresh: _loadEntries,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date Header
                _buildDateHeader(),
                const SizedBox(height: 16),
                
                // Compact Daily Progress Section
                if (totals != null) _buildCompactProgressSection(totals),
                const SizedBox(height: 16),
                
                // Meals by Type
                if (entries.isEmpty)
                  _buildEmptyState()
                else
                  ..._buildMealSections(entries),
                const SizedBox(height: 80), // Space for FAB
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWeeklyView() {
    return Consumer2<AuthProvider, NutritionProvider>(
      builder: (context, authProvider, nutritionProvider, child) {
        if (!authProvider.isAuthenticated || authProvider.token == null) {
          return const Center(
            child: Text('Please log in to view weekly meals'),
          );
        }

        if (nutritionProvider.isLoadingWeekly) {
          return const Center(child: CircularProgressIndicator());
        }

        // Generate last 7 days
        final weekDays = List.generate(7, (index) {
          final date = DateTime.now().subtract(Duration(days: 6 - index));
          return date;
        });

        final weeklyData = nutritionProvider.weeklyData;
        final entriesByDate = weeklyData?['entriesByDate'] as Map<String, dynamic>?;
        final totalsByDate = weeklyData?['totalsByDate'] as Map<String, dynamic>?;

        return RefreshIndicator(
          onRefresh: _loadWeeklyEntries,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '7-Day Overview',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your meals from the past week',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.gray600,
                  ),
                ),
                const SizedBox(height: 16),
                ...weekDays.map((date) => _buildDayCard(
                  date,
                  nutritionProvider,
                  entriesByDate,
                  totalsByDate,
                )),
                const SizedBox(height: 80), // Space for FAB
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDayCard(
    DateTime date,
    NutritionProvider provider,
    Map<String, dynamic>? entriesByDate,
    Map<String, dynamic>? totalsByDate,
  ) {
    final isToday = date.year == DateTime.now().year &&
        date.month == DateTime.now().month &&
        date.day == DateTime.now().day;
    
    final dateFormat = DateFormat('EEEE, MMMM d');
    final shortFormat = DateFormat('EEE, MMM d');
    final dateKey = date.toIso8601String().split('T')[0];

    // Get entries and totals for this date
    List<Map<String, dynamic>> dayEntries = [];
    Map<String, dynamic>? dayTotals;

    if (entriesByDate != null) {
      final entries = entriesByDate[dateKey];
      if (entries is List) {
        dayEntries = entries.cast<Map<String, dynamic>>();
      }
    }

    if (totalsByDate != null) {
      final totals = totalsByDate[dateKey];
      if (totals is Map) {
        dayTotals = totals.cast<String, dynamic>();
      }
    }

    final calories = dayTotals?['totalCalories']?.toDouble() ?? 0.0;
    final mealCount = dayEntries.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: isToday ? Border.all(color: AppColors.green600, width: 2) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ExpansionTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isToday ? AppColors.green100 : AppColors.gray100,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              date.day.toString(),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isToday ? AppColors.green600 : AppColors.gray600,
              ),
            ),
          ),
        ),
        title: Text(
          isToday ? 'Today' : shortFormat.format(date),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isToday ? AppColors.green600 : AppColors.gray700,
          ),
        ),
        subtitle: Row(
          children: [
            Text(
              dateFormat.format(date),
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.gray500,
              ),
            ),
            if (mealCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.green100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$mealCount ${mealCount == 1 ? 'meal' : 'meals'}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.green600,
                  ),
                ),
              ),
            ],
          ],
        ),
        trailing: mealCount > 0
            ? Text(
                '${calories.toStringAsFixed(0)} kcal',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gray700,
                ),
              )
            : null,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (dayEntries.isEmpty)
                  const Text(
                    'No meals logged for this day',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.gray500,
                    ),
                  )
                else ...[
                  if (dayTotals != null) ...[
                    _buildDayTotalsSummary(dayTotals),
                    const SizedBox(height: 12),
                    const Divider(),
                    const SizedBox(height: 12),
                  ],
                  ...dayEntries.map((entry) => _buildMealEntryCard(entry)),
                ],
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _selectedDate = date;
                    });
                    _tabController.animateTo(0);
                    _loadEntries();
                  },
                  child: const Text('View Full Day'),
                ),
              ],
            ),
          ),
        ],
        onExpansionChanged: (expanded) {
          if (expanded && provider.weeklyData == null) {
            _loadWeeklyEntries();
          }
        },
      ),
    );
  }

  Widget _buildDayTotalsSummary(Map<String, dynamic> totals) {
    final calories = totals['totalCalories']?.toDouble() ?? 0.0;
    final protein = totals['totalProtein']?.toDouble() ?? 0.0;
    final carbs = totals['totalCarbs']?.toDouble() ?? 0.0;
    final fat = totals['totalFat']?.toDouble() ?? 0.0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem('Calories', '${calories.toStringAsFixed(0)}', AppColors.orange600),
          _buildSummaryItem('Protein', '${protein.toStringAsFixed(0)}g', AppColors.blue600),
          _buildSummaryItem('Carbs', '${carbs.toStringAsFixed(0)}g', AppColors.orange500),
          _buildSummaryItem('Fat', '${fat.toStringAsFixed(0)}g', AppColors.purple600),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.gray600,
          ),
        ),
      ],
    );
  }

  Widget _buildDateHeader() {
    final dateFormat = DateFormat('EEEE, MMMM d');
    final isToday = _selectedDate.year == DateTime.now().year &&
        _selectedDate.month == DateTime.now().month &&
        _selectedDate.day == DateTime.now().day;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        isToday ? 'Today' : dateFormat.format(_selectedDate),
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppColors.gray700,
        ),
      ),
    );
  }

  double _getUserGoal(String? goalString, double defaultValue) {
    if (goalString == null || goalString.isEmpty) {
      return defaultValue;
    }
    return double.tryParse(goalString) ?? defaultValue;
  }

  Widget _buildCompactProgressSection(Map<String, dynamic> totals) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final calories = totals['totalCalories']?.toDouble() ?? 0.0;
        final protein = totals['totalProtein']?.toDouble() ?? 0.0;
        final carbs = totals['totalCarbs']?.toDouble() ?? 0.0;
        final fat = totals['totalFat']?.toDouble() ?? 0.0;

        final goalCalories = _getUserGoal(authProvider.user?.dailyCalories, 2000.0);
        final goalProtein = _getUserGoal(authProvider.user?.proteinsG, 150.0);
        final goalCarbs = _getUserGoal(authProvider.user?.carbohydratesG, 200.0);
        final goalFat = _getUserGoal(authProvider.user?.fatsG, 65.0);

        return Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Daily Progress',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray700,
                ),
              ),
              const SizedBox(height: 12),
              _buildCompactProgressBar('Calories', calories, goalCalories, AppColors.orange500, 'kcal'),
              const SizedBox(height: 8),
              _buildCompactProgressBar('Protein', protein, goalProtein, AppColors.blue500, 'g'),
              const SizedBox(height: 8),
              _buildCompactProgressBar('Carbs', carbs, goalCarbs, AppColors.orange500, 'g'),
              const SizedBox(height: 8),
              _buildCompactProgressBar('Fat', fat, goalFat, AppColors.purple500, 'g'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCompactProgressBar(String label, double current, double goal, Color color, String unit) {
    final percentage = (current / goal).clamp(0.0, 1.0);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.gray700,
                  ),
                ),
              ],
            ),
            Text(
              '${current.toStringAsFixed(0)} / ${goal.toStringAsFixed(0)} $unit',
              style: TextStyle(
                fontSize: 12,
                color: percentage > 1.0 ? AppColors.orange600 : AppColors.gray600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 6,
            backgroundColor: AppColors.gray200,
            valueColor: AlwaysStoppedAnimation<Color>(
              percentage > 1.0 ? AppColors.orange600 : color,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      margin: const EdgeInsets.only(top: 32),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.gray50,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.restaurant_menu,
              size: 40,
              color: AppColors.gray400,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No meals logged today',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap the + button to add your first meal',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  List<Widget> _buildMealSections(List<Map<String, dynamic>> entries) {
    final grouped = _groupEntriesByMealType(entries);
    final mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    
    return mealTypes.map((mealType) {
      final mealEntries = grouped[mealType] ?? [];
      if (mealEntries.isEmpty) return const SizedBox.shrink();
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12, top: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getMealTypeColor(mealType).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    mealType,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: _getMealTypeColor(mealType),
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '${mealEntries.length} ${mealEntries.length == 1 ? 'item' : 'items'}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
          ),
          ...mealEntries.map((entry) => _buildMealEntryCard(entry)),
          const SizedBox(height: 12),
        ],
      );
    }).toList();
  }

  Color _getMealTypeColor(String mealType) {
    switch (mealType) {
      case 'Breakfast':
        return AppColors.orange600;
      case 'Lunch':
        return AppColors.blue600;
      case 'Dinner':
        return AppColors.purple600;
      default:
        return AppColors.green600;
    }
  }

  Widget _buildMealEntryCard(Map<String, dynamic> entry) {
    final entryId = entry['id'] as int?;
    final foodName = entry['foodName'] ?? 'Unknown';
    final calories = entry['calories']?.toDouble();
    final protein = entry['protein']?.toDouble();
    final carbs = entry['carbs']?.toDouble();
    final fat = entry['fat']?.toDouble();
    
    // Get time
    String timeStr = '';
    try {
      DateTime? entryTime;
      if (entry['entryDate'] != null) {
        entryTime = DateTime.parse(entry['entryDate'].toString());
      } else if (entry['createdAt'] != null) {
        entryTime = DateTime.parse(entry['createdAt'].toString());
      }
      if (entryTime != null) {
        final hour = entryTime.hour;
        final minute = entryTime.minute;
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
        timeStr = '${displayHour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $period';
      }
    } catch (e) {
      // Ignore
    }

    return Dismissible(
      key: Key('entry_${entryId ?? entry.hashCode.toString()}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.orange600,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete, color: AppColors.white),
      ),
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Delete Meal'),
            content: Text('Are you sure you want to delete $foodName?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: TextButton.styleFrom(foregroundColor: AppColors.orange600),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ?? false;
      },
      onDismissed: (direction) async {
        if (entryId != null) {
          final authProvider = context.read<AuthProvider>();
          final nutritionProvider = context.read<NutritionProvider>();
          
          if (authProvider.token != null) {
            try {
              await nutritionProvider.deleteEntry(authProvider.token!, entryId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Meal deleted successfully'),
                    backgroundColor: AppColors.green600,
                  ),
                );
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to delete meal: $e'),
                    backgroundColor: AppColors.orange600,
                  ),
                );
              }
            }
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.green100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.restaurant,
                  color: AppColors.green600,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            foodName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.gray700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (timeStr.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: Text(
                                  timeStr,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.gray500,
                                  ),
                                ),
                              ),
                            IconButton(
                              icon: const Icon(Icons.edit, size: 18),
                              color: AppColors.gray600,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => _showEditMealDialog(entry),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (calories != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${calories.toStringAsFixed(0)} kcal',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.gray700,
                          ),
                        ),
                      ),
                    if (protein != null || carbs != null || fat != null) ...[
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        children: [
                          if (protein != null)
                            _buildMacroChip('P', protein.toStringAsFixed(1), AppColors.blue500),
                          if (carbs != null)
                            _buildMacroChip('C', carbs.toStringAsFixed(1), AppColors.orange500),
                          if (fat != null)
                            _buildMacroChip('F', fat.toStringAsFixed(1), AppColors.purple500),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMacroChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '$label: ${value}g',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  void _showAddMealOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.teal),
              title: const Text('Scan Food'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const FoodDetectionScreen(),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.restaurant, color: Colors.red),
              title: const Text('Browse Dining Menu'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const DiningMenuScreen(),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.blue),
              title: const Text('Manual Entry'),
              onTap: () {
                Navigator.pop(context);
                _showManualEntryDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditMealDialog(Map<String, dynamic> entry) {
    showDialog(
      context: context,
      builder: (context) => EditMealDialog(
        entry: entry,
        onSave: (updatedData) async {
          final entryId = entry['id'] as int?;
          if (entryId == null) return;

          final authProvider = context.read<AuthProvider>();
          final nutritionProvider = context.read<NutritionProvider>();

          if (authProvider.token != null) {
            try {
              await nutritionProvider.updateEntry(
                authProvider.token!,
                entryId,
                updatedData,
              );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Meal updated successfully'),
                    backgroundColor: AppColors.green600,
                  ),
                );
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to update meal: $e'),
                    backgroundColor: AppColors.orange600,
                  ),
                );
              }
            }
          }
        },
      ),
    );
  }

  void _showManualEntryDialog() {
    final foodNameController = TextEditingController();
    final caloriesController = TextEditingController();
    final proteinController = TextEditingController();
    final carbsController = TextEditingController();
    final fatController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Manual Entry'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: foodNameController,
                decoration: const InputDecoration(
                  labelText: 'Food Name',
                  prefixIcon: Icon(Icons.restaurant),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: caloriesController,
                decoration: const InputDecoration(
                  labelText: 'Calories',
                  prefixIcon: Icon(Icons.local_fire_department),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: proteinController,
                decoration: const InputDecoration(
                  labelText: 'Protein (g)',
                  prefixIcon: Icon(Icons.fitness_center),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: carbsController,
                decoration: const InputDecoration(
                  labelText: 'Carbs (g)',
                  prefixIcon: Icon(Icons.grain),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: fatController,
                decoration: const InputDecoration(
                  labelText: 'Fat (g)',
                  prefixIcon: Icon(Icons.water_drop),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final authProvider = context.read<AuthProvider>();
              if (authProvider.token == null) return;

              try {
                await ApiService.createNutritionEntry(
                  token: authProvider.token!,
                  foodName: foodNameController.text.trim(),
                  calories: double.tryParse(caloriesController.text),
                  protein: double.tryParse(proteinController.text),
                  carbs: double.tryParse(carbsController.text),
                  fat: double.tryParse(fatController.text),
                );

                if (context.mounted) {
                  Navigator.pop(context);
                  await _loadEntries();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Meal added successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to add meal: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

