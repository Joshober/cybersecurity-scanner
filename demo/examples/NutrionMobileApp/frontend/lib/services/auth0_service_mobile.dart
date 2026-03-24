// Mobile-specific Auth0 implementation (stub - actual implementation in main file)
// This file is only used on non-web platforms
import 'package:auth0_flutter/auth0_flutter.dart';

class Auth0ServiceWeb {
  // These methods should never be called on mobile
  // The main Auth0Service will use the mobile implementation directly
  static Future<Credentials> signInWithGoogle() {
    throw UnimplementedError('Use Auth0Service.signInWithGoogle() instead');
  }

  static Future<Credentials?> handleCallback() {
    return Future.value(null);
  }

  static Future<void> signOut() {
    return Future.value();
  }
}

