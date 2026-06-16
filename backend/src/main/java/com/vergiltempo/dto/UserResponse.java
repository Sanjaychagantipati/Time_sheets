package com.vergiltempo.dto;

import java.math.BigDecimal;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id;
    private String name;
    private String username;
    private String role;
    private BigDecimal hourlyRate;
    private Integer clientId;
    private String clientCompany;
    private BigDecimal rate;
}
