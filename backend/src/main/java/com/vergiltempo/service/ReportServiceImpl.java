package com.vergiltempo.service;

import com.vergiltempo.entity.*;
import com.vergiltempo.repository.*;
import com.vergiltempo.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;

    public ReportServiceImpl(TimesheetRepository timesheetRepository, UserRepository userRepository) {
        this.timesheetRepository = timesheetRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void writeMasterCsv(Writer writer, String userId, String client, String startDate, String endDate) {
        String queryUserId = (userId == null || userId.trim().isEmpty() || "all".equalsIgnoreCase(userId)) ? null : userId;
        String queryClient = (client == null || client.trim().isEmpty() || "all".equalsIgnoreCase(client)) ? null : client;
        LocalDate queryStartDate = (startDate == null || startDate.trim().isEmpty()) ? null : LocalDate.parse(startDate);
        LocalDate queryEndDate = (endDate == null || endDate.trim().isEmpty()) ? null : LocalDate.parse(endDate);

        List<Timesheet> timesheets = timesheetRepository.findFilteredTimesheets(
                queryUserId, queryClient, queryStartDate, queryEndDate);

        PrintWriter pw = new PrintWriter(writer);
        pw.println("Candidate Name,Client Company,Hourly Rate ($),Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes");

        for (Timesheet t : timesheets) {
            String name = csvQuote(t.getUser().getName());
            String clientName = csvQuote(t.getClient().getName());
            String rate = t.getUser().getHourlyRate().toString();
            String date = csvQuote(t.getDate().toString());
            String clockIn = csvQuote(t.getClockIn().toString());
            String clockOut = t.getClockOut() != null ? csvQuote(t.getClockOut().toString()) : csvQuote("N/A");
            String hours = t.getClockOut() != null ? t.getHours().toString() : "Active Clock";
            String location = csvQuote(t.getLocation());
            String notes = csvQuote(t.getNotes());

            pw.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    name, clientName, rate, date, clockIn, clockOut, hours, location, notes);
        }
        pw.flush();
    }

    @Override
    public void writeMonthlyCsv(Writer writer, String userId, String month) {
        User candidate = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + userId));

        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate start = LocalDate.of(year, monthVal, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<Timesheet> logs = timesheetRepository.findByUserIdAndDateBetweenAndClockOutIsNotNullOrderByDateAscClockInAsc(
                userId, start, end);

        if (logs.isEmpty()) {
            throw new ResourceNotFoundException("No logged hours found for this candidate in the selected month");
        }

        BigDecimal totalHours = BigDecimal.ZERO;
        for (Timesheet log : logs) {
            if (log.getHours() != null) {
                totalHours = totalHours.add(log.getHours());
            }
        }
        BigDecimal totalBillable = totalHours.multiply(candidate.getHourlyRate());

        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
        String monthLabel = start.format(labelFormatter);

        PrintWriter pw = new PrintWriter(writer);
        pw.println("VERGIL TEMPO STAFFING AGENCY - CANDIDATE BILLING REPORT");
        pw.printf("Candidate Name,%s\n", csvQuote(candidate.getName()));
        pw.printf("Billing Month,%s\n", csvQuote(monthLabel));
        pw.printf("Placed Client Company,%s\n", candidate.getClient() != null ? csvQuote(candidate.getClient().getName()) : csvQuote("N/A"));
        pw.printf("Payroll Hourly Rate,$%s\n\n", candidate.getHourlyRate().setScale(2, BigDecimal.ROUND_HALF_UP).toString());

        pw.println("Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes");

        for (Timesheet log : logs) {
            String date = csvQuote(log.getDate().toString());
            String clockIn = csvQuote(log.getClockIn().toString());
            String clockOut = csvQuote(log.getClockOut().toString());
            String hours = log.getHours().setScale(2, BigDecimal.ROUND_HALF_UP).toString();
            String location = csvQuote(log.getLocation());
            String notes = csvQuote(log.getNotes());

            pw.printf("%s,%s,%s,%s,%s,%s\n", date, clockIn, clockOut, hours, location, notes);
        }

        pw.println();
        pw.printf("TOTAL BILLABLE HOURS,,,%s\n", totalHours.setScale(2, BigDecimal.ROUND_HALF_UP).toString());
        
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.US);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        String formattedBillable = nf.format(totalBillable);
        pw.printf("TOTAL BILLABLE AMOUNT,,, \"$%s\"\n", formattedBillable);
        pw.flush();
    }

    private String csvQuote(String str) {
        if (str == null) {
            return "\"\"";
        }
        return "\"" + str.replace("\"", "\"\"") + "\"";
    }
}
