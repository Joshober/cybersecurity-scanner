import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class EditMealDialog extends StatefulWidget {
  final Map<String, dynamic> entry;
  final Function(Map<String, dynamic>) onSave;

  const EditMealDialog({
    super.key,
    required this.entry,
    required this.onSave,
  });

  @override
  State<EditMealDialog> createState() => _EditMealDialogState();
}

class _EditMealDialogState extends State<EditMealDialog> {
  late TextEditingController _foodNameController;
  late TextEditingController _caloriesController;
  late TextEditingController _proteinController;
  late TextEditingController _carbsController;
  late TextEditingController _fatController;
  late TextEditingController _fiberController;
  late TextEditingController _sugarController;
  late TextEditingController _sodiumController;

  @override
  void initState() {
    super.initState();
    _foodNameController = TextEditingController(
      text: widget.entry['foodName']?.toString() ?? '',
    );
    _caloriesController = TextEditingController(
      text: widget.entry['calories']?.toString() ?? '',
    );
    _proteinController = TextEditingController(
      text: widget.entry['protein']?.toString() ?? '',
    );
    _carbsController = TextEditingController(
      text: widget.entry['carbs']?.toString() ?? '',
    );
    _fatController = TextEditingController(
      text: widget.entry['fat']?.toString() ?? '',
    );
    _fiberController = TextEditingController(
      text: widget.entry['fiber']?.toString() ?? '',
    );
    _sugarController = TextEditingController(
      text: widget.entry['sugar']?.toString() ?? '',
    );
    _sodiumController = TextEditingController(
      text: widget.entry['sodium']?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _foodNameController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    _fiberController.dispose();
    _sugarController.dispose();
    _sodiumController.dispose();
    super.dispose();
  }

  void _handleSave() {
    final updatedEntry = <String, dynamic>{
      'foodName': _foodNameController.text.trim(),
      'calories': double.tryParse(_caloriesController.text),
      'protein': double.tryParse(_proteinController.text),
      'carbs': double.tryParse(_carbsController.text),
      'fat': double.tryParse(_fatController.text),
      'fiber': double.tryParse(_fiberController.text),
      'sugar': double.tryParse(_sugarController.text),
      'sodium': double.tryParse(_sodiumController.text),
    };

    // Remove null values
    updatedEntry.removeWhere((key, value) => value == null);

    widget.onSave(updatedEntry);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(
        'Edit Meal',
        style: TextStyle(
          color: AppColors.gray700,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _foodNameController,
              decoration: const InputDecoration(
                labelText: 'Food Name',
                prefixIcon: Icon(Icons.restaurant, color: AppColors.green600),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _caloriesController,
              decoration: const InputDecoration(
                labelText: 'Calories',
                prefixIcon: Icon(Icons.local_fire_department,
                    color: AppColors.orange600),
                border: OutlineInputBorder(),
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
                      prefixIcon:
                          Icon(Icons.fitness_center, color: AppColors.blue600),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _carbsController,
                    decoration: const InputDecoration(
                      labelText: 'Carbs (g)',
                      prefixIcon: Icon(Icons.grain, color: AppColors.orange500),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _fatController,
                    decoration: const InputDecoration(
                      labelText: 'Fat (g)',
                      prefixIcon:
                          Icon(Icons.water_drop, color: AppColors.purple500),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _fiberController,
                    decoration: const InputDecoration(
                      labelText: 'Fiber (g)',
                      prefixIcon: Icon(Icons.eco, color: AppColors.green500),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _sugarController,
                    decoration: const InputDecoration(
                      labelText: 'Sugar (g)',
                      prefixIcon: Icon(Icons.cake, color: AppColors.orange500),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _sodiumController,
                    decoration: const InputDecoration(
                      labelText: 'Sodium (mg)',
                      prefixIcon: Icon(Icons.health_and_safety,
                          color: AppColors.gray600),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _handleSave,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.green600,
            foregroundColor: AppColors.white,
          ),
          child: const Text('Save'),
        ),
      ],
    );
  }
}
