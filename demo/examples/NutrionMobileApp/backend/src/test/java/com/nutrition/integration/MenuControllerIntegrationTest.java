package com.nutrition.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for MenuController
 */
@AutoConfigureWebMvc
class MenuControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;


    private String testLocation;
    private String testDate;
    private String testMealType;

    @BeforeEach
    void setUp() {
        super.setUp();
        testLocation = "48760001";
        testDate = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        testMealType = "lunch";
    }

    @Test
    @DisplayName("Should ingest menu successfully")
    void shouldIngestMenuSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/menu/ingest")
                        .param("location", testLocation)
                        .param("date", testDate)
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").exists())
                .andExpect(jsonPath("$.location").value(testLocation))
                .andExpect(jsonPath("$.mealType").value(testMealType));
    }

    @Test
    @DisplayName("Should get menu items successfully")
    void shouldGetMenuItemsSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/items")
                        .param("location", testLocation)
                        .param("date", testDate)
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.location").value(testLocation))
                .andExpect(jsonPath("$.mealType").value(testMealType))
                .andExpect(jsonPath("$.menuItems").isArray());
    }

    @Test
    @DisplayName("Should filter menu items by category")
    void shouldFilterMenuItemsByCategory() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/items")
                        .param("location", testLocation)
                        .param("date", testDate)
                        .param("mealType", testMealType)
                        .param("category", "Breakfast")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.category").value("Breakfast"));
    }

    @Test
    @DisplayName("Should search menu items successfully")
    void shouldSearchMenuItemsSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/search")
                        .param("query", "chicken")
                        .param("location", testLocation)
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.query").value("chicken"))
                .andExpect(jsonPath("$.results").isArray());
    }

    @Test
    @DisplayName("Should get Sodexo menu via proxy endpoint")
    void shouldGetSodexoMenuViaProxy() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/sodexo/{locationId}", testLocation)
                        .param("date", "2024-01-15")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").exists())
                .andExpect(jsonPath("$.locationId").value(testLocation))
                .andExpect(jsonPath("$.date").value("2024-01-15"));
    }

    @Test
    @DisplayName("Should handle missing required parameters")
    void shouldHandleMissingRequiredParameters() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/menu/ingest")
                        .param("location", testLocation)
                        // Missing date parameter
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle invalid date format")
    void shouldHandleInvalidDateFormat() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/menu/ingest")
                        .param("location", testLocation)
                        .param("date", "invalid-date")
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get top foods successfully")
    void shouldGetTopFoodsSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/top-foods")
                        .param("location", testLocation)
                        .param("mealType", testMealType)
                        .param("limit", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.location").value(testLocation))
                .andExpect(jsonPath("$.mealType").value(testMealType))
                .andExpect(jsonPath("$.topFoods").isArray());
    }

    @Test
    @DisplayName("Should get menu priors successfully")
    void shouldGetMenuPriorsSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/menu/priors")
                        .param("location", testLocation)
                        .param("mealType", testMealType)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.location").value(testLocation))
                .andExpect(jsonPath("$.mealType").value(testMealType))
                .andExpect(jsonPath("$.priors").isArray());
    }
}
