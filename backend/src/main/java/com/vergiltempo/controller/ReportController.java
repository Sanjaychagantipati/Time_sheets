package com.vergiltempo.controller;

import com.vergiltempo.dto.MonthlyAttendanceDTO;
import com.vergiltempo.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/export-master")
    public void exportMasterCsv(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletResponse response) throws IOException {
        
        String filename = "Vergil_Tempo_Timesheets_" + LocalDate.now() + ".csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        
        reportService.writeMasterCsv(response.getWriter(), userId, client, startDate, endDate);
    }

    @GetMapping("/export-monthly")
    public void exportMonthlyCsv(
            @RequestParam String userId,
            @RequestParam String month,
            HttpServletResponse response) throws IOException {
        
        String filename = "Vergil_Tempo_Billing_" + userId + "_" + month + ".csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        
        reportService.writeMonthlyCsv(response.getWriter(), userId, month);
    }

    @GetMapping("/monthly-attendance")
    public void getMonthlyAttendancePdf(
            @RequestParam String employeeId,
            @RequestParam int month,
            @RequestParam int year,
            HttpServletResponse response) throws IOException {

        MonthlyAttendanceDTO data = reportService.getMonthlyAttendanceData(employeeId, month, year);

        String safeName = data.getEmployeeName().replaceAll("[^a-zA-Z0-9_]", "_");
        String filename = "Vergil_Tempo_Attendance_" + safeName + "_" + year + "-" + String.format("%02d", month) + ".pdf";

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        reportService.generateMonthlyAttendancePdf(response.getOutputStream(), data);
    }
}
