package com.vergiltempo.service;

import com.vergiltempo.dto.LoginRequest;
import com.vergiltempo.dto.LoginResponse;
import com.vergiltempo.entity.Client;
import com.vergiltempo.entity.Role;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.UserRepository;
import com.vergiltempo.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        jwtUtil = Mockito.mock(JwtUtil.class);
        authService = new AuthServiceImpl(userRepository, passwordEncoder, jwtUtil);
    }

    @Test
    public void testLoginSuccess() {
        Client client = Client.builder().id(1).name("Microsoft").code("MSFT").active(true).build();
        User user = User.builder()
                .id("user-123")
                .name("John Doe")
                .username("john")
                .passwordHash("hashed-password")
                .role(Role.EMPLOYEE)
                .client(client)
                .hourlyRate(BigDecimal.valueOf(35.0))
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed-password")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("mock-jwt-token");

        LoginRequest request = new LoginRequest("john", "password");
        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("john", response.getUsername());
        assertEquals("employee", response.getRole());
        assertEquals("John Doe", response.getName());
        assertNotNull(response.getUser());
        assertEquals("Microsoft", response.getUser().getClientCompany());
    }

    @Test
    public void testLoginInvalidPassword() {
        User user = User.builder()
                .username("john")
                .passwordHash("hashed-password")
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        LoginRequest request = new LoginRequest("john", "wrong-password");
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
