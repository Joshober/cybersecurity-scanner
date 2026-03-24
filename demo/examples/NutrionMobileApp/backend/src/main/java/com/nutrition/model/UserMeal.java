package com.nutrition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_meals")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserMeal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
    
    @NotNull
    @Column(name = "meal_date", nullable = false)
    private LocalDateTime mealDate;
    
    @Column(name = "meal_type")
    private String mealType; // breakfast, lunch, dinner
    
    @Column(name = "total_calories")
    private Double totalCalories;
    
    @Column(name = "total_protein")
    private Double totalProtein;
    
    @Column(name = "total_carbs")
    private Double totalCarbs;
    
    @Column(name = "total_fat")
    private Double totalFat;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "userMeal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FoodRecognition> foodRecognitions;
    
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
    public UserMeal() {}
    
    public UserMeal(User user, LocalDateTime mealDate, String mealType) {
        this.user = user;
        this.mealDate = mealDate;
        this.mealType = mealType;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public LocalDateTime getMealDate() { return mealDate; }
    public void setMealDate(LocalDateTime mealDate) { this.mealDate = mealDate; }
    
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
    
    public Double getTotalCalories() { return totalCalories; }
    public void setTotalCalories(Double totalCalories) { this.totalCalories = totalCalories; }
    
    public Double getTotalProtein() { return totalProtein; }
    public void setTotalProtein(Double totalProtein) { this.totalProtein = totalProtein; }
    
    public Double getTotalCarbs() { return totalCarbs; }
    public void setTotalCarbs(Double totalCarbs) { this.totalCarbs = totalCarbs; }
    
    public Double getTotalFat() { return totalFat; }
    public void setTotalFat(Double totalFat) { this.totalFat = totalFat; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<FoodRecognition> getFoodRecognitions() { return foodRecognitions; }
    public void setFoodRecognitions(List<FoodRecognition> foodRecognitions) { this.foodRecognitions = foodRecognitions; }
}
