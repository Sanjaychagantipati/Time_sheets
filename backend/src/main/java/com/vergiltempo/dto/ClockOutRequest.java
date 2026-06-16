package com.vergiltempo.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockOutRequest {
    private String notes;
}
