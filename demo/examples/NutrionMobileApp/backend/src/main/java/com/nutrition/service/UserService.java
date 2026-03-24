package com.nutrition.service;

import com.nutrition.dto.RegisterRequest;
import com.nutrition.model.User;
import com.nutrition.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User createUser(RegisterRequest registerRequest) {
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmail(registerRequest.getEmail());
        user.setAge(registerRequest.getAge());
        user.setWeight(registerRequest.getWeight());
        user.setHeight(registerRequest.getHeight());
        user.setActivityLevel(registerRequest.getActivityLevel());
        user.setVegan(registerRequest.getVegan());
        user.setVegetarian(registerRequest.getVegetarian());
        
        return userRepository.save(user);
    }
    
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * Check if a user's profile is complete
     * A profile is considered complete if it has age, weight, height, and activity level
     * @param user User to check
     * @return true if profile is complete, false otherwise
     */
    public boolean isProfileComplete(User user) {
        return user.getAge() != null 
            && user.getWeight() != null && !user.getWeight().isEmpty()
            && user.getHeight() != null && !user.getHeight().isEmpty()
            && user.getActivityLevel() != null;
    }

    /**
     * Find or create a user from Auth0 token information
     * @param email Email from Auth0
     * @param username Username/sub from Auth0
     * @param name Display name from Auth0
     * @return User entity
     */
    public User findOrCreateAuth0User(String email, String username, String name) {
        // Try to find by email first
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        
        // Try to find by username
        existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            // Update email if it was missing
            User user = existingUser.get();
            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                user.setEmail(email);
                return userRepository.save(user);
            }
            return user;
        }
        
        // Create new user
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        // Set a dummy password - Auth0 users don't need password in our system
        // But User entity requires it, so we'll set a random secure password
        newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        
        return userRepository.save(newUser);
    }
}
