package com.vergiltempo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRequest {
    @NotBlank(message = "Client company name is required")
    private String name;
}
