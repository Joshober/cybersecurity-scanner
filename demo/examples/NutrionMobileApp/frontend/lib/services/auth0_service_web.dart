// Web-specific Auth0 implementation using URL redirects
import 'dart:convert';
import 'dart:html' as html;
import 'dart:math';
import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'package:crypto/crypto.dart';

/// Minimal UserInfo class to match auth0_flutter's expected structure
/// This is a workaround since UserInfo may not be directly accessible from the package
class _UserInfo {
  final String sub;
  final String name;
  final String email;
  
  const _UserInfo({
    required this.sub,
    required this.name,
    required this.email,
  });
}

/// Decode JWT token to extract payload
Map<String, dynamic> _decodeJwt(String token) {
  final parts = token.split('.');
  if (parts.length != 3) {
    return {};
  }
  
  try {
    // Decode base64url
    final payload = parts[1];
    // Add padding if needed
    final normalized = base64.normalize(payload);
    final decoded = utf8.decode(base64.decode(normalized));
    return jsonDecode(decoded) as Map<String, dynamic>;
  } catch (e) {
    return {};
  }
}

/// Construct UserInfo object for Credentials
/// Note: This is a workaround - the actual UserInfo from auth0_flutter may have a different structure
/// We create a compatible object that should work with Credentials constructor
dynamic _constructUserInfo({required String sub, required String name, required String email}) {
  // Try to use the actual UserInfo from auth0_flutter if available
  // Otherwise, create a compatible structure
  // The Credentials constructor should accept this
  return _UserInfo(sub: sub, name: name, email: email);
}


class Auth0ServiceWeb {
  /// Generate PKCE code verifier and challenge
  static Map<String, String> _generatePKCE() {
    // Generate code_verifier (43-128 characters, URL-safe base64)
    final random = Random.secure();
    final verifierBytes = List<int>.generate(32, (i) => random.nextInt(256));
    final codeVerifier = base64UrlEncode(verifierBytes);
    
    // Generate code_challenge (SHA256 hash of verifier, base64url encoded)
    final codeChallengeBytes = sha256.convert(utf8.encode(codeVerifier)).bytes;
    final codeChallenge = base64UrlEncode(codeChallengeBytes);
    
    return {
      'code_verifier': codeVerifier,
      'code_challenge': codeChallenge,
    };
  }
  
  /// Base64 URL-safe encoding (replaces + with -, / with _, and removes padding)
  static String base64UrlEncode(List<int> bytes) {
    return base64
        .encode(bytes)
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
  }

  /// Sign in with Google using URL redirect (web only)
  /// Returns null because the page will redirect
  static Future<Credentials?> signInWithGoogle() async {
    if (!AppConfig.isAuth0Configured) {
      throw Exception('Auth0 is not configured');
    }

    // Generate state and nonce for security
    final state = _generateRandomString(32);
    final nonce = _generateRandomString(32);
    
    // Generate PKCE parameters
    final pkce = _generatePKCE();
    
    // Store state, nonce, and code_verifier in sessionStorage for verification
    html.window.sessionStorage['auth0_state'] = state;
    html.window.sessionStorage['auth0_nonce'] = nonce;
    html.window.sessionStorage['auth0_code_verifier'] = pkce['code_verifier']!;

    // Build Auth0 authorization URL
    final origin = html.window.location.origin;
    final pathname = html.window.location.pathname;
    final redirectUri = '$origin$pathname';
    final domain = AppConfig.auth0Domain;
    final clientId = AppConfig.auth0ClientId;
    final audience = AppConfig.auth0Audience;
    
    if (domain.isEmpty || clientId.isEmpty || audience.isEmpty) {
      throw Exception('Auth0 domain, client ID, or audience is not configured');
    }
    
    final authUrl = Uri.https(
      domain,
      '/authorize',
      {
        'response_type': 'code',
        'client_id': clientId,
        'redirect_uri': redirectUri,
        'scope': 'openid profile email offline_access',
        'audience': audience,
        'connection': 'google-oauth2',
        'state': state,
        'nonce': nonce,
        'code_challenge': pkce['code_challenge'],
        'code_challenge_method': 'S256',
      },
    );

    // Redirect to Auth0
    html.window.location.href = authUrl.toString();
    
    // This will never execute because we redirect, but return null to avoid exception
    return null;
  }

  /// Handle Auth0 callback on web (called after redirect)
  static Future<Credentials?> handleCallback() async {
    try {
      final uri = Uri.parse(html.window.location.href);
      final code = uri.queryParameters['code'];
      final state = uri.queryParameters['state'];
      final error = uri.queryParameters['error'];

      if (error != null) {
        final errorDescription = uri.queryParameters['error_description'] ?? '';
        throw Exception('Auth0 error: $error${errorDescription.isNotEmpty ? ' - $errorDescription' : ''}');
      }

      if (code == null || state == null) {
        return null; // Not an Auth0 callback
      }

      // Verify state
      final storedState = html.window.sessionStorage['auth0_state'];
      if (storedState != state) {
        throw Exception('Invalid state parameter');
      }

      // Exchange code for tokens
      final origin = html.window.location.origin;
      final pathname = html.window.location.pathname;
      final redirectUri = '$origin$pathname';
      final domain = AppConfig.auth0Domain;
      final clientId = AppConfig.auth0ClientId;
      
      if (domain.isEmpty || clientId.isEmpty) {
        throw Exception('Auth0 domain or client ID is not configured');
      }
      
      // Get code_verifier from sessionStorage (required for PKCE)
      final codeVerifier = html.window.sessionStorage['auth0_code_verifier'];
      if (codeVerifier == null || codeVerifier.isEmpty) {
        throw Exception('Code verifier not found. Please try signing in again.');
      }
      
      final tokenUrl = Uri.https(
        domain,
        '/oauth/token',
      );

      final tokenRequest = {
        'grant_type': 'authorization_code',
        'client_id': clientId,
        'code': code,
        'redirect_uri': redirectUri,
        'code_verifier': codeVerifier,
      };
      

      final response = await http.post(
        tokenUrl,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(tokenRequest),
      );

      if (response.statusCode != 200) {
        final errorBody = response.body;
        
        // Provide helpful error message
        if (response.statusCode == 401) {
          throw Exception(
            'Auth0 authentication failed. Please check:\n'
            '1. Application type is "Single Page Web Application" (not Regular Web Application)\n'
            '2. Redirect URI "$redirectUri" is in Allowed Callback URLs\n'
            '3. PKCE is enabled (automatic for SPAs)\n'
            'Error: $errorBody'
          );
        }
        
        throw Exception('Failed to exchange code for tokens: $errorBody');
      }

      final tokenData = jsonDecode(response.body) as Map<String, dynamic>;
      
      // Extract token data with defaults
      final accessToken = tokenData['access_token'] as String? ?? '';
      final idToken = tokenData['id_token'] as String? ?? '';
      final refreshToken = tokenData['refresh_token'] as String? ?? '';
      final expiresIn = tokenData['expires_in'] as int? ?? 3600;
      final tokenType = tokenData['token_type'] as String? ?? 'Bearer';
      
      // Decode ID token to get user info
      Map<String, dynamic> userInfoMap = {};
      if (idToken.isNotEmpty) {
        userInfoMap = _decodeJwt(idToken);
      }
      
      // Extract user info from ID token or use defaults
      final sub = userInfoMap['sub'] as String? ?? '';
      final name = userInfoMap['name'] as String? ?? userInfoMap['nickname'] as String? ?? '';
      final email = userInfoMap['email'] as String? ?? '';
      
      // Create Credentials object from token response
      final userInfo = _constructUserInfo(sub: sub, name: name, email: email);
      
      final credentials = Credentials(
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
        expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
        tokenType: tokenType,
        user: userInfo,
      );
      
      // Clean up URL by removing query parameters after successful callback
      // Prevents callback from being processed again on page refresh
      final cleanUrl = '$origin$pathname';
      html.window.history.replaceState({}, '', cleanUrl);
      
      // Clear stored state, nonce, and code_verifier from sessionStorage
      html.window.sessionStorage.remove('auth0_state');
      html.window.sessionStorage.remove('auth0_nonce');
      html.window.sessionStorage.remove('auth0_code_verifier');
      
      return credentials;
    } catch (e) {
      print('Error handling Auth0 callback: $e');
      // Clean up URL even on error to prevent retry loops
      try {
        final errorOrigin = html.window.location.origin;
        final errorPathname = html.window.location.pathname;
        final cleanUrl = '$errorOrigin$errorPathname';
        html.window.history.replaceState({}, '', cleanUrl);
        
        // Clear stored values on error
        html.window.sessionStorage.remove('auth0_state');
        html.window.sessionStorage.remove('auth0_nonce');
        html.window.sessionStorage.remove('auth0_code_verifier');
      } catch (_) {
        // Ignore cleanup errors
      }
      rethrow; // Re-throw to let caller handle the error
    }
  }

  /// Sign out (web)
  static Future<void> signOut() async {
    try {
      final domain = AppConfig.auth0Domain;
      final clientId = AppConfig.auth0ClientId;
      final origin = html.window.location.origin;
      final pathname = html.window.location.pathname;
      final returnTo = '$origin$pathname';
      
      if (domain.isEmpty || clientId.isEmpty) {
        throw Exception('Auth0 domain or client ID is not configured');
      }
      
      final logoutUrl = Uri.https(
        domain,
        '/v2/logout',
        {
          'client_id': clientId,
          'returnTo': returnTo,
        },
      );
      html.window.location.href = logoutUrl.toString();
    } catch (e) {
      print('Logout error: $e');
    }
  }

  /// Generate random string for state/nonce
  static String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    final buffer = StringBuffer();
    for (int i = 0; i < length; i++) {
      buffer.write(chars[(random + i) % chars.length]);
    }
    return buffer.toString();
  }
}

