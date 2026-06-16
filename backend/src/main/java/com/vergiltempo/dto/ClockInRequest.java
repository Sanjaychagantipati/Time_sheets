package com.vergiltempo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockInRequest {
    @NotBlank(message = "Location is required")
    private String location;
}
