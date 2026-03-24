import 'package:universal_platform/universal_platform.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

// App configuration for different environments
class AppConfig {
  // Base URLs for different environments
  // Development: Backend runs on port 8080, all API endpoints are at /api/*
  static const String _localBaseUrl = 'http://10.0.2.2:8080/api';
  static const String _webBaseUrl = 'http://localhost:8080/api';

  // Get the appropriate base URL based on environment and platform
  static String get baseUrl {
    // Check for ngrok URL from environment variable
    const String ngrokUrl = String.fromEnvironment('NGROK_URL');
    if (ngrokUrl.isNotEmpty) {
      // If ngrok URL already includes /api, use as-is, otherwise add it
      String cleanUrl = ngrokUrl.replaceAll(RegExp(r'/+$'), '');
      return cleanUrl.endsWith('/api') ? cleanUrl : '$cleanUrl/api';
    }

    // Check for custom base URL from environment variable
    const String customUrl = String.fromEnvironment('API_BASE_URL');
    if (customUrl.isNotEmpty) {
      // If custom URL already includes /api, use as-is, otherwise add it
      String cleanUrl = customUrl.replaceAll(RegExp(r'/+$'), '');
      return cleanUrl.endsWith('/api') ? cleanUrl : '$cleanUrl/api';
    }

    // Platform-specific default URLs
    if (UniversalPlatform.isWeb) {
      return _webBaseUrl;
    } else {
      return _localBaseUrl;
    }
  }

  // Check if we're using ngrok
  static bool get isUsingNgrok {
    const String ngrokUrl = String.fromEnvironment('NGROK_URL');
    return ngrokUrl.isNotEmpty;
  }

  // Get the current environment name
  static String get environment {
    if (isUsingNgrok) return 'ngrok';
    const String env = String.fromEnvironment('ENVIRONMENT');
    return env.isEmpty ? 'development' : env;
  }

  // Platform detection
  static bool get isWeb => UniversalPlatform.isWeb;
  static bool get isMobile =>
      UniversalPlatform.isAndroid || UniversalPlatform.isIOS;
  static bool get isDesktop =>
      UniversalPlatform.isWindows ||
      UniversalPlatform.isMacOS ||
      UniversalPlatform.isLinux;

  // Auth0 Configuration
  // Loads from .env file first (web/desktop only), then falls back to --dart-define values
  // Note: Mobile apps should use --dart-define, not .env files
  static String get auth0Domain {
    // Try dotenv first (from .env file) - only if initialized and not on mobile
    if (!isMobile) {
      try {
        final dotenvValue = dotenv.env['AUTH0_DOMAIN'] ?? '';
        if (dotenvValue.isNotEmpty) return dotenvValue;
      } catch (e) {
        // DotEnv not initialized yet, continue to fallback
      }
    }
    
    // Fall back to --dart-define (works on all platforms)
    const dartDefineValue = String.fromEnvironment('AUTH0_DOMAIN', defaultValue: '');
    return dartDefineValue;
  }
  
  static String get auth0ClientId {
    // Try dotenv first (from .env file) - only if initialized and not on mobile
    if (!isMobile) {
      try {
        final dotenvValue = dotenv.env['AUTH0_CLIENT_ID'] ?? '';
        if (dotenvValue.isNotEmpty) return dotenvValue;
      } catch (e) {
        // DotEnv not initialized yet, continue to fallback
      }
    }
    
    // Fall back to --dart-define (works on all platforms)
    const dartDefineValue = String.fromEnvironment('AUTH0_CLIENT_ID', defaultValue: '');
    return dartDefineValue;
  }
  
  static String get auth0Audience {
    // Try dotenv first (from .env file) - only if initialized and not on mobile
    if (!isMobile) {
      try {
        final dotenvValue = dotenv.env['AUTH0_AUDIENCE'] ?? '';
        if (dotenvValue.isNotEmpty) return dotenvValue;
      } catch (e) {
        // DotEnv not initialized yet, continue to fallback
      }
    }
    
    // Fall back to --dart-define (works on all platforms)
    const dartDefineValue = String.fromEnvironment('AUTH0_AUDIENCE', defaultValue: '');
    return dartDefineValue;
  }
  
  // Check if Auth0 is configured
  static bool get isAuth0Configured =>
      auth0Domain.isNotEmpty &&
      auth0ClientId.isNotEmpty &&
      auth0Audience.isNotEmpty;

  // Feature availability based on platform
  static bool get cameraSupported => true; // Camera is now supported on web
  static bool get filePickerSupported =>
      true; // Both web and mobile support file picking
  static bool get tfliteSupported =>
      !isWeb; // TensorFlow Lite not supported on web

  // Responsive breakpoints
  static const double mobileBreakpoint = 600;
  static const double tabletBreakpoint = 1024;
  static const double desktopBreakpoint = 1440;

  // Debug information
  static Map<String, dynamic> get debugInfo {
    // Read environment variables
    const ngrokUrl =
        String.fromEnvironment('NGROK_URL', defaultValue: 'not set');
    const customUrl =
        String.fromEnvironment('API_BASE_URL', defaultValue: 'not set');
    
    // Get Auth0 values (from dotenv or --dart-define)
    final auth0DomainDebug = auth0Domain.isEmpty ? 'not set' : auth0Domain;
    final auth0ClientIdDebug = auth0ClientId.isEmpty ? 'not set' : auth0ClientId;
    final auth0AudienceDebug = auth0Audience.isEmpty ? 'not set' : auth0Audience;

    return {
      'baseUrl': baseUrl,
      'environment': environment,
      'isUsingNgrok': isUsingNgrok,
      'platform': {
        'isWeb': isWeb,
        'isMobile': isMobile,
        'isDesktop': isDesktop,
      },
      'features': {
        'cameraSupported': cameraSupported,
        'filePickerSupported': filePickerSupported,
        'tfliteSupported': tfliteSupported,
      },
      'ngrokUrl': ngrokUrl,
      'customUrl': customUrl,
      'auth0': {
        'domain': auth0DomainDebug,
        'clientId': auth0ClientIdDebug,
        'audience': auth0AudienceDebug,
        'isConfigured': isAuth0Configured,
      },
    };
  }
}
