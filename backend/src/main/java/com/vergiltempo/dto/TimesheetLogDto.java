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
    private String location;
    private String notes;
    private String clientCompany;
    private String status;
}

