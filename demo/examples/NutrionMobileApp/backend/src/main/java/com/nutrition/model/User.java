package com.nutrition.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Column(unique = true, nullable = false)
    private String username;
    
    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;
    
    @Email(message = "Email should be valid")
    @Column(unique = true)
    private String email;
    
    private Integer age;
    private String weight;
    private String height;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level")
    private ActivityLevel activityLevel;
    
    private Boolean vegan = false;
    private Boolean vegetarian = false;
    
    // Macronutrients
    @Column(name = "daily_calories")
    private String dailyCalories;
    @Column(name = "carbohydrates_g")
    private String carbohydratesG;
    @Column(name = "proteins_g")
    private String proteinsG;
    @Column(name = "fats_g")
    private String fatsG;
    
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nutrition_plan_id")
    private NutritionPlan nutritionPlan;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return username;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public User() {}
    
    public User(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public Integer getAge() {
        return age;
    }
    
    public void setAge(Integer age) {
        this.age = age;
    }
    
    public String getWeight() {
        return weight;
    }
    
    public void setWeight(String weight) {
        this.weight = weight;
    }
    
    public String getHeight() {
        return height;
    }
    
    public void setHeight(String height) {
        this.height = height;
    }
    
    public ActivityLevel getActivityLevel() {
        return activityLevel;
    }
    
    public void setActivityLevel(ActivityLevel activityLevel) {
        this.activityLevel = activityLevel;
    }
    
    public Boolean getVegan() {
        return vegan;
    }
    
    public void setVegan(Boolean vegan) {
        this.vegan = vegan;
    }
    
    public Boolean getVegetarian() {
        return vegetarian;
    }
    
    public void setVegetarian(Boolean vegetarian) {
        this.vegetarian = vegetarian;
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
    
    public NutritionPlan getNutritionPlan() {
        return nutritionPlan;
    }
    
    public void setNutritionPlan(NutritionPlan nutritionPlan) {
        this.nutritionPlan = nutritionPlan;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Convenience methods for boolean fields
    public boolean isVegan() {
        return vegan != null && vegan;
    }
    
    public boolean isVegetarian() {
        return vegetarian != null && vegetarian;
    }
}
