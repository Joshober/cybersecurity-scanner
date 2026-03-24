package com.nutrition.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Menu API
 */
class MenuE2ETest extends BaseE2ETest {

    @Autowired
    private TestRestTemplate restTemplate;


    @Test
    @DisplayName("Should complete full menu workflow from ingestion to retrieval")
    void shouldCompleteFullMenuWorkflow() {
        // Given
        String location = "48760001";
        String date = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String mealType = "lunch";

        // Step 1: Ingest menu data
        @SuppressWarnings({"unchecked", "rawtypes"})
        ResponseEntity<Map<String, Object>> ingestResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.postForEntity(
                getApiBaseUrl() + "/menu/ingest?location={location}&date={date}&mealType={mealType}",
                null,
                Map.class,
                location, date, mealType
        );

        assertThat(ingestResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ingestResponse.getBody()).isNotNull();
        assertThat(ingestResponse.getBody().get("success")).isNotNull();

        // Step 2: Retrieve menu items
        @SuppressWarnings({"unchecked", "rawtypes"})
        ResponseEntity<Map<String, Object>> itemsResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/items?location={location}&date={date}&mealType={mealType}",
                Map.class,
                location, date, mealType
        );

        assertThat(itemsResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(itemsResponse.getBody()).isNotNull();
        assertThat(itemsResponse.getBody().get("success")).isEqualTo(true);
        assertThat(itemsResponse.getBody().get("menuItems")).isNotNull();

        // Step 3: Search menu items
        @SuppressWarnings({"unchecked", "rawtypes"})
        ResponseEntity<Map<String, Object>> searchResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/search?query=chicken&location={location}&mealType={mealType}",
                Map.class,
                location, mealType
        );

        assertThat(searchResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(searchResponse.getBody()).isNotNull();
        assertThat(searchResponse.getBody().get("success")).isEqualTo(true);
        assertThat(searchResponse.getBody().get("results")).isNotNull();

        // Step 4: Get top foods
        @SuppressWarnings({"unchecked", "rawtypes"})
        ResponseEntity<Map<String, Object>> topFoodsResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/top-foods?location={location}&mealType={mealType}&limit=10",
                Map.class,
                location, mealType
        );

        assertThat(topFoodsResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(topFoodsResponse.getBody()).isNotNull();
        assertThat(topFoodsResponse.getBody().get("success")).isEqualTo(true);
        assertThat(topFoodsResponse.getBody().get("topFoods")).isNotNull();

        // Step 5: Get menu priors
        @SuppressWarnings({"unchecked", "rawtypes"})
        ResponseEntity<Map<String, Object>> priorsResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/priors?location={location}&mealType={mealType}",
                Map.class,
                location, mealType
        );

        assertThat(priorsResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(priorsResponse.getBody()).isNotNull();
        assertThat(priorsResponse.getBody().get("success")).isEqualTo(true);
        assertThat(priorsResponse.getBody().get("priors")).isNotNull();
    }

    @Test
    @DisplayName("Should handle Sodexo proxy endpoint end-to-end")
    void shouldHandleSodexoProxyEndpointE2E() {
        // Given
        String locationId = "48760001";
        String date = "2024-01-15";

        // When
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/sodexo/{locationId}?date={date}",
                Map.class,
                locationId, date
        );

        // Then
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isNotNull();
        assertThat(response.getBody().get("locationId")).isEqualTo(locationId);
        assertThat(response.getBody().get("date")).isEqualTo(date);
    }

    @Test
    @DisplayName("Should handle authentication flow end-to-end")
    void shouldHandleAuthenticationFlowE2E() {
        // Given
        String username = "testuser";
        String password = "testpassword";
        String email = "test@example.com";

        // Step 1: Register user
        Map<String, Object> registerRequest = Map.of(
                "username", username,
                "password", password,
                "email", email,
                "age", 25,
                "weight", 70.0,
                "height", 175.0,
                "activityLevel", "moderate",
                "vegan", false,
                "vegetarian", false
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        HttpEntity<Map<String, Object>> registerEntity = new HttpEntity<>(registerRequest, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> registerResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.exchange(
                getApiBaseUrl() + "/auth/register",
                HttpMethod.POST,
                registerEntity,
                Map.class
        );

        assertThat(registerResponse.getStatusCode().is2xxSuccessful()).isTrue();

        // Step 2: Login user
        Map<String, String> loginRequest = Map.of(
                "username", username,
                "password", password
        );

        HttpEntity<Map<String, String>> loginEntity = new HttpEntity<>(loginRequest, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> loginResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.exchange(
                getApiBaseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                Map.class
        );

        assertThat(loginResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().get("token")).isNotNull();

        // Step 3: Use token for authenticated request
        String token = (String) loginResponse.getBody().get("token");
        headers.set("Authorization", "Bearer " + token);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> profileResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.exchange(
                getApiBaseUrl() + "/users/profile",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        assertThat(profileResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(profileResponse.getBody()).isNotNull();
        assertThat(profileResponse.getBody().get("username")).isEqualTo(username);
    }

    @Test
    @DisplayName("Should handle error scenarios gracefully")
    void shouldHandleErrorScenariosGracefully() {
        // Test invalid location
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> invalidLocationResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/sodexo/invalid-location?date=2024-01-15",
                Map.class
        );

        assertThat(invalidLocationResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(invalidLocationResponse.getBody()).isNotNull();

        // Test invalid date format
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> invalidDateResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/sodexo/48760001?date=invalid-date",
                Map.class
        );

        assertThat(invalidDateResponse.getStatusCode().is4xxClientError()).isTrue();

        // Test missing parameters
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> missingParamsResponse = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                getApiBaseUrl() + "/menu/items",
                Map.class
        );

        assertThat(missingParamsResponse.getStatusCode().is4xxClientError()).isTrue();
    }

    @Test
    @DisplayName("Should handle concurrent requests")
    void shouldHandleConcurrentRequests() throws InterruptedException {
        // Given
        String location = "48760001";
        String date = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String mealType = "lunch";

        // When - Make multiple concurrent requests
        Thread[] threads = new Thread[5];
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>>[] responses = new ResponseEntity[5];

        for (int i = 0; i < 5; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                responses[index] = (ResponseEntity<Map<String, Object>>) (ResponseEntity) restTemplate.getForEntity(
                        getApiBaseUrl() + "/menu/items?location={location}&date={date}&mealType={mealType}",
                        Map.class,
                        location, date, mealType
                );
            });
        }

        // Start all threads
        for (Thread thread : threads) {
            thread.start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Then - All requests should succeed
        for (ResponseEntity<Map<String, Object>> response : responses) {
            assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("success")).isEqualTo(true);
        }
    }
}
