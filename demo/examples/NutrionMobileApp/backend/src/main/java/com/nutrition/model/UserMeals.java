package com.nutrition.model;

import java.time.LocalDate;
import java.util.List;

// NOTE: This class is kept for backward compatibility but is NOT a JPA entity
// The actual JPA entity is UserMeal (singular) which maps to the same table
// This class can be used as a DTO or for query projections
// All JPA annotations removed to prevent Hibernate from processing this class
public class UserMeals {
    
    private Long id;
    
    private User user;
    
    private NutritionPlan nutritionPlan;
    
    private LocalDate date;
    
    private List<String> mealOfDay;
    
    // Macronutrients
    private Double totalCalories;
    
    private Double totalProtein;
    
    private Double totalCarbs;
    
    private Double totalFat;
    
    // Legacy fields - kept for backward compatibility but not mapped to DB
    // These will be calculated from total_* fields if needed
    private String dailyCalories;
    
    private String carbohydratesG;
    
    private String proteinsG;
    
    private String fatsG;
    
    private String hydration;
    
    // Micronutrients - not in current schema
    private String boronMg;
    
    private String calciumMg;
    
    private String ironMg;
    
    private String seleniumUg;
    
    private String zincMg;
    
    private String sodiumMg;
    
    // Constructors
    public UserMeals() {}
    
    public UserMeals(User user, LocalDate date) {
        this.user = user;
        this.date = date;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public NutritionPlan getNutritionPlan() {
        return nutritionPlan;
    }
    
    public void setNutritionPlan(NutritionPlan nutritionPlan) {
        this.nutritionPlan = nutritionPlan;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public List<String> getMealOfDay() {
        return mealOfDay;
    }
    
    public void setMealOfDay(List<String> mealOfDay) {
        this.mealOfDay = mealOfDay;
    }
    
    // Getters and setters for mapped database columns
    public Double getTotalCalories() {
        return totalCalories;
    }
    
    public void setTotalCalories(Double totalCalories) {
        this.totalCalories = totalCalories;
    }
    
    public Double getTotalProtein() {
        return totalProtein;
    }
    
    public void setTotalProtein(Double totalProtein) {
        this.totalProtein = totalProtein;
    }
    
    public Double getTotalCarbs() {
        return totalCarbs;
    }
    
    public void setTotalCarbs(Double totalCarbs) {
        this.totalCarbs = totalCarbs;
    }
    
    public Double getTotalFat() {
        return totalFat;
    }
    
    public void setTotalFat(Double totalFat) {
        this.totalFat = totalFat;
    }
    
    // Legacy getters/setters for backward compatibility (transient fields)
    public String getDailyCalories() {
        return dailyCalories;
    }
    
    public void setDailyCalories(String dailyCalories) {
        this.dailyCalories = dailyCalories;
    }
    
    public String getCarbohydratesG() {
        return carbohydratesG;
    }
    
    public void setCarbohydratesG(String carbohydratesG) {
        this.carbohydratesG = carbohydratesG;
    }
    
    public String getProteinsG() {
        return proteinsG;
    }
    
    public void setProteinsG(String proteinsG) {
        this.proteinsG = proteinsG;
    }
    
    public String getFatsG() {
        return fatsG;
    }
    
    public void setFatsG(String fatsG) {
        this.fatsG = fatsG;
    }
    
    public String getHydration() {
        return hydration;
    }
    
    public void setHydration(String hydration) {
        this.hydration = hydration;
    }
    
    public String getBoronMg() {
        return boronMg;
    }
    
    public void setBoronMg(String boronMg) {
        this.boronMg = boronMg;
    }
    
    public String getCalciumMg() {
        return calciumMg;
    }
    
    public void setCalciumMg(String calciumMg) {
        this.calciumMg = calciumMg;
    }
    
    public String getIronMg() {
        return ironMg;
    }
    
    public void setIronMg(String ironMg) {
        this.ironMg = ironMg;
    }
    
    public String getSeleniumUg() {
        return seleniumUg;
    }
    
    public void setSeleniumUg(String seleniumUg) {
        this.seleniumUg = seleniumUg;
    }
    
    public String getZincMg() {
        return zincMg;
    }
    
    public void setZincMg(String zincMg) {
        this.zincMg = zincMg;
    }
    
    public String getSodiumMg() {
        return sodiumMg;
    }
    
    public void setSodiumMg(String sodiumMg) {
        this.sodiumMg = sodiumMg;
    }
}
