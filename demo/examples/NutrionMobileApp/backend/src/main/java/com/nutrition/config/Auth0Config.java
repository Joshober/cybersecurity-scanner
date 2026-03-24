package com.nutrition.config;

import org.springframework.context.annotation.Configuration;

/**
 * Auth0 Configuration
 * 
 * Note: Auth0 JWT validation is handled manually in AuthController.
 * The auth0-spring-security-api library was removed due to incompatibility with Spring Boot 3.x.
 * 
 * To enable Auth0:
 * 1. Set AUTH0_ENABLED=true
 * 2. Configure AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE
 * 
 * Auth0 token validation and user creation is handled in AuthController.authenticateWithAuth0()
 */
@Configuration
public class Auth0Config {
    // Auth0 configuration is handled in SecurityConfig and AuthController
    // This class is kept for documentation purposes
}

