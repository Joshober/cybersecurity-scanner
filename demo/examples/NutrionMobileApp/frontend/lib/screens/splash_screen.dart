import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'auth/login_screen.dart';
import 'auth/profile_completion_screen.dart';
import 'home/dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Load stored authentication (this will handle Auth0 callback if present)
    await context.read<AuthProvider>().loadStoredAuth();
    
    // Wait a bit for splash effect (but shorter if Auth0 callback was processed)
    await Future.delayed(const Duration(seconds: 1));
    
    // Navigate to appropriate screen
    if (mounted) {
      final authProvider = context.read<AuthProvider>();
      
      // Listen to auth changes in case Auth0 login completes after initial check
      authProvider.addListener(_onAuthStateChanged);
      
      if (authProvider.isAuthenticated) {
        // Check if profile is complete
        if (authProvider.user != null && !authProvider.user!.isProfileComplete) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const ProfileCompletionScreen()),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        }
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }
  
  void _onAuthStateChanged() {
    if (mounted) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        // User just logged in, check profile completeness
        if (authProvider.user != null && !authProvider.user!.isProfileComplete) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const ProfileCompletionScreen()),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        }
      }
    }
  }
  
  @override
  void dispose() {
    context.read<AuthProvider>().removeListener(_onAuthStateChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.restaurant_menu,
              size: 100,
              color: Colors.white,
            ),
            const SizedBox(height: 24),
            Text(
              'Nutrition App',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your Personal Nutrition Guide',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
