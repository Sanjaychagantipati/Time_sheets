package com.vergiltempo.service;

import com.vergiltempo.dto.LoginRequest;
import com.vergiltempo.dto.LoginResponse;
import com.vergiltempo.dto.UserResponse;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.UserRepository;
import com.vergiltempo.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepo sitory userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user);
        
        UserResponse userResponse = buildUserResponse(user);

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name().toLowerCase())
                .name(user.getName())
                .user(userResponse)
                .build();
    }

    @Override
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return buildUserResponse(user);
    }

    private UserResponse buildUserResponse(User user) {
        String clientCompany = user.getClient() != null ? user.getClient().getName() : "N/A";
        Integer clientId = user.getClient() != null ? user.getClient().getId() : null;

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .role(user.getRole().name().toLowerCase())
                .hourlyRate(user.getHourlyRate())
                .clientId(clientId)
                .clientCompany(clientCompany)
                .rate(user.getHourlyRate())
                .build();
    }
}
