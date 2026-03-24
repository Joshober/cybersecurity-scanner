# Nutrition App Frontend

Flutter frontend for the Nutrition App with modern UI, state management, and comprehensive nutrition tracking features.

## Quick Start

### Prerequisites
- Flutter 3.0+
- Dart 3.0+
- Android Studio / VS Code
- Android SDK / iOS SDK

### Running the Application

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the application**
   ```bash
   flutter run
   ```

4. **Build for production**
   ```bash
   # Android
   flutter build apk
   
   # iOS
   flutter build ios
   
   # Web
   flutter build web
   ```

## Features

### Authentication
- User login and registration
- JWT token management
- Secure local storage
- Auto-login functionality

### User Interface
- Modern Material Design 3
- Dark/Light theme support
- Responsive design
- Interactive charts and graphs
- Smooth animations

### Nutrition Features
- Personalized nutrition calculations
- BMR (Basal Metabolic Rate) calculation
- Macronutrient distribution
- Activity level-based recommendations
- Nutrition plan browsing and search

### State Management
- Provider pattern for state management
- Reactive UI updates
- Error handling and loading states
- Persistent user data

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── user.dart
│   ├── nutrition_plan.dart
│   └── nutrition_calculation.dart
├── providers/                # State management
│   ├── auth_provider.dart
│   └── nutrition_provider.dart
├── screens/                  # UI screens
│   ├── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   └── home/
│       ├── dashboard_screen.dart
│       ├── nutrition_calculator_screen.dart
│       ├── nutrition_plans_screen.dart
│       └── profile_screen.dart
├── widgets/                  # Reusable widgets
│   ├── custom_text_field.dart
│   ├── custom_button.dart
│   ├── user_profile_card.dart
│   ├── nutrition_card.dart
│   └── nutrition_result_card.dart
├── services/                 # API services
│   └── api_service.dart
└── utils/                    # Utilities
    └── app_theme.dart
```

## UI Components

### Custom Widgets

#### CustomTextField
```dart
CustomTextField(
  controller: controller,
  label: 'Username',
  prefixIcon: Icons.person,
  validator: (value) => value?.isEmpty == true ? 'Required' : null,
)
```

#### CustomButton
```dart
CustomButton(
  text: 'Login',
  onPressed: () => _login(),
  isLoading: isLoading,
)
```

#### NutritionCard
```dart
NutritionCard(
  plan: nutritionPlan,
)
```

### Theme Configuration
```dart
// Light theme
ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
  // ... other configurations
);

// Dark theme
ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: primaryColor,
    brightness: Brightness.dark,
  ),
  // ... other configurations
);
```

## Configuration

### API Configuration
Update the API base URL in `lib/services/api_service.dart`:
```dart
class ApiService {
  static const String baseUrl = 'http://localhost:8080/api';
  // ... rest of the service
}
```

### Dependencies
Key dependencies in `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.1          # State management
  http: ^1.1.0              # HTTP client
  shared_preferences: ^2.2.2 # Local storage
  fl_chart: ^0.66.0         # Charts
  intl: ^0.19.0             # Internationalization
```

## State Management

### AuthProvider
Manages user authentication state:
```dart
class AuthProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;
  
  Future<void> login(String username, String password) async {
    // Login logic
  }
  
  Future<void> register(Map<String, dynamic> userData) async {
    // Registration logic
  }
}
```

### NutritionProvider
Manages nutrition-related state:
```dart
class NutritionProvider with ChangeNotifier {
  List<NutritionPlan> _nutritionPlans = [];
  NutritionCalculationResponse? _calculationResult;
  
  Future<void> calculateNutrition(NutritionCalculationRequest request) async {
    // Calculation logic
  }
}
```

## Testing

### Run Tests
```bash
flutter test
```

### Test Coverage
```bash
flutter test --coverage
```

### Widget Tests
```dart
testWidgets('Login screen test', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());
  expect(find.text('Welcome Back'), findsOneWidget);
});
```

## Building and Deployment

### Android
```bash
# Debug build
flutter build apk --debug

# Release build
flutter build apk --release

# App bundle (recommended for Play Store)
flutter build appbundle --release
```

### iOS
```bash
# Build for iOS
flutter build ios --release

# Archive for App Store
flutter build ipa --release
```

### Web
```bash
# Build for web
flutter build web --release

# Serve locally
flutter run -d web-server --web-port 8080
```

## Platform Support

### Android
- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- Architecture: arm64-v8a, armeabi-v7a, x86_64

### iOS
- Minimum iOS: 11.0
- Target iOS: 17.0
- Architecture: arm64, x86_64

### Web
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and desktop

## Design Guidelines

### Color Scheme
```dart
class AppTheme {
  static const Color primaryColor = Color(0xFF2E7D32);
  static const Color secondaryColor = Color(0xFF4CAF50);
  static const Color accentColor = Color(0xFF8BC34A);
  static const Color errorColor = Color(0xFFE53935);
}
```

### Typography
- Headlines: Roboto Bold
- Body text: Roboto Regular
- Captions: Roboto Medium

### Spacing
- Small: 8px
- Medium: 16px
- Large: 24px
- Extra Large: 32px

## Development

### Code Style
- Follow Dart/Flutter conventions
- Use meaningful variable names
- Add comments for complex logic
- Maintain consistent formatting

### Performance Tips
- Use `const` constructors where possible
- Implement proper list builders
- Optimize image loading
- Use efficient state management

### Debugging
```bash
# Enable debug mode
flutter run --debug

# Hot reload
r

# Hot restart
R

# Quit
q
```

## Troubleshooting

### Common Issues

1. **Build errors**
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

2. **Dependency conflicts**
   ```bash
   flutter pub deps
   flutter pub upgrade
   ```

3. **Platform-specific issues**
   ```bash
   # Android
   flutter doctor --android-licenses
   
   # iOS
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

### Performance Issues
- Use `flutter run --profile` for performance testing
- Check for memory leaks with Flutter Inspector
- Optimize widget rebuilds with proper state management

## Analytics and Monitoring

### Crash Reporting
```dart
// Add crash reporting
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

FirebaseCrashlytics.instance.recordError(
  error,
  stackTrace,
  reason: 'User action caused error',
);
```

### Performance Monitoring
```dart
// Track user interactions
import 'package:firebase_analytics/firebase_analytics.dart';

FirebaseAnalytics.instance.logEvent(
  name: 'nutrition_calculated',
  parameters: {
    'user_age': age,
    'activity_level': activityLevel,
  },
);
```

## Future Enhancements

- [ ] Offline mode support
- [ ] Push notifications
- [ ] Social features
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Performance optimizations

---

Built with Flutter
