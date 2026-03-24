package com.nutrition.unit;

import com.nutrition.dto.RegisterRequest;
import com.nutrition.model.ActivityLevel;
import com.nutrition.model.MenuItem;
import com.nutrition.model.NutritionEntry;
import com.nutrition.model.PortionAnalysis;
import com.nutrition.model.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Factory class for creating test data objects
 */
public class TestDataFactory {

    private static final Random random = new Random();

    /**
     * Create a test user
     */
    public static User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("encodedPassword");
        user.setEmail("test@example.com");
        user.setAge(25);
        user.setWeight("70.0");
        user.setHeight("175.0");
        user.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        user.setVegan(false);
        user.setVegetarian(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    /**
     * Create a test user with custom values
     */
    public static User createTestUser(String username, String email) {
        User user = createTestUser();
        user.setUsername(username);
        user.setEmail(email);
        return user;
    }

    /**
     * Create a test register request
     */
    public static RegisterRequest createTestRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setAge(25);
        request.setWeight("70.0");
        request.setHeight("175.0");
        request.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        request.setVegan(false);
        request.setVegetarian(false);
        return request;
    }

    /**
     * Create a test register request with custom values
     */
    public static RegisterRequest createTestRegisterRequest(String username, String email) {
        RegisterRequest request = createTestRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        return request;
    }

    /**
     * Create a test menu item
     */
    public static MenuItem createTestMenuItem() {
        MenuItem item = new MenuItem();
        item.setId(1L);
        item.setName("Test Food Item");
        item.setDescription("A test food item for testing purposes");
        item.setCategory("Test Category");
        item.setLocation("48760001");
        item.setDate(LocalDate.of(2024, 1, 15));
        item.setMealType("lunch");
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return item;
    }

    /**
     * Create a test menu item with custom values
     */
    public static MenuItem createTestMenuItem(String name, String category, String mealType) {
        MenuItem item = createTestMenuItem();
        item.setName(name);
        item.setCategory(category);
        item.setMealType(mealType);
        return item;
    }

    /**
     * Create a list of test menu items
     */
    public static List<MenuItem> createTestMenuItems(int count) {
        List<MenuItem> items = new ArrayList<>();
        String[] categories = {"Breakfast", "Lunch", "Dinner", "Snack"};
        String[] mealTypes = {"breakfast", "lunch", "dinner", "snack"};
        String[] foodNames = {"Scrambled Eggs", "Grilled Chicken", "Salad", "Pasta", "Rice", "Bread"};

        for (int i = 0; i < count; i++) {
            MenuItem item = createTestMenuItem();
            item.setId((long) (i + 1));
            item.setName(foodNames[i % foodNames.length]);
            item.setCategory(categories[i % categories.length]);
            item.setMealType(mealTypes[i % mealTypes.length]);
            items.add(item);
        }

        return items;
    }

    /**
     * Create a test nutrition entry
     */
    public static NutritionEntry createTestNutritionEntry() {
        NutritionEntry entry = new NutritionEntry();
        entry.setId(1L);
        entry.setUserId(1L);
        entry.setFoodName("Test Food");
        entry.setCalories(250.0);
        entry.setProtein(15.0);
        entry.setCarbs(30.0);
        entry.setFat(10.0);
        entry.setFiber(5.0);
        entry.setSugar(8.0);
        entry.setSodium(400.0);
        entry.setEntryDate(LocalDate.now());
        entry.setCreatedAt(LocalDateTime.now());
        entry.setUpdatedAt(LocalDateTime.now());
        return entry;
    }

    /**
     * Create a test nutrition entry with custom values
     */
    public static NutritionEntry createTestNutritionEntry(String foodName, double calories) {
        NutritionEntry entry = createTestNutritionEntry();
        entry.setFoodName(foodName);
        entry.setCalories(calories);
        return entry;
    }

    /**
     * Create a test portion analysis
     */
    public static PortionAnalysis createTestPortionAnalysis() {
        PortionAnalysis analysis = new PortionAnalysis();
        analysis.setId(1L);
        analysis.setUserId(1L);
        analysis.setImagePath("/test/path/image.jpg");
        analysis.setFoodItems("chicken,rice,vegetables");
        analysis.setConfidenceScores("0.95,0.87,0.92");
        analysis.setAnalysisDate(LocalDate.now());
        analysis.setCreatedAt(LocalDateTime.now());
        analysis.setUpdatedAt(LocalDateTime.now());
        return analysis;
    }

    /**
     * Create a test portion analysis with custom values
     */
    public static PortionAnalysis createTestPortionAnalysis(String foodItems, String confidenceScores) {
        PortionAnalysis analysis = createTestPortionAnalysis();
        analysis.setFoodItems(foodItems);
        analysis.setConfidenceScores(confidenceScores);
        return analysis;
    }

    /**
     * Create a list of test nutrition entries
     */
    public static List<NutritionEntry> createTestNutritionEntries(int count) {
        List<NutritionEntry> entries = new ArrayList<>();
        String[] foodNames = {"Apple", "Banana", "Chicken Breast", "Rice", "Salad", "Pasta"};
        double[] calories = {80, 105, 165, 130, 25, 220};

        for (int i = 0; i < count; i++) {
            NutritionEntry entry = createTestNutritionEntry();
            entry.setId((long) (i + 1));
            entry.setFoodName(foodNames[i % foodNames.length]);
            entry.setCalories(calories[i % calories.length]);
            entry.setProtein(10.0 + random.nextDouble() * 20);
            entry.setCarbs(15.0 + random.nextDouble() * 30);
            entry.setFat(5.0 + random.nextDouble() * 15);
            entries.add(entry);
        }

        return entries;
    }

    /**
     * Create a random string of specified length
     */
    public static String createRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Create a random email address
     */
    public static String createRandomEmail() {
        return createRandomString(8) + "@example.com";
    }

    /**
     * Create a random username
     */
    public static String createRandomUsername() {
        return "user" + createRandomString(6);
    }

    /**
     * Create a random date within the last 30 days
     */
    public static LocalDate createRandomDate() {
        return LocalDate.now().minusDays(random.nextInt(30));
    }

    /**
     * Create a random date time within the last 7 days
     */
    public static LocalDateTime createRandomDateTime() {
        return LocalDateTime.now().minusDays(random.nextInt(7));
    }
}
