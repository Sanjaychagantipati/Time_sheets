package com.vergiltempo.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockInResponse {
    private String message;
    private TimesheetLogDto log;
}
