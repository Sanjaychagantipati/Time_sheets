package com.vergiltempo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    @NotBlank(message = "Role is required")
    private String role; // "employee" or "admin"
    
    private String clientCompany;
    
    @NotNull(message = "Rate is required")
    private BigDecimal rate;
}
