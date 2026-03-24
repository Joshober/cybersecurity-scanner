package com.nutrition.dto;

import com.nutrition.model.User;

public class AuthResponse {
    
    private String token;
    private String type = "Bearer";
    private User user;
    private Boolean profileComplete;
    
    // Constructors
    public AuthResponse() {}
    
    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = user;
        this.profileComplete = isProfileComplete(user);
    }
    
    public AuthResponse(String token, User user, Boolean profileComplete) {
        this.token = token;
        this.user = user;
        this.profileComplete = profileComplete;
    }
    
    private Boolean isProfileComplete(User user) {
        return user.getAge() != null 
            && user.getWeight() != null && !user.getWeight().isEmpty()
            && user.getHeight() != null && !user.getHeight().isEmpty()
            && user.getActivityLevel() != null;
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Boolean getProfileComplete() {
        return profileComplete;
    }
    
    public void setProfileComplete(Boolean profileComplete) {
        this.profileComplete = profileComplete;
    }
}
