import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:universal_platform/universal_platform.dart';
import 'providers/auth_provider.dart';
import 'providers/nutrition_provider.dart';
import 'providers/menu_provider.dart';
import 'screens/splash_screen.dart';
import 'utils/app_theme.dart';
import 'config/app_config.dart';

// Load .env file with timeout to prevent blocking
// Note: Only works on web/desktop, not on mobile
Future<void> _loadEnvFile() async {
  // Skip .env loading on mobile - use --dart-define instead
  if (UniversalPlatform.isAndroid || UniversalPlatform.isIOS) {
    if (kDebugMode) {
    }
    return;
  }

  try {
    // Try root .env file (../.env) - same file the backend uses
    await dotenv.load(fileName: '../.env').timeout(
      const Duration(seconds: 2),
      onTimeout: () {
        throw TimeoutException('Loading .env timed out');
      },
    );
    if (kDebugMode) {
    }
    return;
  } catch (e) {
    // Try frontend/.env file (fallback)
    try {
      await dotenv.load(fileName: '.env').timeout(
        const Duration(seconds: 2),
        onTimeout: () {
          throw TimeoutException('Loading .env timed out');
        },
      );
      if (kDebugMode) {
      }
      return;
    } catch (e2) {
      // .env file not found - that's okay, will use --dart-define values
      if (kDebugMode) {
      }
    }
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env file (non-blocking)
  _loadEnvFile();

  final prefs = await SharedPreferences.getInstance();

  runApp(MyApp(prefs: prefs));
}

class MyApp extends StatelessWidget {
  final SharedPreferences prefs;

  const MyApp({super.key, required this.prefs});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (context) => AuthProvider(prefs: prefs),
        ),
        ChangeNotifierProvider(
          create: (context) => NutritionProvider(),
        ),
        ChangeNotifierProvider(
          create: (context) => MenuProvider(),
        ),
      ],
      child: MaterialApp(
        title: 'Nutrition App',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const SplashScreen(),
        debugShowCheckedModeBanner: false,
        builder: (context, child) => ResponsiveBreakpoints.builder(
          child: child!,
          breakpoints: [
            const Breakpoint(start: 0, end: 450, name: MOBILE),
            const Breakpoint(start: 451, end: 800, name: TABLET),
            const Breakpoint(start: 801, end: 1920, name: DESKTOP),
            const Breakpoint(start: 1921, end: double.infinity, name: '4K'),
          ],
        ),
      ),
    );
  }
}
