import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../models/nutrition_calculation.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/nutrition_result_card.dart';

class NutritionCalculatorScreen extends StatefulWidget {
  const NutritionCalculatorScreen({super.key});

  @override
  State<NutritionCalculatorScreen> createState() => _NutritionCalculatorScreenState();
}

class _NutritionCalculatorScreenState extends State<NutritionCalculatorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _ageController = TextEditingController();
  
  String? _selectedSex;
  String? _selectedActivityLevel;
  String? _factorValue;

  final List<String> _sexOptions = ['M', 'F'];
  final List<String> _activityLevels = [
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'SUPER_ACTIVE',
  ];

  @override
  void dispose() {
    _weightController.dispose();
    _heightController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  Future<void> _calculateNutrition() async {
    if (_formKey.currentState!.validate()) {
      final request = NutritionCalculationRequest(
        sex: _selectedSex,
        weight: double.tryParse(_weightController.text),
        height: double.tryParse(_heightController.text),
        age: int.tryParse(_ageController.text),
        activityLevel: _selectedActivityLevel,
        factorValue: _factorValue,
      );

      await context.read<NutritionProvider>().calculateNutrition(request);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nutrition Calculator'),
      ),
      body: SingleChildScrollView(
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
                        controller: _weightController,
                        label: 'Weight (kg)',
                        prefixIcon: Icons.monitor_weight,
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your weight';
                          }
                          final weight = double.tryParse(value);
                          if (weight == null || weight <= 0) {
                            return 'Please enter a valid weight';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: _heightController,
                        label: 'Height (cm)',
                        prefixIcon: Icons.height,
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your height';
                          }
                          final height = double.tryParse(value);
                          if (height == null || height <= 0) {
                            return 'Please enter a valid height';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: _ageController,
                        label: 'Age (years)',
                        prefixIcon: Icons.cake,
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your age';
                          }
                          final age = int.tryParse(value);
                          if (age == null || age <= 0 || age > 120) {
                            return 'Please enter a valid age';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedSex,
                        decoration: const InputDecoration(
                          labelText: 'Sex',
                          prefixIcon: Icon(Icons.person),
                          border: OutlineInputBorder(),
                        ),
                        items: _sexOptions.map((String sex) {
                          return DropdownMenuItem<String>(
                            value: sex,
                            child: Text(sex == 'M' ? 'Male' : 'Female'),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedSex = newValue;
                          });
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please select your sex';
                          }
                          return null;
                        },
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
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please select your activity level';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: TextEditingController(text: _factorValue),
                        label: 'Activity Factor (optional)',
                        prefixIcon: Icons.tune,
                        keyboardType: TextInputType.number,
                        onChanged: (value) {
                          _factorValue = value;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Consumer<NutritionProvider>(
                builder: (context, nutritionProvider, child) {
                  return CustomButton(
                    text: 'Calculate Nutrition',
                    onPressed: nutritionProvider.isLoading ? null : _calculateNutrition,
                    isLoading: nutritionProvider.isLoading,
                  );
                },
              ),
              const SizedBox(height: 16),
              Consumer<NutritionProvider>(
                builder: (context, nutritionProvider, child) {
                  if (nutritionProvider.error != null) {
                    return Card(
                      color: Colors.red[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          nutritionProvider.error!,
                          style: TextStyle(color: Colors.red[700]),
                        ),
                      ),
                    );
                  }

                  if (nutritionProvider.calculationResult != null) {
                    return NutritionResultCard(
                      result: nutritionProvider.calculationResult!,
                    );
                  }

                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
