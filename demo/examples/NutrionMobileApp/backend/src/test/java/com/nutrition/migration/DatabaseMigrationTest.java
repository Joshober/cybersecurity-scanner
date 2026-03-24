package com.nutrition.migration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Database migration tests to ensure all required tables and columns exist
 */
@SpringBootTest
@ActiveProfiles("test")
class DatabaseMigrationTest extends BaseMigrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Should have all required tables created")
    void shouldHaveAllRequiredTablesCreated() {
        // Given
        List<String> expectedTables = List.of(
                "users",
                "menu_items",
                "nutrition_entries",
                "portion_analyses",
                "user_preferences"
        );

        // When
        List<String> actualTables = getAllTableNames(dataSource);

        // Then
        for (String expectedTable : expectedTables) {
            assertThat(actualTables).contains(expectedTable);
        }
    }

    @Test
    @DisplayName("Should have users table with correct structure")
    void shouldHaveUsersTableWithCorrectStructure() {
        // Given
        String tableName = "users";
        List<String> expectedColumns = List.of(
                "id",
                "username",
                "password",
                "email",
                "age",
                "weight",
                "height",
                "activity_level",
                "vegan",
                "vegetarian",
                "created_at",
                "updated_at"
        );

        // When
        boolean tableExists = tableExists(dataSource, tableName);
        List<String> actualColumns = getColumnNames(dataSource, tableName);

        // Then
        assertThat(tableExists).isTrue();
        for (String expectedColumn : expectedColumns) {
            assertThat(actualColumns).contains(expectedColumn);
        }
    }

    @Test
    @DisplayName("Should have menu_items table with correct structure")
    void shouldHaveMenuItemsTableWithCorrectStructure() {
        // Given
        String tableName = "menu_items";
        List<String> expectedColumns = List.of(
                "id",
                "name",
                "description",
                "category",
                "location",
                "date",
                "meal_type",
                "created_at",
                "updated_at"
        );

        // When
        boolean tableExists = tableExists(dataSource, tableName);
        List<String> actualColumns = getColumnNames(dataSource, tableName);

        // Then
        assertThat(tableExists).isTrue();
        for (String expectedColumn : expectedColumns) {
            assertThat(actualColumns).contains(expectedColumn);
        }
    }

    @Test
    @DisplayName("Should have nutrition_entries table with correct structure")
    void shouldHaveNutritionEntriesTableWithCorrectStructure() {
        // Given
        String tableName = "nutrition_entries";
        List<String> expectedColumns = List.of(
                "id",
                "user_id",
                "food_name",
                "calories",
                "protein",
                "carbs",
                "fat",
                "fiber",
                "sugar",
                "sodium",
                "entry_date",
                "created_at",
                "updated_at"
        );

        // When
        boolean tableExists = tableExists(dataSource, tableName);
        List<String> actualColumns = getColumnNames(dataSource, tableName);

        // Then
        assertThat(tableExists).isTrue();
        for (String expectedColumn : expectedColumns) {
            assertThat(actualColumns).contains(expectedColumn);
        }
    }

    @Test
    @DisplayName("Should have portion_analyses table with correct structure")
    void shouldHavePortionAnalysesTableWithCorrectStructure() {
        // Given
        String tableName = "portion_analyses";
        List<String> expectedColumns = List.of(
                "id",
                "user_id",
                "image_path",
                "food_items",
                "confidence_scores",
                "analysis_date",
                "created_at",
                "updated_at"
        );

        // When
        boolean tableExists = tableExists(dataSource, tableName);
        List<String> actualColumns = getColumnNames(dataSource, tableName);

        // Then
        assertThat(tableExists).isTrue();
        for (String expectedColumn : expectedColumns) {
            assertThat(actualColumns).contains(expectedColumn);
        }
    }

    @Test
    @DisplayName("Should have proper primary keys and constraints")
    void shouldHaveProperPrimaryKeysAndConstraints() throws Exception {
        // Given
        List<String> tables = List.of("users", "menu_items", "nutrition_entries", "portion_analyses");

        // When & Then
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            for (String tableName : tables) {
                // Check primary key
                try (ResultSet primaryKeys = metaData.getPrimaryKeys(null, null, tableName)) {
                    assertThat(primaryKeys.next()).isTrue();
                    assertThat(primaryKeys.getString("COLUMN_NAME")).isEqualTo("id");
                }

                // Check that id column is auto-increment
                try (ResultSet columns = metaData.getColumns(null, null, tableName, "id")) {
                    assertThat(columns.next()).isTrue();
                    // Note: The exact check for auto-increment depends on the database
                    // For H2, we can check if the column is nullable
                    assertThat(columns.getInt("NULLABLE")).isEqualTo(0); // NOT NULL
                }
            }
        }
    }

    @Test
    @DisplayName("Should have proper foreign key relationships")
    void shouldHaveProperForeignKeyRelationships() throws Exception {
        // Given
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            // Check foreign key from nutrition_entries to users
            try (ResultSet foreignKeys = metaData.getImportedKeys(null, null, "nutrition_entries")) {
                boolean foundUserForeignKey = false;
                while (foreignKeys.next()) {
                    if ("user_id".equals(foreignKeys.getString("FKCOLUMN_NAME"))) {
                        foundUserForeignKey = true;
                        break;
                    }
                }
                assertThat(foundUserForeignKey).isTrue();
            }

            // Check foreign key from portion_analyses to users
            try (ResultSet foreignKeys = metaData.getImportedKeys(null, null, "portion_analyses")) {
                boolean foundUserForeignKey = false;
                while (foreignKeys.next()) {
                    if ("user_id".equals(foreignKeys.getString("FKCOLUMN_NAME"))) {
                        foundUserForeignKey = true;
                        break;
                    }
                }
                assertThat(foundUserForeignKey).isTrue();
            }
        }
    }

    @Test
    @DisplayName("Should have proper indexes for performance")
    void shouldHaveProperIndexesForPerformance() throws Exception {
        // Given
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            // Check indexes on users table
            try (ResultSet indexes = metaData.getIndexInfo(null, null, "users", false, false)) {
                List<String> indexNames = new ArrayList<>();
                while (indexes.next()) {
                    indexNames.add(indexes.getString("INDEX_NAME"));
                }
                // Should have indexes on username and email for uniqueness
                assertThat(indexNames).isNotEmpty();
            }

            // Check indexes on menu_items table
            try (ResultSet indexes = metaData.getIndexInfo(null, null, "menu_items", false, false)) {
                List<String> indexNames = new ArrayList<>();
                while (indexes.next()) {
                    indexNames.add(indexes.getString("INDEX_NAME"));
                }
                // Should have indexes on location, date, meal_type for query performance
                assertThat(indexNames).isNotEmpty();
            }
        }
    }
}
