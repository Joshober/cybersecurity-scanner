import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../widgets/nutrition_card.dart';
import '../../widgets/custom_text_field.dart';

class NutritionPlansScreen extends StatefulWidget {
  const NutritionPlansScreen({super.key});

  @override
  State<NutritionPlansScreen> createState() => _NutritionPlansScreenState();
}

class _NutritionPlansScreenState extends State<NutritionPlansScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // Load all nutrition plans when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NutritionProvider>().loadAllNutritionPlans();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _searchPlans() {
    setState(() {
      _searchQuery = _searchController.text.trim();
    });
    
    if (_searchQuery.isEmpty) {
      context.read<NutritionProvider>().loadAllNutritionPlans();
    } else {
      context.read<NutritionProvider>().searchNutritionPlansByName(_searchQuery);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nutrition Plans'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: _searchController,
                    label: 'Search plans...',
                    prefixIcon: Icons.search,
                    onChanged: (value) {
                      if (value.isEmpty) {
                        _searchPlans();
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _searchPlans,
                  icon: const Icon(Icons.search),
                  style: IconButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
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
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading nutrition plans',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          nutritionProvider.error!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
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
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.restaurant_menu,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty 
                              ? 'No nutrition plans available'
                              : 'No plans found for "$_searchQuery"',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _searchQuery.isEmpty
                              ? 'Check back later for new plans'
                              : 'Try a different search term',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        if (_searchQuery.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              _searchController.clear();
                              _searchPlans();
                            },
                            child: const Text('Clear Search'),
                          ),
                        ],
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  itemCount: nutritionProvider.nutritionPlans.length,
                  itemBuilder: (context, index) {
                    final plan = nutritionProvider.nutritionPlans[index];
                    return NutritionCard(plan: plan);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
