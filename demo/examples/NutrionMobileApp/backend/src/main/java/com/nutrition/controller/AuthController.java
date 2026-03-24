package com.nutrition.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.nutrition.dto.Auth0LoginRequest;
import com.nutrition.dto.AuthResponse;
import com.nutrition.dto.LoginRequest;
import com.nutrition.dto.RegisterRequest;
import com.nutrition.model.User;
import com.nutrition.security.JwtUtils;
import com.nutrition.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Value("${auth0.enabled:false}")
    private boolean auth0Enabled;
    
    /**
     * Login with Auth0 token
     * This endpoint accepts an Auth0 JWT token, validates it, and creates/finds the user
     */
    @PostMapping("/auth0")
    public ResponseEntity<?> authenticateWithAuth0(@Valid @RequestBody Auth0LoginRequest request) {
        if (!auth0Enabled) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Auth0 is not enabled");
            return ResponseEntity.badRequest().body(error);
        }
        
        try {
            // Decode the Auth0 JWT token to extract user information
            // Note: We're using ID token which contains user profile information
            DecodedJWT decodedJWT = JWT.decode(request.getAuth0Token());
            
            // Extract user information from token
            // Handle null claims properly - asString() returns null if claim doesn't exist
            String email = null;
            String name = null;
            String nickname = null;
            
            // Try to get email claim
            if (decodedJWT.getClaim("email") != null && !decodedJWT.getClaim("email").isNull()) {
                email = decodedJWT.getClaim("email").asString();
            }
            
            // Try to get name claim
            if (decodedJWT.getClaim("name") != null && !decodedJWT.getClaim("name").isNull()) {
                name = decodedJWT.getClaim("name").asString();
            }
            
            // Try to get nickname claim
            if (decodedJWT.getClaim("nickname") != null && !decodedJWT.getClaim("nickname").isNull()) {
                nickname = decodedJWT.getClaim("nickname").asString();
            }
            
            String sub = decodedJWT.getSubject(); // Auth0 user ID (always present)
            
            // Use email as username if available, otherwise use nickname or sub
            String username;
            if (email != null && !email.isEmpty()) {
                // Extract username from email (part before @)
                username = email.split("@")[0];
            } else if (nickname != null && !nickname.isEmpty()) {
                username = nickname;
            } else {
                // Fallback to sub, but clean it up (remove google-oauth2| prefix if present)
                username = sub.contains("|") ? sub.substring(sub.indexOf("|") + 1) : sub;
            }
            
            // Ensure username is unique - append numbers if needed
            String baseUsername = username;
            int counter = 1;
            while (userService.existsByUsername(username)) {
                username = baseUsername + counter;
                counter++;
            }
            
            // Use proper email or fallback
            String userEmail = (email != null && !email.isEmpty()) 
                ? email 
                : sub + "@auth0.local";
            
            // Use proper name or fallback to username
            String userName = (name != null && !name.isEmpty()) 
                ? name 
                : (nickname != null && !nickname.isEmpty() ? nickname : username);
            
            // Find or create user
            User user = userService.findOrCreateAuth0User(
                userEmail,
                username,
                userName
            );
            
            // Set nutritionPlan to null to avoid Hibernate lazy loading serialization issues
            user.setNutritionPlan(null);
            
            // Generate a backend JWT token for the user
            // Frontend uses this token with JWT filter
            String backendJwt = jwtUtils.generateToken(user);
            
            return ResponseEntity.ok(new AuthResponse(backendJwt, user));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid Auth0 token: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
            
            User user = userService.findByUsername(loginRequest.getUsername()).orElse(null);
            
            if (user != null) {
                // Set nutritionPlan to null to avoid Hibernate lazy loading serialization issues
                user.setNutritionPlan(null);
            }
            
            return ResponseEntity.ok(new AuthResponse(jwt, user));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userService.existsByUsername(registerRequest.getUsername())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Username is already taken!");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (userService.existsByEmail(registerRequest.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Email is already in use!");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userService.createUser(registerRequest);
            
            // Set nutritionPlan to null to avoid Hibernate lazy loading serialization issues
            user.setNutritionPlan(null);
            
            // Generate JWT token for the new user
            String jwt = jwtUtils.generateToken(user);
            
            return ResponseEntity.ok(new AuthResponse(jwt, user));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
