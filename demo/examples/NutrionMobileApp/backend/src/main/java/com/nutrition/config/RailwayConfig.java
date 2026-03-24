package com.nutrition.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically maps Railway's standard environment variables to Spring Boot properties.
 * This eliminates the need to manually configure database variables on Railway.
 * 
 * Railway automatically provides:
 * - DATABASE_URL (postgresql://user:password@host:port/dbname)
 * - PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE
 * - REDIS_URL (redis://host:port)
 * - PORT
 * 
 * This class parses these and maps them to Spring Boot's expected format.
 * 
 * Registered via META-INF/spring.factories to run early in the Spring Boot lifecycle.
 */
public class RailwayConfig implements EnvironmentPostProcessor {

    private static final Logger logger = LoggerFactory.getLogger(RailwayConfig.class);

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String pgHost = environment.getProperty("PGHOST");
        String pgPort = environment.getProperty("PGPORT");
        String pgDatabase = environment.getProperty("PGDATABASE");
        String pgUser = environment.getProperty("PGUSER");
        String pgPassword = environment.getProperty("PGPASSWORD");
        String databaseUrl = environment.getProperty("DATABASE_URL");
        
        Map<String, Object> railwayProperties = new HashMap<>();

        // Parse DATABASE_URL if SPRING_DATASOURCE_URL is not set
        // Prefer private components (PGHOST, PGPORT, etc.) to avoid egress fees
        String springDatasourceUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        if (springDatasourceUrl == null || springDatasourceUrl.isEmpty()) {
            // Use private components first (PGHOST uses private network, no egress fees)
            
            if (pgHost != null && !pgHost.isEmpty()) {
                // Build JDBC URL using private components
                int port = pgPort != null && !pgPort.isEmpty() ? Integer.parseInt(pgPort) : 5432;
                String database = pgDatabase != null && !pgDatabase.isEmpty() ? pgDatabase : "nutrition_db";
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", pgHost, port, database);
                railwayProperties.put("spring.datasource.url", jdbcUrl);
                
                // Set username and password from PGUSER and PGPASSWORD
                // CRITICAL: Both must be set for SCRAM authentication
                if (pgUser != null && !pgUser.isEmpty()) {
                    railwayProperties.put("spring.datasource.username", pgUser);
                } else {
                    logger.error("PGUSER is missing or empty! Database authentication will fail.");
                }
                if (pgPassword != null && !pgPassword.isEmpty()) {
                    railwayProperties.put("spring.datasource.password", pgPassword);
                } else {
                    logger.error("PGPASSWORD is missing or empty! Database authentication will fail.");
                }
            } else {
                // Fallback to DATABASE_URL if private components not available
                if (databaseUrl != null && !databaseUrl.isEmpty()) {
                    try {
                        // Railway DATABASE_URL format: postgresql://user:password@host:port/dbname
                        URI uri = new URI(databaseUrl);
                        String scheme = uri.getScheme();
                        
                        if ("postgresql".equals(scheme) || "postgres".equals(scheme)) {
                            String userInfo = uri.getUserInfo();
                            String host = uri.getHost();
                            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                            String path = uri.getPath();
                            String database = path != null && path.length() > 1 ? path.substring(1) : "nutrition_db";
                            
                            String username = null;
                            String password = null;
                            if (userInfo != null && userInfo.contains(":")) {
                                String[] parts = userInfo.split(":", 2);
                                username = parts[0];
                                password = parts.length > 1 ? parts[1] : "";
                            }
                            
                            // Build JDBC URL
                            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, database);
                            railwayProperties.put("spring.datasource.url", jdbcUrl);
                            
                            // Set username and password if parsed from URL
                            if (username != null) {
                                railwayProperties.put("spring.datasource.username", username);
                            }
                            if (password != null) {
                                railwayProperties.put("spring.datasource.password", password);
                            }
                            
                            logger.warn("Using public DATABASE_URL (may incur egress fees). Consider using PGHOST for private connection.");
                        }
                    } catch (Exception e) {
                        logger.warn("Could not parse Railway DATABASE_URL: {}", databaseUrl, e);
                    }
                }
            }
        }

        // Map Railway PG* variables if not already set in railwayProperties
        // Ensure username/password are set even if YAML has empty defaults
        // Reuse the variables already declared at the top of the method
        if (!railwayProperties.containsKey("spring.datasource.username")) {
            if (pgUser != null && !pgUser.isEmpty()) {
                railwayProperties.put("spring.datasource.username", pgUser);
            }
        }

        if (!railwayProperties.containsKey("spring.datasource.password")) {
            if (pgPassword != null && !pgPassword.isEmpty()) {
                railwayProperties.put("spring.datasource.password", pgPassword);
            }
        }

        // Map Railway REDIS_URL if SPRING_DATA_REDIS_HOST is not set
        String redisHost = environment.getProperty("SPRING_DATA_REDIS_HOST");
        boolean redisAvailable = false;
        if (redisHost == null || redisHost.isEmpty()) {
            String redisUrl = environment.getProperty("REDIS_URL");
            if (redisUrl != null && !redisUrl.isEmpty()) {
                try {
                    URI uri = new URI(redisUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 6379;
                    
                    railwayProperties.put("spring.data.redis.host", host);
                    railwayProperties.put("spring.data.redis.port", String.valueOf(port));
                    
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String password = userInfo.split(":", 2)[1];
                        railwayProperties.put("spring.data.redis.password", password);
                    }
                    
                    redisAvailable = true;
                } catch (Exception e) {
                    logger.warn("Could not parse Railway REDIS_URL: {}", redisUrl, e);
                }
            } else {
                // Fallback to REDIS_HOST and REDIS_PORT
                String fallbackHost = environment.getProperty("REDIS_HOST");
                String fallbackPort = environment.getProperty("REDIS_PORT");
                if (fallbackHost != null && !fallbackHost.isEmpty()) {
                    railwayProperties.put("spring.data.redis.host", fallbackHost);
                    redisAvailable = true;
                }
                if (fallbackPort != null) {
                    railwayProperties.put("spring.data.redis.port", fallbackPort);
                }
            }
        } else {
            redisAvailable = true;
        }
        
        // Set cache type based on Redis availability
        // Only use Redis cache if Redis is actually available
        String cacheType = environment.getProperty("CACHE_TYPE");
        if (cacheType == null || cacheType.isEmpty()) {
            if (redisAvailable) {
                railwayProperties.put("spring.cache.type", "redis");
            } else {
                railwayProperties.put("spring.cache.type", "simple");
            }
        }

        // Use Railway PORT if set
        String railwayPort = environment.getProperty("PORT");
        if (railwayPort != null && !railwayPort.isEmpty()) {
            railwayProperties.put("server.port", railwayPort);
        }

        // Add all mapped properties to environment
        if (!railwayProperties.isEmpty()) {
            MutablePropertySources propertySources = environment.getPropertySources();
            propertySources.addFirst(
                new MapPropertySource("railwayAutoConfig", railwayProperties)
            );
            logger.info("Railway configuration applied. Database URL: {}", 
                       railwayProperties.get("spring.datasource.url"));
        } else {
            logger.warn("No Railway properties mapped. Check if Railway environment variables are available.");
            logger.warn("PGHOST: {}, PGUSER: {}, PGPASSWORD: {}, DATABASE_URL: {}", 
                       pgHost, pgUser, pgPassword != null ? "***" : null, 
                       databaseUrl != null ? "***" : null);
        }
    }
}

