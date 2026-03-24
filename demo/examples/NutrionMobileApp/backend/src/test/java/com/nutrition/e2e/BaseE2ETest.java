package com.nutrition.e2e;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.DockerComposeContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.File;
import java.time.Duration;

/**
 * Base class for all end-to-end tests.
 * Provides common setup and configuration for E2E testing.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseE2ETest {

    @LocalServerPort
    protected int port;

    @Container
    static DockerComposeContainer<?> environment = new DockerComposeContainer<>(
            new File("docker-compose.test.yml"))
            .withExposedService("postgres", 5432, Wait.forListeningPort())
            .withExposedService("redis", 6379, Wait.forListeningPort())
            .withExposedService("model-service", 8000, Wait.forListeningPort())
            .withExposedService("backend", 8080, Wait.forListeningPort())
            .withExposedService("frontend", 3000, Wait.forListeningPort())
            .waitingFor("backend", Wait.forHttp("/api/actuator/health")
                    .forStatusCode(200)
                    .withStartupTimeout(Duration.ofMinutes(2)));
    
    // Note: TestContainers automatically manages container lifecycle
    // No manual cleanup required - containers are stopped after tests complete

    @BeforeEach
    void setUp() {
        // Common setup for all E2E tests
        setupTestData();
    }

    /**
     * Override this method in subclasses to set up test-specific data
     */
    protected void setupTestData() {
        // Default implementation - can be overridden
    }

    /**
     * Get the base URL for the application
     */
    protected String getBaseUrl() {
        return "http://localhost:" + port;
    }

    /**
     * Get the API base URL
     */
    protected String getApiBaseUrl() {
        return getBaseUrl() + "/api";
    }
}
