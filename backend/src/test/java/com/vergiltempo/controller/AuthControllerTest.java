package com.vergiltempo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vergiltempo.dto.LoginRequest;
import com.vergiltempo.dto.LoginResponse;
import com.vergiltempo.dto.UserResponse;
import com.vergiltempo.security.JwtAuthenticationFilter;
import com.vergiltempo.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testLogin() throws Exception {
        UserResponse user = UserResponse.builder()
                .id("u-emp1")
                .name("John Doe")
                .username("employee1")
                .role("employee")
                .clientCompany("Microsoft")
                .rate(BigDecimal.valueOf(35.0))
                .build();

        LoginResponse loginResponse = LoginResponse.builder()
                .token("mock-token")
                .user(user)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        LoginRequest loginRequest = new LoginRequest("employee1", "emp123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-token"))
                .andExpect(jsonPath("$.user.username").value("employee1"))
                .andExpect(jsonPath("$.user.clientCompany").value("Microsoft"));
    }
}
