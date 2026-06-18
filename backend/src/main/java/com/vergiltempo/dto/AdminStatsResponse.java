package com.vergiltempo.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long currentlyClockedIn;
    private long activeEmployees; // same as currentlyClockedIn
    private long totalEmployees;
    private long activeClients;
    private long totalClients; // same as activeClients
    private long timesheetsSubmittedToday;
}
