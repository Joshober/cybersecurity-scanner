package com.nutrition.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.nutrition.service.UserDetailsServiceImpl;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    
    @Value("${auth0.enabled:false}")
    private boolean auth0Enabled;
    
    @Value("${auth0.domain:}")
    private String auth0Domain;
    
    @Value("${auth0.audience:}")
    private String auth0Audience;
    
    @Value("${cors.allowed-origins:}")
    private String allowedOrigins;
    
    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;
    
    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;
    
    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;
    
    @Value("${cors.max-age:3600}")
    private long maxAge;
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired
    private Environment environment;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // CORS must be configured before authentication
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        // Note: Auth0 JWT validation is handled manually in AuthController
        // The auth0-spring-security-api library is not compatible with Spring Boot 3.x
        // We use custom JWT filter for all authentication
        http.authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        // Check if we're in production profile
        boolean isProduction = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        boolean swaggerEnabled = environment.getProperty("springdoc.swagger-ui.enabled", Boolean.class, true);
        
        // Common authorization rules
        http.authorizeHttpRequests(authz -> {
            // Allow OPTIONS requests for CORS preflight
            authz.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/auth/**").permitAll()
                .requestMatchers("/api/nutrition/**", "/nutrition/**").permitAll()
                .requestMatchers("/api/users/**", "/users/**").permitAll()
                .requestMatchers("/api/menu/**", "/menu/**").permitAll()
                .requestMatchers("/api/portion/**", "/portion/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/error").permitAll();
            
            // H2 console - only allow in non-production
            if (!isProduction) {
                authz.requestMatchers("/h2-console/**").permitAll();
            } else {
                authz.requestMatchers("/h2-console/**").denyAll();
            }
            
            // Swagger/OpenAPI - conditionally allow based on configuration
            if (swaggerEnabled && !isProduction) {
                authz.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll();
            } else if (swaggerEnabled && isProduction) {
                // In production, require authentication for Swagger
                authz.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").authenticated();
            } else {
                // Swagger disabled
                authz.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").denyAll();
            }
            
            // Actuator endpoints - require authentication in production
            if (isProduction) {
                authz.requestMatchers("/actuator/**").authenticated();
            } else {
                authz.requestMatchers("/actuator/**").permitAll();
            }
            
            authz.anyRequest().authenticated();
        });
        
        // Security headers
        http.headers(headers -> {
            headers.frameOptions(frame -> frame.deny()); // Prevent clickjacking
            headers.contentTypeOptions(contentType -> {}); // Prevent MIME sniffing
            headers.httpStrictTransportSecurity(hsts -> {
                if (isProduction) {
                    hsts.maxAgeInSeconds(31536000) // 1 year
                        .includeSubDomains(true);
                }
            });
            headers.xssProtection(xss -> xss.disable()); // XSS protection handled by modern browsers
        });
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Check if we're in production
        boolean isProduction = Arrays.asList(environment.getActiveProfiles()).contains("prod") ||
                               Arrays.asList(environment.getActiveProfiles()).contains("railway");
        
        // Parse allowed origins from configuration
        List<String> origins = parseOrigins(allowedOrigins);
        
        // Log what we received
        logger.info("CORS Configuration - Raw allowedOrigins value: '{}'", allowedOrigins);
        logger.info("CORS Configuration - Parsed origins: {}", origins);
        logger.info("CORS Configuration - Is Production: {}", isProduction);
        
        if (origins.isEmpty() || (allowedOrigins != null && allowedOrigins.trim().isEmpty())) {
            // Fallback: if no origins specified, use defaults
            if (isProduction) {
                // Production: Use default from YAML if environment variable not set
                // Default includes https://meal.up.railway.app
                logger.warn("CORS_ALLOWED_ORIGINS not set or empty, using default origins from application-railway.yml");
                origins = parseOrigins("https://meal.up.railway.app,http://localhost:3000");
            } else {
                // Development: allow common local origins
                logger.info("Using development CORS patterns");
                configuration.setAllowedOriginPatterns(Arrays.asList(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "https://*.ngrok.io",
                    "https://*.ngrok-free.app"
                ));
            }
        }
        
        // When allowCredentials is true, must use setAllowedOrigins (not patterns)
        if (!origins.isEmpty()) {
            configuration.setAllowedOrigins(origins);
            logger.info("CORS Configuration - Set allowed origins: {}", origins);
        } else {
            logger.warn("CORS Configuration - No origins configured, using patterns");
        }
        
        // Parse allowed methods - ensure OPTIONS is included for preflight
        List<String> methods = Arrays.asList(allowedMethods.split(","));
        List<String> allowedMethodsList = methods.stream()
            .map(String::trim)
            .collect(Collectors.toList());
        // Ensure OPTIONS is always included for CORS preflight
        if (!allowedMethodsList.contains("OPTIONS")) {
            allowedMethodsList.add("OPTIONS");
        }
        configuration.setAllowedMethods(allowedMethodsList);
        
        // Parse allowed headers
        if ("*".equals(allowedHeaders)) {
            configuration.setAllowedHeaders(Arrays.asList("*"));
        } else {
            List<String> headers = Arrays.asList(allowedHeaders.split(","));
            configuration.setAllowedHeaders(headers.stream()
                .map(String::trim)
                .collect(Collectors.toList()));
        }
        
        configuration.setAllowCredentials(allowCredentials);
        configuration.setMaxAge(maxAge);
        
        // Log CORS configuration for debugging
        logger.info("CORS Configuration - Allowed Origins: {}, Methods: {}, Headers: {}, Credentials: {}", 
            origins.isEmpty() ? "patterns" : origins, 
            configuration.getAllowedMethods(), 
            configuration.getAllowedHeaders(), 
            allowCredentials);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    /**
     * Parse comma-separated list of allowed origins
     */
    private List<String> parseOrigins(String originsString) {
        if (originsString == null || originsString.trim().isEmpty()) {
            return List.of();
        }
        return Arrays.stream(originsString.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
    }
}
