import 'package:flutter/material.dart';
import '../models/nutrition_plan.dart';

class NutritionCard extends StatelessWidget {
  final NutritionPlan plan;

  const NutritionCard({
    super.key,
    required this.plan,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    plan.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Plan',
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            if (plan.description != null) ...[
              const SizedBox(height: 8),
              Text(
                plan.description!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                if (plan.dailyCalories != null) ...[
                  _buildNutritionInfo('Calories', '${plan.dailyCalories} kcal'),
                  const SizedBox(width: 16),
                ],
                if (plan.proteinsG != null) ...[
                  _buildNutritionInfo('Protein', '${plan.proteinsG}g'),
                  const SizedBox(width: 16),
                ],
                if (plan.carbohydratesG != null) ...[
                  _buildNutritionInfo('Carbs', '${plan.carbohydratesG}g'),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (plan.age != null && plan.age != 'A') ...[
                  _buildInfoChip('Age: ${plan.age}'),
                  const SizedBox(width: 8),
                ],
                if (plan.sex != null && plan.sex != 'A') ...[
                  _buildInfoChip('Sex: ${plan.sex}'),
                  const SizedBox(width: 8),
                ],
                if (plan.height != null && plan.height != 'A') ...[
                  _buildInfoChip('Height: ${plan.height}'),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNutritionInfo(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
