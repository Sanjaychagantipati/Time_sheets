package com.vergiltempo.controller;

import com.vergiltempo.dto.LoginRequest;
import com.vergiltempo.dto.LoginResponse;
import com.vergiltempo.dto.UserResponse;
import com.vergiltempo.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse response = authService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
