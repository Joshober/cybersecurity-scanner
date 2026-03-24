import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/nutrition_plan.dart';

class NutritionChatbot extends StatefulWidget {
  const NutritionChatbot({super.key});

  @override
  State<NutritionChatbot> createState() => _NutritionChatbotState();
}

class _NutritionChatbotState extends State<NutritionChatbot> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _includeBioData = false;

  @override
  void initState() {
    super.initState();
    _messages.add(ChatMessage(
      text: "Hi! I'm your nutrition assistant. Describe your goals, lifestyle, or any specific dietary needs, and I'll create a personalized nutrition plan for you.",
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isLoading) return;

    // Add user message
    setState(() {
      _messages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _messageController.clear();
      _isLoading = true;
    });

    _scrollToBottom();

    try {
      final authProvider = context.read<AuthProvider>();
      final user = authProvider.user;
      final token = authProvider.token;

      if (token == null || user == null) {
        throw Exception('Please log in to use the chatbot');
      }

      // Prepare request
      final requestData = {
        'userDescription': text,
        'includeBioData': _includeBioData,
        if (_includeBioData) ...{
          'age': user.age,
          'weight': user.weight,
          'height': user.height,
          'activityLevel': user.activityLevel,
          'vegan': user.vegan,
          'vegetarian': user.vegetarian,
        },
      };

      // Call API
      final response = await ApiService.generatePersonalizedPlan(token, requestData);

      // Add bot response
      setState(() {
        if (response.containsKey('plan')) {
          final plan = NutritionPlan.fromJson(response['plan']);
          _messages.add(ChatMessage(
            text: 'I\'ve created a personalized nutrition plan for you!\n\n'
                  '**${plan.name}**\n\n'
                  '${plan.description ?? "No description available"}\n\n'
                  '**Daily Targets:**\n'
                  '• Calories: ${plan.dailyCalories ?? "N/A"}\n'
                  '• Carbohydrates: ${plan.carbohydratesG ?? "N/A"}g\n'
                  '• Proteins: ${plan.proteinsG ?? "N/A"}g\n'
                  '• Fats: ${plan.fatsG ?? "N/A"}g\n'
                  '• Hydration: ${plan.hydration ?? "N/A"}L',
            isUser: false,
            timestamp: DateTime.now(),
            plan: plan,
          ));
        } else {
          _messages.add(ChatMessage(
            text: 'I\'ve generated a plan for you, but there was an issue displaying it. Please try again.',
            isUser: false,
            timestamp: DateTime.now(),
          ));
        }
        _isLoading = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          text: 'Sorry, I encountered an error: ${e.toString()}',
          isUser: false,
          timestamp: DateTime.now(),
        ));
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                const Icon(Icons.smart_toy, color: Colors.white),
                const SizedBox(width: 8),
                const Text(
                  'AI Nutrition Assistant',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageBubble(message);
              },
            ),
          ),

          // Input area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[850],
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Bio data checkbox
                CheckboxListTile(
                  title: const Text(
                    'Include my bio data (age, weight, height, activity level)',
                    style: TextStyle(color: Colors.white),
                  ),
                  value: _includeBioData,
                  onChanged: (value) {
                    setState(() {
                      _includeBioData = value ?? false;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  tileColor: Colors.transparent,
                ),
                
                // Text input and send button
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Describe your goals or situation...',
                          hintStyle: TextStyle(color: Colors.grey[400]),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: Colors.grey[700]!),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: Colors.grey[700]!),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: Theme.of(context).primaryColor),
                          ),
                          filled: true,
                          fillColor: Colors.grey[800],
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        maxLines: null,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FloatingActionButton(
                      mini: true,
                      onPressed: _isLoading ? null : _sendMessage,
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(Icons.send),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isUser
              ? Theme.of(context).primaryColor
              : Colors.grey[800],
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.text,
              style: TextStyle(
                color: message.isUser ? Colors.white : Colors.white,
                fontSize: 14,
              ),
            ),
            if (message.plan != null) ...[
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () async {
                  // Apply the plan via AuthProvider
                  final authProvider = context.read<AuthProvider>();
                  await authProvider.applyNutritionPlan(message.plan!.id!);
                  if (mounted) {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Nutrition plan applied successfully!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.check_circle),
                label: const Text('Apply This Plan'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final NutritionPlan? plan;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.plan,
  });
}

