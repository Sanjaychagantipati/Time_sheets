package com.vergiltempo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTimesheetRequest {
    private String userId; // optional for edit, required for manual create
    
    @NotNull(message = "Date is required")
    private LocalDate date;
    
    @NotNull(message = "Clock in time is required")
    private LocalTime clockIn;
    
    private LocalTime clockOut; // optional
    
    private String notes;
    
    @NotBlank(message = "Client company is required")
    private String clientCompany;
}
