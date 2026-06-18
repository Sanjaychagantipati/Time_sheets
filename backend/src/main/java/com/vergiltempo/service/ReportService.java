package com.vergiltempo.service;

import com.vergiltempo.dto.MonthlyAttendanceDTO;
import java.io.OutputStream;
import java.io.Writer;

public interface ReportService {
    void writeMasterCsv(Writer writer, String userId, String client, String startDate, String endDate);
    void writeMonthlyCsv(Writer writer, String userId, String month);
    
    MonthlyAttendanceDTO getMonthlyAttendanceData(String employeeId, int month, int year);
    void generateMonthlyAttendancePdf(OutputStream outputStream, MonthlyAttendanceDTO data);
}
