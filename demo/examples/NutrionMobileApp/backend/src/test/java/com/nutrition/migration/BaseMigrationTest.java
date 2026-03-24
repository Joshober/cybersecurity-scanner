package com.nutrition.migration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Base class for all migration tests.
 * Provides common setup and configuration for database migration testing.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Transactional
public abstract class BaseMigrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("nutrition_migration_test")
            .withUsername("test")
            .withPassword("test");
    
    // Note: TestContainers automatically manages container lifecycle
    // No manual cleanup required - containers are stopped after tests complete

    @BeforeEach
    void setUp() {
        // Common setup for all migration tests
        setupTestData();
    }

    /**
     * Override this method in subclasses to set up test-specific data
     */
    protected void setupTestData() {
        // Default implementation - can be overridden
    }

    /**
     * Helper method to get all table names in the database
     */
    protected List<String> getAllTableNames(DataSource dataSource) {
        List<String> tableNames = new ArrayList<>();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")) {
            
            while (resultSet.next()) {
                tableNames.add(resultSet.getString("table_name"));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to get table names", e);
        }
        return tableNames;
    }

    /**
     * Helper method to check if a table exists
     */
    protected boolean tableExists(DataSource dataSource, String tableName) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '" + tableName + "'")) {
            
            return resultSet.next() && resultSet.getInt(1) > 0;
        } catch (Exception e) {
            throw new RuntimeException("Failed to check if table exists: " + tableName, e);
        }
    }

    /**
     * Helper method to get column names for a table
     */
    protected List<String> getColumnNames(DataSource dataSource, String tableName) {
        List<String> columnNames = new ArrayList<>();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '" + tableName + "' ORDER BY ordinal_position")) {
            
            while (resultSet.next()) {
                columnNames.add(resultSet.getString("column_name"));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to get column names for table: " + tableName, e);
        }
        return columnNames;
    }
}
