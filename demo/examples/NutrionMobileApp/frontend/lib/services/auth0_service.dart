import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:universal_platform/universal_platform.dart';
import '../config/app_config.dart';

// Conditional imports for web
import 'auth0_service_web.dart' if (dart.library.io) 'auth0_service_mobile.dart' as platform;

/// Service for handling Auth0 authentication
class Auth0Service {
  static Auth0? _auth0;
  
  /// Initialize Auth0 instance
  static Auth0 get auth0 {
    if (_auth0 == null) {
      if (!AppConfig.isAuth0Configured) {
        throw Exception(
          'Auth0 is not configured. Please set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_AUDIENCE environment variables.',
        );
      }
      _auth0 = Auth0(
        AppConfig.auth0Domain,
        AppConfig.auth0ClientId,
      );
    }
    return _auth0!;
  }

  /// Sign in with Google using Auth0
  /// Uses different methods for web vs mobile
  /// Returns null on web when redirect happens (callback will handle it)
  static Future<Credentials?> signInWithGoogle() async {
    if (UniversalPlatform.isWeb) {
      // Web: Use URL redirect flow (may return null if redirect happens)
      return platform.Auth0ServiceWeb.signInWithGoogle();
    } else {
      // Mobile: Use auth0_flutter package
      return _signInWithGoogleMobile();
    }
  }

  /// Mobile implementation: Use auth0_flutter package
  static Future<Credentials> _signInWithGoogleMobile() async {
    try {
      final auth0Instance = auth0;
      final webAuth = auth0Instance.webAuthentication();
      
      final credentials = await webAuth.login(
        parameters: {
          'connection': 'google-oauth2',
          'audience': AppConfig.auth0Audience,
        },
      );
      
      return credentials;
    } catch (e) {
      throw Exception('Failed to sign in with Google: $e');
    }
  }

  /// Handle Auth0 callback on web (called after redirect)
  static Future<Credentials?> handleWebCallback() async {
    if (!UniversalPlatform.isWeb) {
      return null;
    }
    return platform.Auth0ServiceWeb.handleCallback();
  }

  /// Sign in with username/password (if using Auth0 database connection)
  static Future<Credentials> signInWithPassword({
    required String username,
    required String password,
  }) async {
    try {
      final auth0Instance = auth0;
      final webAuth = auth0Instance.webAuthentication();
      
      final credentials = await webAuth.login(
        parameters: {
          'username': username,
          'password': password,
          'audience': AppConfig.auth0Audience,
        },
      );
      
      return credentials;
    } catch (e) {
      throw Exception('Failed to sign in: $e');
    }
  }

  /// Get user information from Auth0 token
  /// Note: User info is typically included in the ID token
  static Map<String, dynamic> getUserInfoFromToken(Credentials credentials) {
    try {
      // The ID token contains user information
      // In a real implementation, you might want to decode the ID token
      // For now, we'll return basic info from credentials
      return {
        'accessToken': credentials.accessToken,
        'idToken': credentials.idToken,
      };
    } catch (e) {
      throw Exception('Failed to get user info: $e');
    }
  }

  /// Sign out
  static Future<void> signOut() async {
    if (UniversalPlatform.isWeb) {
      // Web: Use URL redirect
      await platform.Auth0ServiceWeb.signOut();
    } else {
      // Mobile: Use auth0_flutter package
      try {
        final auth0Instance = auth0;
        await auth0Instance.webAuthentication().logout();
      } catch (e) {
        // Logout might fail if user is not logged in, which is fine
        print('Logout error (may be expected): $e');
      }
    }
  }

  /// Check if user is authenticated (has valid credentials)
  static Future<bool> isAuthenticated() async {
    try {
      final auth0Instance = auth0;
      final credentialsManager = auth0Instance.credentialsManager;
      final credentials = await credentialsManager.credentials();
      return credentials.accessToken.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Get current access token
  static Future<String?> getAccessToken() async {
    try {
      final auth0Instance = auth0;
      final credentialsManager = auth0Instance.credentialsManager;
      final credentials = await credentialsManager.credentials();
      return credentials.accessToken;
    } catch (e) {
      return null;
    }
  }
}

