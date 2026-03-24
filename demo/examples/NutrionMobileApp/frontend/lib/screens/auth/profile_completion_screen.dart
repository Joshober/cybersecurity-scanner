import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/height_input_field.dart';
import '../../widgets/custom_button.dart';
import '../home/dashboard_screen.dart';

class ProfileCompletionScreen extends StatefulWidget {
  const ProfileCompletionScreen({super.key});

  @override
  State<ProfileCompletionScreen> createState() => _ProfileCompletionScreenState();
}

class _ProfileCompletionScreenState extends State<ProfileCompletionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _ageController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  
  String? _selectedActivityLevel;
  bool _isVegan = false;
  bool _isVegetarian = false;

  final List<String> _activityLevels = [
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'SUPER_ACTIVE',
  ];

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _ageController.text = user.age?.toString() ?? '';
      _weightController.text = user.weight ?? '';
      _heightController.text = user.height ?? '';
      _selectedActivityLevel = user.activityLevel;
      _isVegan = user.vegan ?? false;
      _isVegetarian = user.vegetarian ?? false;
    }
  }

  @override
  void dispose() {
    _ageController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  Future<void> _completeProfile() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      
      final userData = {
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
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Your Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.person_add_alt_1,
                  size: 80,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(height: 24),
                Text(
                  'Complete Your Profile',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'We need a few more details to personalize your nutrition journey',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
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
                HeightInputField(
                  controller: _heightController,
                  label: 'Height',
                  prefixIcon: Icons.height,
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
                DropdownButtonFormField<String>(
                  value: _selectedActivityLevel,
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
                CheckboxListTile(
                  title: const Text('Vegetarian'),
                  value: _isVegetarian,
                  onChanged: (bool? value) {
                    setState(() {
                      _isVegetarian = value ?? false;
                      if (_isVegetarian && _isVegan) {
                        _isVegan = false;
                      }
                    });
                  },
                ),
                CheckboxListTile(
                  title: const Text('Vegan'),
                  value: _isVegan,
                  onChanged: (bool? value) {
                    setState(() {
                      _isVegan = value ?? false;
                      if (_isVegan && _isVegetarian) {
                        _isVegetarian = false;
                      }
                    });
                  },
                ),
                const SizedBox(height: 24),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    return CustomButton(
                      text: 'Complete Profile',
                      onPressed: authProvider.isLoading ? null : _completeProfile,
                      isLoading: authProvider.isLoading,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

