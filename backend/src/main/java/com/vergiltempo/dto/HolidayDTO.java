package com.vergiltempo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayDTO {
    private String id;
    private String holidayName;
    private LocalDate holidayDate;
    private String description;
    private String holidayType;
    private boolean active;
}
