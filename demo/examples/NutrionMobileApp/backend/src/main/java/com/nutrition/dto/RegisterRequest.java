package com.nutrition.dto;

import com.nutrition.model.ActivityLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequest {
    
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    @Email(message = "Email should be valid")
    private String email;
    
    private Integer age;
    private String weight;
    private String height;
    private ActivityLevel activityLevel;
    private Boolean vegan = false;
    private Boolean vegetarian = false;
    
    // Constructors
    public RegisterRequest() {}
    
    public RegisterRequest(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }
    
    // Getters and Setters
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
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
}
