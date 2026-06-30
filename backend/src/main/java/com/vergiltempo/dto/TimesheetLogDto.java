package com.vergiltempo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetLogDto {
    private String id;
    private String userId;
    private LocalDate date;
    private LocalTime clockIn;
    private LocalTime clockOut;
    private BigDecimal hours;
    private String notes;
    private String clientCompany;
    private String status;
    private String browser;
    private String operatingSystem;
    private String deviceType;
    private String screenResolution;
    private String ipAddress;
    private String userAgent;
    private java.util.List<SessionDto> sessions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionDto {
        private String id;
        private LocalTime clockIn;
        private LocalTime clockOut;
        private BigDecimal hours;
    }
}

