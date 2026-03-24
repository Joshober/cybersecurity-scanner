import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/nutrition_calculator_modal.dart';
import '../../widgets/nutrition_result_card.dart';
import '../../widgets/height_input_field.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _emailController;
  late TextEditingController _ageController;
  late TextEditingController _weightController;
  late TextEditingController _heightController;
  
  String? _selectedActivityLevel;
  bool _isVegan = false;
  bool _isVegetarian = false;
  bool _showCalculator = false;

  final List<String> _activityLevels = [
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'SUPER_ACTIVE',
  ];

  late TextEditingController _dailyCaloriesController;
  late TextEditingController _proteinController;
  late TextEditingController _carbsController;
  late TextEditingController _fatController;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _emailController = TextEditingController(text: user.email ?? '');
      _ageController = TextEditingController(text: user.age?.toString() ?? '');
      _weightController = TextEditingController(text: user.weight ?? '');
      _heightController = TextEditingController(text: user.height ?? '');
      _selectedActivityLevel = user.activityLevel;
      _isVegan = user.vegan ?? false;
      _isVegetarian = user.vegetarian ?? false;
      _dailyCaloriesController = TextEditingController(text: user.dailyCalories ?? '');
      _proteinController = TextEditingController(text: user.proteinsG ?? '');
      _carbsController = TextEditingController(text: user.carbohydratesG ?? '');
      _fatController = TextEditingController(text: user.fatsG ?? '');
    } else {
      _emailController = TextEditingController();
      _ageController = TextEditingController();
      _weightController = TextEditingController();
      _heightController = TextEditingController();
      _dailyCaloriesController = TextEditingController();
      _proteinController = TextEditingController();
      _carbsController = TextEditingController();
      _fatController = TextEditingController();
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _ageController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _dailyCaloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }

  Future<void> _updateProfile() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      
      final userData = {
        'email': _emailController.text.trim(),
        'age': int.tryParse(_ageController.text.trim()),
        'weight': _weightController.text.trim(),
        'height': _heightController.text.trim(),
        'activityLevel': _selectedActivityLevel,
        'vegan': _isVegan,
        'vegetarian': _isVegetarian,
      };

      await authProvider.updateUser(userData);

      if (authProvider.error == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authProvider.error!),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _updateGoals() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.token == null) return;

    try {
      await ApiService.updateUserGoals(
        token: authProvider.token!,
        dailyCalories: _dailyCaloriesController.text.trim().isEmpty
            ? null
            : _dailyCaloriesController.text.trim(),
        carbohydratesG: _carbsController.text.trim().isEmpty
            ? null
            : _carbsController.text.trim(),
        proteinsG: _proteinController.text.trim().isEmpty
            ? null
            : _proteinController.text.trim(),
        fatsG: _fatController.text.trim().isEmpty
            ? null
            : _fatController.text.trim(),
      );

      await authProvider.refreshUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Goals updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update goals: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildGoalsForm(AuthProvider authProvider) {
    return Column(
      children: [
        TextField(
          controller: _dailyCaloriesController,
          decoration: const InputDecoration(
            labelText: 'Daily Calories',
            prefixIcon: Icon(Icons.local_fire_department),
            border: OutlineInputBorder(),
            helperText: 'Leave empty to use calculated goals',
          ),
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _proteinController,
                decoration: const InputDecoration(
                  labelText: 'Protein (g)',
                  prefixIcon: Icon(Icons.fitness_center),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _carbsController,
                decoration: const InputDecoration(
                  labelText: 'Carbs (g)',
                  prefixIcon: Icon(Icons.grain),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _fatController,
          decoration: const InputDecoration(
            labelText: 'Fat (g)',
            prefixIcon: Icon(Icons.water_drop),
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _updateGoals,
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
            ),
            child: const Text('Save Goals'),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.user == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Theme.of(context).primaryColor,
                            child: Text(
                              authProvider.user!.username.isNotEmpty 
                                  ? authProvider.user!.username[0].toUpperCase() 
                                  : 'U',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            authProvider.user!.username,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Member since ${DateTime.now().year}',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Personal Information',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          CustomTextField(
                            controller: _emailController,
                            label: 'Email',
                            prefixIcon: Icons.email,
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your email';
                              }
                              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                return 'Please enter a valid email';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          CustomTextField(
                            controller: _ageController,
                            label: 'Age',
                            prefixIcon: Icons.cake,
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your age';
                              }
                              final age = int.tryParse(value);
                              if (age == null || age < 1 || age > 120) {
                                return 'Please enter a valid age';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          CustomTextField(
                            controller: _weightController,
                            label: 'Weight (kg)',
                            prefixIcon: Icons.monitor_weight,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 16),
                          HeightInputField(
                            controller: _heightController,
                            label: 'Height',
                            prefixIcon: Icons.height,
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedActivityLevel,
                            decoration: const InputDecoration(
                              labelText: 'Activity Level',
                              prefixIcon: Icon(Icons.fitness_center),
                              border: OutlineInputBorder(),
                            ),
                            items: _activityLevels.map((String level) {
                              return DropdownMenuItem<String>(
                                value: level,
                                child: Text(level.replaceAll('_', ' ').toLowerCase().split(' ').map((word) => 
                                  word[0].toUpperCase() + word.substring(1)).join(' ')),
                              );
                            }).toList(),
                            onChanged: (String? newValue) {
                              setState(() {
                                _selectedActivityLevel = newValue;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          CheckboxListTile(
                            title: const Text('Vegetarian'),
                            value: _isVegetarian,
                            onChanged: (bool? value) {
                              setState(() {
                                _isVegetarian = value ?? false;
                              });
                            },
                          ),
                          CheckboxListTile(
                            title: const Text('Vegan'),
                            value: _isVegan,
                            onChanged: (bool? value) {
                              setState(() {
                                _isVegan = value ?? false;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Update Profile',
                    onPressed: authProvider.isLoading ? null : _updateProfile,
                    isLoading: authProvider.isLoading,
                  ),
                  const SizedBox(height: 24),
                  
                  // Nutrition Goals Section
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Nutrition Goals',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (authProvider.user?.dailyCalories != null ||
                                  authProvider.user?.proteinsG != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green[100],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Custom',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.green,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Set your daily calorie and macro targets',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildGoalsForm(authProvider),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Nutrition Calculator Section
                  Card(
                    child: ExpansionTile(
                      title: const Text(
                        'Nutrition Goals Calculator',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: const Text('Calculate your daily nutrition goals'),
                      leading: const Icon(Icons.calculate),
                      initiallyExpanded: _showCalculator,
                      onExpansionChanged: (expanded) {
                        setState(() {
                          _showCalculator = expanded;
                        });
                      },
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: NutritionCalculatorModal(
                            prefillFromProfile: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Show calculated goals if available
                  Consumer<NutritionProvider>(
                    builder: (context, nutritionProvider, child) {
                      if (nutritionProvider.calculationResult != null) {
                        return Column(
                          children: [
                            const SizedBox(height: 16),
                            Card(
                              color: Colors.blue[50],
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.flag, color: Colors.blue[700]),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Your Nutrition Goals',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue[900],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    NutritionResultCard(
                                      result: nutritionProvider.calculationResult!,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  
                  const SizedBox(height: 16),
                  Card(
                    color: Colors.red[50],
                    child: ListTile(
                      leading: Icon(Icons.logout, color: Colors.red[700]),
                      title: Text(
                        'Logout',
                        style: TextStyle(
                          color: Colors.red[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onTap: () {
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
                                  authProvider.logout();
                                  Navigator.of(context).pop();
                                },
                                child: const Text('Logout'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
