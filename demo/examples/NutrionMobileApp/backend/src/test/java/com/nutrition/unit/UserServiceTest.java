package com.nutrition.unit;

import com.nutrition.dto.RegisterRequest;
import com.nutrition.model.ActivityLevel;
import com.nutrition.model.User;
import com.nutrition.repository.UserRepository;
import com.nutrition.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest extends BaseUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private RegisterRequest testRegisterRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        super.setUp();
        setupTestData();
    }

    protected void setupTestData() {
        testRegisterRequest = new RegisterRequest();
        testRegisterRequest.setUsername("testuser");
        testRegisterRequest.setPassword("password123");
        testRegisterRequest.setEmail("test@example.com");
        testRegisterRequest.setAge(25);
        testRegisterRequest.setWeight("70.0");
        testRegisterRequest.setHeight("175.0");
        testRegisterRequest.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        testRegisterRequest.setVegan(false);
        testRegisterRequest.setVegetarian(false);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encodedPassword");
        testUser.setEmail("test@example.com");
        testUser.setAge(25);
        testUser.setWeight("70.0");
        testUser.setHeight("175.0");
        testUser.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        testUser.setVegan(false);
        testUser.setVegetarian(false);
    }

    @Test
    @DisplayName("Should create user successfully with valid registration request")
    void shouldCreateUserSuccessfully() {
        // Given
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.createUser(testRegisterRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getPassword()).isEqualTo("encodedPassword");
        assertThat(result.getAge()).isEqualTo(25);
        assertThat(result.getWeight()).isEqualTo("70.0");
        assertThat(result.getHeight()).isEqualTo("175.0");
        assertThat(result.getActivityLevel()).isEqualTo(ActivityLevel.MODERATELY_ACTIVE);
        assertThat(result.isVegan()).isFalse();
        assertThat(result.isVegetarian()).isFalse();

        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should find user by username")
    void shouldFindUserByUsername() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.findByUsername("testuser");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("testuser");
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    @DisplayName("Should return empty when user not found by username")
    void shouldReturnEmptyWhenUserNotFoundByUsername() {
        // Given
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // When
        Optional<User> result = userService.findByUsername("nonexistent");

        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.findByEmail("test@example.com");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should return empty when user not found by email")
    void shouldReturnEmptyWhenUserNotFoundByEmail() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        Optional<User> result = userService.findByEmail("nonexistent@example.com");

        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    @DisplayName("Should check if username exists")
    void shouldCheckIfUsernameExists() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        when(userRepository.existsByUsername("nonexistent")).thenReturn(false);

        // When
        boolean exists = userService.existsByUsername("testuser");
        boolean notExists = userService.existsByUsername("nonexistent");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
        verify(userRepository).existsByUsername("testuser");
        verify(userRepository).existsByUsername("nonexistent");
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfEmailExists() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("nonexistent@example.com")).thenReturn(false);

        // When
        boolean exists = userService.existsByEmail("test@example.com");
        boolean notExists = userService.existsByEmail("nonexistent@example.com");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).existsByEmail("nonexistent@example.com");
    }

    @Test
    @DisplayName("Should handle password encoding correctly")
    void shouldHandlePasswordEncodingCorrectly() {
        // Given
        String rawPassword = "password123";
        String encodedPassword = "encodedPassword123";
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.createUser(testRegisterRequest);

        // Then
        assertThat(result.getPassword()).isEqualTo(encodedPassword);
        verify(passwordEncoder).encode(rawPassword);
    }
}
