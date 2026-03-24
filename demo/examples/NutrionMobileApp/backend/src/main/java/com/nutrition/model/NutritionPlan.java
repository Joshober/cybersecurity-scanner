package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "nutrition_plans")
public class NutritionPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Plan name is required")
    private String name;
    
    private String description;
    
    // General Information
    private String age;
    private String sex;
    private String height;
    private String weight;
    @Column(name = "formula_written")
    private String formulaWritten;
    @Column(name = "factor_name")
    private String factorName;
    @Column(name = "factor_value")
    private String factorValue;
    
    // Macronutrients
    @Column(name = "daily_calories")
    private String dailyCalories;
    @Column(name = "carbohydrates_g")
    private String carbohydratesG;
    @Column(name = "proteins_g")
    private String proteinsG;
    @Column(name = "fats_g")
    private String fatsG;
    private String hydration;
    
    // Micronutrients
    @Column(name = "boron_mg")
    private String boronMg;
    @Column(name = "calcium_mg")
    private String calciumMg;
    @Column(name = "iron_mg")
    private String ironMg;
    @Column(name = "selenium_ug")
    private String seleniumUg;
    @Column(name = "zinc_mg")
    private String zincMg;
    @Column(name = "sodium_mg")
    private String sodiumMg;
    
    // Constructors
    public NutritionPlan() {}
    
    public NutritionPlan(String name, String description) {
        this.name = name;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getAge() {
        return age;
    }
    
    public void setAge(String age) {
        this.age = age;
    }
    
    public String getSex() {
        return sex;
    }
    
    public void setSex(String sex) {
        this.sex = sex;
    }
    
    public String getHeight() {
        return height;
    }
    
    public void setHeight(String height) {
        this.height = height;
    }
    
    public String getWeight() {
        return weight;
    }
    
    public void setWeight(String weight) {
        this.weight = weight;
    }
    
    public String getFormulaWritten() {
        return formulaWritten;
    }
    
    public void setFormulaWritten(String formulaWritten) {
        this.formulaWritten = formulaWritten;
    }
    
    public String getFactorName() {
        return factorName;
    }
    
    public void setFactorName(String factorName) {
        this.factorName = factorName;
    }
    
    public String getFactorValue() {
        return factorValue;
    }
    
    public void setFactorValue(String factorValue) {
        this.factorValue = factorValue;
    }
    
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
