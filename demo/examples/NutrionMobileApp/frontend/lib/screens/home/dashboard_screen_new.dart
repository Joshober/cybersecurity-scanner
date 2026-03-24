import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/nutrition_provider.dart';
import 'food_detection_screen.dart';
import 'profile_screen.dart';
import 'meals_screen.dart';
import 'discover_screen.dart';

// Color constants matching the reference design
class AppColors {
  static const Color green600 = Color(0xFF16A34A); // #16a34a
  static const Color green50 = Color(0xFFF0FDF4); // #f0fdf4
  static const Color green100 = Color(0xFFDCFCE7); // #dcfce7
  static const Color green200 = Color(0xFFBBF7D0); // #bbf7d0
  static const Color green500 = Color(0xFF22C55E); // #22c55e
  static const Color blue500 = Color(0xFF3B82F6); // #3b82f6
  static const Color blue600 = Color(0xFF2563EB); // #2563eb
  static const Color blue100 = Color(0xFFDBEAFE); // #dbeafe
  static const Color orange500 = Color(0xFFF97316); // #f97316
  static const Color orange600 = Color(0xFFEA580C); // #ea580c
  static const Color orange100 = Color(0xFFFFEDD5); // #ffedd5
  static const Color purple500 = Color(0xFFA855F7); // #a855f7
  static const Color purple600 = Color(0xFF9333EA); // #9333ea
  static const Color purple100 = Color(0xFFF3E8FF); // #f3e8ff
  static const Color gray50 = Color(0xFFF9FAFB); // #f9fafb
  static const Color gray200 = Color(0xFFE5E7EB); // #e5e7eb
  static const Color gray300 = Color(0xFFD1D5DB); // #d1d5db
  static const Color gray400 = Color(0xFF9CA3AF); // #9ca3af
  static const Color gray500 = Color(0xFF6B7280); // #6b7280
  static const Color gray600 = Color(0xFF4B5563); // #4b5563
  static const Color gray700 = Color(0xFF374151); // #374151
  static const Color white = Color(0xFFFFFFFF); // #ffffff
}

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

  void switchToDashboard() {
    setState(() {
      _selectedIndex = 0;
    });
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
    DashboardScreen._switchToDashboardCallback = switchToDashboard;

    _screens = [
      DashboardHome(
        onSwitchToMeals: () {
          setState(() {
            _selectedIndex = 2; // Log tab
          });
        },
      ),
      const FoodDetectionScreen(), // Scan
      const MealsScreen(), // Log
      const DiscoverScreen(), // Plans
      const ProfileScreen(), // Account
    ];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final nutritionProvider = context.read<NutritionProvider>();
      final authProvider = context.read<AuthProvider>();
      nutritionProvider.loadAllNutritionPlans();

      if (authProvider.isAuthenticated && authProvider.token != null) {
        nutritionProvider.loadDailyEntries(authProvider.token!);
      }
    });
  }

  @override
  void dispose() {
    DashboardScreen._switchToDashboardCallback = null;
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
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
      return Scaffold(
        body: Row(
          children: [
            Container(
              width: 250,
              decoration: BoxDecoration(
                color: AppColors.white,
                border: Border(
                  right: BorderSide(color: AppColors.gray200, width: 1),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.restaurant, color: AppColors.green600, size: 32),
                        const SizedBox(width: 12),
                        Text(
                          'Nutrition App',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  Expanded(
                    child: ListView(
                      children: [
                        _buildNavItem(0, Icons.dashboard, 'Dashboard'),
                        _buildNavItem(1, Icons.restaurant_menu, 'Meals'),
                        _buildNavItem(2, Icons.explore, 'Discover'),
                        _buildNavItem(3, Icons.person, 'Account'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _screens[_selectedIndex]),
          ],
        ),
      );
    } else {
      return Scaffold(
        body: _screens[_selectedIndex],
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border(top: BorderSide(color: AppColors.gray200, width: 1)),
          ),
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildBottomNavItem(0, Icons.dashboard, 'Dashboard'),
                _buildBottomNavItem(1, Icons.camera_alt, 'Scan'),
                _buildBottomNavItem(2, Icons.book, 'Log'),
                _buildBottomNavItem(3, Icons.restaurant_menu, 'Plans'),
                _buildBottomNavItem(4, Icons.person, 'Account'),
              ],
            ),
          ),
        ),
      );
    }
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(icon, color: isSelected ? AppColors.green600 : AppColors.gray600),
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? AppColors.green600 : AppColors.gray600,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppColors.green50,
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
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

  Widget _buildBottomNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
        if (index == 0) {
          final nutritionProvider = context.read<NutritionProvider>();
          final authProvider = context.read<AuthProvider>();
          if (authProvider.isAuthenticated && authProvider.token != null) {
            nutritionProvider.refreshDailyEntries(authProvider.token!);
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.green50 : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 24,
              color: isSelected ? AppColors.green600 : AppColors.gray600,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? AppColors.green600 : AppColors.gray600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardHome extends StatelessWidget {
  final VoidCallback? onSwitchToMeals;

  const DashboardHome({super.key, this.onSwitchToMeals});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      body: Consumer2<AuthProvider, NutritionProvider>(
        builder: (context, authProvider, nutritionProvider, child) {
          if (authProvider.user == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              if (authProvider.token != null) {
                await nutritionProvider.refreshDailyEntries(authProvider.token!);
              }
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with greeting
                  _buildHeader(context, authProvider.user?.username ?? 'User'),
                  const SizedBox(height: 16),

                  // Quick Stats Cards
                  _buildQuickStats(context, nutritionProvider),
                  const SizedBox(height: 16),

                  // Main Calorie Progress Card
                  _buildCalorieProgressCard(context, nutritionProvider),
                  const SizedBox(height: 16),

                  // Macros Overview
                  _buildMacrosOverview(context, nutritionProvider),
                  const SizedBox(height: 16),

                  // Weekly Progress Chart
                  _buildWeeklyChart(context, nutritionProvider),
                  const SizedBox(height: 16),

                  // Recent Meals
                  _buildRecentMeals(context, nutritionProvider),
                  const SizedBox(height: 16),

                  // Motivational Message
                  _buildMotivationalCard(context, nutritionProvider),
                  const SizedBox(height: 80), // Space for bottom nav
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String username) {
    final firstName = username.isNotEmpty ? username.split(' ').first : 'User';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_getGreeting()}, $firstName! 👋',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.gray700,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Here\'s your nutrition overview for today',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.gray600,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickStats(BuildContext context, NutritionProvider provider) {
    final entries = provider.dailyEntries;
    final todayCount = entries.length;
    
    // Calculate streak (simplified - just count today's entries)
    final streak = todayCount > 0 ? 1 : 0;
    
    // Weekly count (simplified)
    final weeklyCount = entries.length;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Meals Today',
          todayCount.toString(),
          Icons.local_fire_department,
          AppColors.green100,
          AppColors.green600,
        ),
        _buildStatCard(
          'Current Streak',
          '$streak days',
          Icons.emoji_events,
          AppColors.orange100,
          AppColors.orange600,
        ),
        _buildStatCard(
          'Goal',
          'Maintenance',
          Icons.flag,
          AppColors.blue100,
          AppColors.blue600,
        ),
        _buildStatCard(
          'This Week',
          '$weeklyCount/7 days',
          Icons.calendar_today,
          AppColors.purple100,
          AppColors.purple600,
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color bgColor, Color iconColor) {
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.gray600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
        ],
      ),
    );
  }

  Widget _buildCalorieProgressCard(BuildContext context, NutritionProvider provider) {
    final totals = provider.dailyTotals;
    final calories = totals?['totalCalories']?.toDouble() ?? 0.0;
    const goalCalories = 2000.0;
    final progress = (calories / goalCalories).clamp(0.0, 1.0);
    final remaining = (goalCalories - calories).clamp(0.0, double.infinity);

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Today\'s Calories',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray700,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: progress >= 1.0 ? AppColors.green100 : AppColors.gray200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  progress >= 1.0 ? 'Goal Met!' : '${(progress * 100).round()}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: progress >= 1.0 ? AppColors.green600 : AppColors.gray600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${calories.round()} / ${goalCalories.round()} kcal',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 16,
              backgroundColor: AppColors.gray200,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress >= 1.0 ? AppColors.green600 : AppColors.green500,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                remaining > 0
                    ? '${remaining.round()} kcal remaining'
                    : '${(calories - goalCalories).round()} kcal over',
                style: TextStyle(
                  fontSize: 12,
                  color: remaining > 0 ? AppColors.gray600 : AppColors.orange600,
                ),
              ),
              if (progress >= 0.9 && progress < 1.1)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.trending_up, size: 16, color: AppColors.green600),
                    SizedBox(width: 4),
                    Text(
                      'On track!',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.green600,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMacrosOverview(BuildContext context, NutritionProvider provider) {
    final totals = provider.dailyTotals;
    final protein = totals?['totalProtein']?.toDouble() ?? 0.0;
    final carbs = totals?['totalCarbs']?.toDouble() ?? 0.0;
    final fat = totals?['totalFat']?.toDouble() ?? 0.0;

    const goalProtein = 150.0;
    const goalCarbs = 200.0;
    const goalFat = 65.0;

    final proteinProgress = (protein / goalProtein).clamp(0.0, 1.0);
    final carbsProgress = (carbs / goalCarbs).clamp(0.0, 1.0);
    final fatProgress = (fat / goalFat).clamp(0.0, 1.0);

    // Calculate macro distribution for pie chart
    final proteinCal = protein * 4;
    final carbsCal = carbs * 4;
    final fatCal = fat * 9;
    final totalCal = proteinCal + carbsCal + fatCal;

    return Row(
      children: [
        Expanded(
          flex: 1,
          child: Container(
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
                  'Macronutrients',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Daily macro breakdown',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.gray600,
                  ),
                ),
                const SizedBox(height: 16),
                _buildMacroProgressBar('Protein', protein, goalProtein, proteinProgress, AppColors.blue500),
                const SizedBox(height: 12),
                _buildMacroProgressBar('Carbs', carbs, goalCarbs, carbsProgress, AppColors.orange500),
                const SizedBox(height: 12),
                _buildMacroProgressBar('Fat', fat, goalFat, fatProgress, AppColors.purple500),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Fiber',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.gray600,
                      ),
                    ),
                    Text(
                      '${(totals?['totalFiber']?.toDouble() ?? 0.0).toStringAsFixed(1)}g',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gray700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 1,
          child: Container(
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
                  'Calorie Distribution',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'How your calories break down',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.gray600,
                  ),
                ),
                const SizedBox(height: 16),
                if (totalCal > 0)
                  Expanded(
                    child: PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 60,
                        sections: [
                          PieChartSectionData(
                            value: proteinCal,
                            color: AppColors.blue500,
                            radius: 80,
                            title: '${((proteinCal / totalCal) * 100).round()}%',
                            titleStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.white,
                            ),
                          ),
                          PieChartSectionData(
                            value: carbsCal,
                            color: AppColors.orange500,
                            radius: 80,
                            title: '${((carbsCal / totalCal) * 100).round()}%',
                            titleStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.white,
                            ),
                          ),
                          PieChartSectionData(
                            value: fatCal,
                            color: AppColors.purple500,
                            radius: 80,
                            title: '${((fatCal / totalCal) * 100).round()}%',
                            titleStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  const Expanded(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.bar_chart, size: 48, color: AppColors.gray400),
                          SizedBox(height: 8),
                          Text(
                            'No meals logged yet today',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.gray400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (totalCal > 0) ...[
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMacroLegend('Protein', AppColors.blue500),
                      _buildMacroLegend('Carbs', AppColors.orange500),
                      _buildMacroLegend('Fat', AppColors.purple500),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMacroProgressBar(String label, double current, double goal, double progress, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
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
                    color: AppColors.gray700,
                  ),
                ),
              ],
            ),
            Text(
              '${current.toStringAsFixed(0)}g / ${goal.toStringAsFixed(0)}g',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.gray700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: AppColors.gray200,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildMacroLegend(String label, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.gray600,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyChart(BuildContext context, NutritionProvider provider) {
    // Simplified weekly data - in real app, this would calculate from entries
    final weeklyData = List.generate(7, (index) {
      final date = DateTime.now().subtract(Duration(days: 6 - index));
      return {
        'day': DateFormat('EEE').format(date),
        'calories': index < provider.dailyEntries.length ? 1500.0 + (index * 200) : 0.0,
        'goal': 2000.0,
      };
    });

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
            '7-Day Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your calorie intake over the past week',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 2500,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < weeklyData.length) {
                          return Text(
                            weeklyData[index]['day'] as String,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.gray600,
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.gray600,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: AppColors.gray200,
                      strokeWidth: 1,
                    );
                  },
                ),
                borderData: FlBorderData(show: false),
                barGroups: weeklyData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final data = entry.value;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: data['calories'] as double,
                        color: AppColors.green500,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8),
                        ),
                      ),
                      BarChartRodData(
                        toY: data['goal'] as double,
                        color: AppColors.gray300,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildChartLegend('Actual', AppColors.green500),
              const SizedBox(width: 24),
              _buildChartLegend('Goal', AppColors.gray300),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartLegend(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.gray600,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentMeals(BuildContext context, NutritionProvider provider) {
    final entries = provider.dailyEntries;
    final todayEntries = entries.take(3).toList();

    if (todayEntries.isEmpty) {
      return const SizedBox.shrink();
    }

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
            'Recent Meals',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your last scanned meals from today',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 16),
          ...todayEntries.map((entry) {
            final calories = entry['calories']?.toDouble() ?? 0.0;
            final foodName = entry['foodName'] ?? 'Unknown';
            final time = _formatEntryTime(entry['createdAt']);

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.gray50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.green100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.restaurant,
                      color: AppColors.green600,
                      size: 32,
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
                            Text(
                              time,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.gray600,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.gray200,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${calories.round()} kcal',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gray700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          foodName,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.gray600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildMotivationalCard(BuildContext context, NutritionProvider provider) {
    final totals = provider.dailyTotals;
    final calories = totals?['totalCalories']?.toDouble() ?? 0.0;
    const goalCalories = 2000.0;
    final progress = (calories / goalCalories).clamp(0.0, 1.0);

    String message;
    if (progress < 0.5) {
      message = 'You\'re just getting started today. Remember to log all your meals!';
    } else if (progress < 0.9) {
      message = 'Great progress! You\'re on track to meet your daily goals.';
    } else if (progress < 1.1) {
      message = 'Excellent! You\'re right on target with your nutrition goals.';
    } else {
      message = 'You\'ve exceeded your calorie goal today. Consider this when planning your next meal.';
    }

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.green50, AppColors.blue100],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.green200),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.green500,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.trending_up,
              color: AppColors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Keep it up!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.gray700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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

