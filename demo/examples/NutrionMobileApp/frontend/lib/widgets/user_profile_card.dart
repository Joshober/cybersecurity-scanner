import 'package:flutter/material.dart';
import '../models/user.dart';

class UserProfileCard extends StatelessWidget {
  final User user;

  const UserProfileCard({
    super.key,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Theme.of(context).primaryColor,
                  child: Text(
                    user.username.isNotEmpty ? user.username[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back,',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        user.username,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (user.email != null) ...[
              _buildInfoRow(Icons.email, 'Email', user.email!),
              const SizedBox(height: 8),
            ],
            if (user.age != null) ...[
              _buildInfoRow(Icons.cake, 'Age', '${user.age} years'),
              const SizedBox(height: 8),
            ],
            if (user.weight != null) ...[
              _buildInfoRow(Icons.monitor_weight, 'Weight', '${user.weight} kg'),
              const SizedBox(height: 8),
            ],
            if (user.height != null) ...[
              _buildInfoRow(Icons.height, 'Height', '${user.height} cm'),
              const SizedBox(height: 8),
            ],
            if (user.activityLevel != null) ...[
              _buildInfoRow(
                Icons.fitness_center,
                'Activity Level',
                user.activityLevel!.replaceAll('_', ' ').toLowerCase().split(' ').map((word) => 
                  word[0].toUpperCase() + word.substring(1)).join(' '),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey[600],
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
