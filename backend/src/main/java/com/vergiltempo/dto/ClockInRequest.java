package com.vergiltempo.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockInRequest {
    private String timezone;
    private String browser;
    private String operatingSystem;
    private String deviceType;
    private String screenResolution;
    private Long clientElapsedMs;
}
