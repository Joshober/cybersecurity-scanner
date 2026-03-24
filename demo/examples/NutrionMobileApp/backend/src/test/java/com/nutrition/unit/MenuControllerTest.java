package com.nutrition.unit;

import com.nutrition.controller.MenuController;
import com.nutrition.model.MenuItem;
import com.nutrition.service.SimpleMenuIngestService;
import com.nutrition.service.SimpleMenuPriorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MenuController
 */
@ExtendWith(MockitoExtension.class)
class MenuControllerTest extends BaseUnitTest {

    @Mock
    private SimpleMenuIngestService menuIngestService;

    @Mock
    private SimpleMenuPriorService menuPriorService;

    @InjectMocks
    private MenuController menuController;

    private LocalDateTime testDate;
    private String testLocation;
    private String testMealType;

    @BeforeEach
    void setUp() {
        super.setUp();
        testDate = LocalDateTime.of(2024, 1, 15, 12, 0);
        testLocation = "48760001";
        testMealType = "lunch";
    }

    @Test
    @DisplayName("Should successfully ingest menu when service returns success")
    void shouldSuccessfullyIngestMenu() {
        // Given
        var mockResult = new SimpleMenuIngestService.MenuIngestResult();
        mockResult.setSuccess(true);
        mockResult.setMessage("Success");
        mockResult.setLocation(testLocation);
        mockResult.setDate(testDate);
        mockResult.setMealType(testMealType);
        mockResult.setItemsIngested(5);
        mockResult.setItemsProcessed(5);
        when(menuIngestService.ingestMenu(anyString(), any(LocalDateTime.class), anyString()))
                .thenReturn(mockResult);

        // When
        ResponseEntity<Map<String, Object>> response = menuController.ingestMenu(
                testLocation, testDate, testMealType);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(true);
        assertThat(response.getBody().get("message")).isEqualTo("Success");
        assertThat(response.getBody().get("itemsIngested")).isEqualTo(5);

        verify(menuIngestService).ingestMenu(testLocation, testDate, testMealType);
    }

    @Test
    @DisplayName("Should handle service failure gracefully")
    void shouldHandleServiceFailure() {
        // Given
        var mockResult = new SimpleMenuIngestService.MenuIngestResult();
        mockResult.setSuccess(false);
        mockResult.setMessage("Service error");
        mockResult.setLocation(testLocation);
        mockResult.setDate(testDate);
        mockResult.setMealType(testMealType);
        mockResult.setItemsIngested(0);
        mockResult.setItemsProcessed(0);
        when(menuIngestService.ingestMenu(anyString(), any(LocalDateTime.class), anyString()))
                .thenReturn(mockResult);

        // When
        ResponseEntity<Map<String, Object>> response = menuController.ingestMenu(
                testLocation, testDate, testMealType);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(false);
        assertThat(response.getBody().get("message")).isEqualTo("Service error");
    }

    @Test
    @DisplayName("Should handle exception during menu ingestion")
    void shouldHandleExceptionDuringIngestion() {
        // Given
        when(menuIngestService.ingestMenu(anyString(), any(LocalDateTime.class), anyString()))
                .thenThrow(new RuntimeException("Database error"));

        // When
        ResponseEntity<Map<String, Object>> response = menuController.ingestMenu(
                testLocation, testDate, testMealType);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(false);
        assertThat(response.getBody().get("message")).isEqualTo("Failed to ingest menu: Database error");
    }

    @Test
    @DisplayName("Should return menu items successfully")
    void shouldReturnMenuItemsSuccessfully() {
        // Given
        List<MenuItem> mockMenuItems = createMockMenuItems();
        when(menuIngestService.getMenuItems(anyString(), any(LocalDateTime.class), anyString()))
                .thenReturn(mockMenuItems);

        // When
        ResponseEntity<Map<String, Object>> response = menuController.getMenuItems(
                testLocation, testDate, testMealType, null);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(true);
        assertThat(response.getBody().get("itemCount")).isEqualTo(2);
        assertThat(response.getBody().get("menuItems")).isInstanceOf(List.class);

        verify(menuIngestService).getMenuItems(testLocation, testDate, testMealType);
    }

    @Test
    @DisplayName("Should filter menu items by category")
    void shouldFilterMenuItemsByCategory() {
        // Given
        List<MenuItem> mockMenuItems = createMockMenuItems();
        when(menuIngestService.getMenuItems(anyString(), any(LocalDateTime.class), anyString()))
                .thenReturn(mockMenuItems);

        // When
        ResponseEntity<Map<String, Object>> response = menuController.getMenuItems(
                testLocation, testDate, testMealType, "Breakfast");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("category")).isEqualTo("Breakfast");
    }

    @Test
    @DisplayName("Should handle Sodexo proxy endpoint successfully")
    void shouldHandleSodexoProxyEndpoint() {
        // Given
        var mockResult = new SimpleMenuIngestService.MenuIngestResult();
        mockResult.setSuccess(true);
        mockResult.setMessage("Success");
        mockResult.setLocation(testLocation);
        mockResult.setDate(testDate);
        mockResult.setMealType(null);
        mockResult.setItemsIngested(3);
        mockResult.setItemsProcessed(3);
        List<MenuItem> mockMenuItems = createMockMenuItems();
        
        when(menuIngestService.ingestMenu(anyString(), any(LocalDateTime.class), isNull()))
                .thenReturn(mockResult);
        when(menuIngestService.getMenuItems(anyString(), any(LocalDateTime.class), isNull()))
                .thenReturn(mockMenuItems);

        // When
        ResponseEntity<Map<String, Object>> response = menuController.getSodexoMenu(
                testLocation, "2024-01-15");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(true);
        assertThat(response.getBody().get("locationId")).isEqualTo(testLocation);
        assertThat(response.getBody().get("itemCount")).isEqualTo(2);
    }

    private List<MenuItem> createMockMenuItems() {
        List<MenuItem> items = new ArrayList<>();
        
        MenuItem item1 = new MenuItem();
        item1.setId(1L);
        item1.setName("Scrambled Eggs");
        item1.setCategory("Breakfast");
        item1.setLocation(testLocation);
        item1.setDate(LocalDate.of(2024, 1, 15));
        item1.setMealType(testMealType);
        items.add(item1);

        MenuItem item2 = new MenuItem();
        item2.setId(2L);
        item2.setName("Grilled Chicken");
        item2.setCategory("Lunch");
        item2.setLocation(testLocation);
        item2.setDate(LocalDate.of(2024, 1, 15));
        item2.setMealType(testMealType);
        items.add(item2);

        return items;
    }
}
