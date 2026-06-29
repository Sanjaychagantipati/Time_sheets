package com.vergiltempo.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveStatusResponse {
    private boolean hasActive;
    private ActiveShiftDto log;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActiveShiftDto {
        private String id;
        private LocalDate date;
        private LocalTime clockIn;
    }
}
