package com.nutrition.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for all unit tests.
 * Provides common setup and configuration for unit testing.
 */
@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
public abstract class BaseUnitTest {

    @BeforeEach
    void setUp() {
        // Common setup for all unit tests
        setupTestData();
    }

    /**
     * Override this method in subclasses to set up test-specific data
     */
    protected void setupTestData() {
        // Default implementation - can be overridden
    }

    /**
     * Helper method to create test data
     */
    protected <T> T createTestData(Class<T> clazz) {
        // This can be extended with a test data builder pattern
        try {
            return clazz.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create test data for " + clazz.getSimpleName(), e);
        }
    }
}
