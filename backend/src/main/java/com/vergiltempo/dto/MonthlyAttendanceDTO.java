package com.vergiltempo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyAttendanceDTO {
    private String companyName;
    private String monthLabel;
    private String employeeName;
    private String clientCompany;
    private List<AttendanceRowDTO> rows;
}
