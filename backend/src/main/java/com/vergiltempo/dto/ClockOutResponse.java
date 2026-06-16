package com.vergiltempo.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockOutResponse {
    private String message;
    private ClockOutLogDto log;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClockOutLogDto {
        private String id;
        private LocalTime clockOut;
        private BigDecimal hours;
        private String notes;
    }
}
