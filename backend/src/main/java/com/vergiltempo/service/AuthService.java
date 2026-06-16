package com.vergiltempo.service;

import com.vergiltempo.dto.LoginRequest;
import com.vergiltempo.dto.LoginResponse;
import com.vergiltempo.dto.UserResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    UserResponse getCurrentUser(String username);
}
