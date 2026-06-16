package com.vergiltempo.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private String userId;
    private String username;
    private String role;
    private String name;
    private UserResponse user;
}
