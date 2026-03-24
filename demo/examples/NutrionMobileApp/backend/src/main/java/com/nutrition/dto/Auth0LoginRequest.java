package com.nutrition.dto;

import jakarta.validation.constraints.NotBlank;

public class Auth0LoginRequest {
    
    @NotBlank(message = "Auth0 token is required")
    private String auth0Token;
    
    // Constructors
    public Auth0LoginRequest() {}
    
    public Auth0LoginRequest(String auth0Token) {
        this.auth0Token = auth0Token;
    }
    
    // Getters and Setters
    public String getAuth0Token() {
        return auth0Token;
    }
    
    public void setAuth0Token(String auth0Token) {
        this.auth0Token = auth0Token;
    }
}

