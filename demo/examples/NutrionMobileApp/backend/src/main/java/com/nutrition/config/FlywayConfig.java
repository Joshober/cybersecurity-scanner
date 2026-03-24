package com.nutrition.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.boot.autoconfigure.flyway.FlywayProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Custom Flyway configuration that ensures migrations run during deployment.
 * 
 * This configuration:
 * - Retries migrations with exponential backoff for connection errors
 * - Automatically repairs checksum mismatches (when migrations are modified after being applied)
 * - Fails deployment if migrations cannot be completed
 */
@Configuration
public class FlywayConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayConfig.class);
    
    // Retry configuration
    private static final int MAX_RETRIES = 10;
    private static final long INITIAL_RETRY_DELAY_MS = 2000; // 2 seconds
    private static final long MAX_RETRY_DELAY_MS = 30000; // 30 seconds
    
    /**
     * Custom Flyway initializer that retries migrations with exponential backoff
     * and automatically repairs checksum mismatches.
     */
    @Bean
    @Primary
    public FlywayMigrationInitializer flywayMigrationInitializer(
            Flyway flyway, 
            FlywayProperties flywayProperties) {
        return new FlywayMigrationInitializer(flyway, (f) -> {
            if (!flywayProperties.isEnabled()) {
                logger.info("Flyway migrations are disabled");
                return;
            }
            
            logger.info("Starting Flyway migration with retry and repair logic...");
            
            Exception lastException = null;
            boolean repairAttempted = false;
            
            for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    logger.info("Attempting Flyway migration (attempt {}/{})...", attempt, MAX_RETRIES);
                    f.migrate();
                    logger.info("Flyway migration completed successfully on attempt {}", attempt);
                    return; // Success - exit
                } catch (Exception e) {
                    lastException = e;
                    String errorMessage = e.getMessage();
                    logger.warn("Flyway migration attempt {} failed: {}", attempt, errorMessage);
                    
                    // Check if this is a checksum mismatch error
                    if (isChecksumMismatchError(e) && !repairAttempted) {
                        logger.warn("Detected checksum mismatch. Attempting to repair Flyway schema history...");
                        try {
                            f.repair();
                            repairAttempted = true;
                            logger.info("Flyway repair completed. Retrying migration...");
                            // Don't wait, retry immediately after repair
                            continue;
                        } catch (Exception repairException) {
                            logger.error("Flyway repair failed: {}", repairException.getMessage());
                            // Continue with normal retry logic
                        }
                    }
                    
                    // Check if this is a connection error (should retry)
                    if (isConnectionError(e)) {
                        // If this is not the last attempt, wait before retrying
                        if (attempt < MAX_RETRIES) {
                            long delay = calculateRetryDelay(attempt);
                            logger.info("Connection error detected. Waiting {}ms before retry...", delay);
                            try {
                                Thread.sleep(delay);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                throw new RuntimeException("Migration retry interrupted", ie);
                            }
                        }
                    } else {
                        // Non-connection error (validation, syntax, etc.) - don't retry
                        logger.error("Non-recoverable migration error detected. Failing deployment.");
                        throw new RuntimeException("Flyway migration failed: " + errorMessage, e);
                    }
                }
            }
            
            // All retries failed - this is a critical error
            logger.error("Flyway migration failed after {} attempts. This is a deployment failure.", MAX_RETRIES);
            if (lastException != null) {
                throw new RuntimeException("Flyway migration failed after " + MAX_RETRIES + " attempts. " +
                                         "Database may not be available or migrations are invalid.", lastException);
            } else {
                throw new RuntimeException("Flyway migration failed after " + MAX_RETRIES + " attempts.");
            }
        });
    }
    
    /**
     * Check if the error is a checksum mismatch
     */
    private boolean isChecksumMismatchError(Exception e) {
        String message = e.getMessage();
        return message != null && (
            message.contains("checksum mismatch") ||
            message.contains("Validate failed") ||
            message.contains("Migrations have failed validation")
        );
    }
    
    /**
     * Check if the error is a connection/database availability error
     */
    private boolean isConnectionError(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return false;
        }
        
        String lowerMessage = message.toLowerCase();
        return lowerMessage.contains("connection") ||
               lowerMessage.contains("timeout") ||
               lowerMessage.contains("network") ||
               lowerMessage.contains("refused") ||
               lowerMessage.contains("unavailable") ||
               lowerMessage.contains("could not connect") ||
               lowerMessage.contains("connection refused") ||
               (e.getCause() != null && isConnectionError((Exception) e.getCause()));
    }
    
    /**
     * Calculate retry delay with exponential backoff
     */
    private long calculateRetryDelay(int attempt) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped), 30s, ...
        long delay = INITIAL_RETRY_DELAY_MS * (1L << (attempt - 1));
        return Math.min(delay, MAX_RETRY_DELAY_MS);
    }
}

