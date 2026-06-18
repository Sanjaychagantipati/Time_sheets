package com.vergiltempo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRowDTO {
    private String date;
    private String day;
    private String logIn;
    private String logOut;
    private String totalHours;
    private String employeeName;
    private String clientCompany;
    private String status;
}
