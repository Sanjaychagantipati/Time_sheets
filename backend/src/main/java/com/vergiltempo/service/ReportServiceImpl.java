package com.vergiltempo.service;

import com.vergiltempo.dto.AttendanceRowDTO;
import com.vergiltempo.dto.MonthlyAttendanceDTO;
import com.vergiltempo.entity.*;
import com.vergiltempo.repository.*;
import com.vergiltempo.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import java.awt.Color;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
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

    @Override
    public MonthlyAttendanceDTO getMonthlyAttendanceData(String employeeId, int month, int year) {
        User candidate = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + employeeId));

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<Timesheet> logs = timesheetRepository.findByUserIdAndDateBetweenOrderByDateAsc(
                employeeId, start, end);

        // Map logs by date for fast lookup
        java.util.Map<LocalDate, Timesheet> logMap = new java.util.HashMap<>();
        for (Timesheet log : logs) {
            logMap.put(log.getDate(), log);
        }

        java.util.List<AttendanceRowDTO> rows = new java.util.ArrayList<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            boolean isWeekend = (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY);
            
            String dateStr = date.format(dateFormatter);
            String dayStr = dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            AttendanceRowDTO.AttendanceRowDTOBuilder rowBuilder = AttendanceRowDTO.builder()
                    .date(dateStr)
                    .day(dayStr);

            if (isWeekend) {
                rowBuilder
                        .logIn("-")
                        .logOut("-")
                        .totalHours("-")
                        .employeeName("-")
                        .clientCompany("-")
                        .status("");
            } else {
                Timesheet log = logMap.get(date);
                if (log != null) {
                    String logInStr = log.getClockIn() != null ? log.getClockIn().format(DateTimeFormatter.ofPattern("HH:mm")) : "-";
                    String logOutStr = log.getClockOut() != null ? log.getClockOut().format(DateTimeFormatter.ofPattern("HH:mm")) : "-";
                    String hoursStr = log.getHours() != null ? log.getHours().setScale(2, BigDecimal.ROUND_HALF_UP).toString() : "0.00";

                    rowBuilder
                            .logIn(logInStr)
                            .logOut(logOutStr)
                            .totalHours(hoursStr)
                            .employeeName(candidate.getName())
                            .clientCompany(candidate.getClient() != null ? candidate.getClient().getName() : "N/A")
                            .status("Present");
                } else {
                    rowBuilder
                            .logIn("-")
                            .logOut("-")
                            .totalHours("-")
                            .employeeName(candidate.getName())
                            .clientCompany(candidate.getClient() != null ? candidate.getClient().getName() : "N/A")
                            .status("Holiday");
                }
            }
            rows.add(rowBuilder.build());
        }

        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
        String monthLabel = start.format(labelFormatter);

        return MonthlyAttendanceDTO.builder()
                .companyName("Vergil Remnant Consultant Services Pvt Ltd")
                .monthLabel(monthLabel)
                .employeeName(candidate.getName())
                .clientCompany(candidate.getClient() != null ? candidate.getClient().getName() : "N/A")
                .rows(rows)
                .build();
    }

    @Override
    public void generateMonthlyAttendancePdf(OutputStream outputStream, MonthlyAttendanceDTO data) {
        Document document = new Document(PageSize.A4, 30, 30, 30, 30);
        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // Fonts
            Font mainTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(0x11, 0x11, 0x11));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(0x77, 0x77, 0x77));
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(0xFF, 0x7A, 0x00));
            
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(0x11, 0x11, 0x11));
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0x33, 0x33, 0x33));
            
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
            Font tableRowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(0x33, 0x33, 0x33));
            Font tableRowWeekendFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(0x77, 0x77, 0x77));
            Font presentStatusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(0x1B, 0x5E, 0x20));
            Font holidayStatusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(0xB7, 0x1C, 0x1C));

            // Top Header Table (contains title/subtitle on left, logo on right)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{70f, 30f});
            headerTable.setSpacingAfter(15);

            // Left Cell (Text)
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            Paragraph companyTitle = new Paragraph(data.getCompanyName(), mainTitleFont);
            companyTitle.setSpacingAfter(2);
            leftCell.addElement(companyTitle);

            Paragraph appTitle = new Paragraph("Vergil Tempo Workforce Time Management System", subtitleFont);
            leftCell.addElement(appTitle);
            headerTable.addCell(leftCell);

            // Right Cell (Logo)
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            try {
                org.springframework.core.io.ClassPathResource resource = 
                        new org.springframework.core.io.ClassPathResource("assets/logo/vergilremnant.png");
                if (resource.exists()) {
                    try (java.io.InputStream is = resource.getInputStream()) {
                        byte[] imageBytes = is.readAllBytes();
                        Image logo = Image.getInstance(imageBytes);
                        logo.scaleToFit(140f, 140f); // Width: 140px, Height: Auto
                        logo.setAlignment(Element.ALIGN_RIGHT);
                        rightCell.addElement(logo);
                    }
                } else {
                    System.out.println("Warning: vergilremnant.png logo not found in classpath resources");
                }
            } catch (Exception e) {
                System.err.println("Warning: Failed to load company logo: " + e.getMessage());
            }
            headerTable.addCell(rightCell);

            document.add(headerTable);

            // Report Metadata Panel
            Paragraph reportTitle = new Paragraph("MONTHLY EMPLOYEE ATTENDANCE REPORT", sectionTitleFont);
            reportTitle.setSpacingAfter(10);
            document.add(reportTitle);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(15);
            metaTable.setWidths(new float[]{50f, 50f});

            addMetaCell(metaTable, "Month/Year:", data.getMonthLabel(), labelFont, valueFont);
            addMetaCell(metaTable, "Employee Name:", data.getEmployeeName(), labelFont, valueFont);
            addMetaCell(metaTable, "Client Company:", data.getClientCompany(), labelFont, valueFont);
            addMetaCell(metaTable, "Generated Date:", LocalDate.now().toString(), labelFont, valueFont);

            document.add(metaTable);

            // Attendance Table
            // Columns: Date, Day, Log In, Log Out, Total Hours, Employee Name, Client Company, Status
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{11f, 11f, 9f, 9f, 9f, 21f, 19f, 11f});
            table.setSpacingAfter(10);

            // Table Headers
            String[] headers = {"Date", "Day", "Log In", "Log Out", "Total Hours", "Employee Name", "Client Company", "Status"};
            Color headerBg = new Color(0x11, 0x11, 0x11);

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, tableHeaderFont));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(6);
                cell.setBorderColor(new Color(0x44, 0x44, 0x44));
                table.addCell(cell);
            }

            // Table Rows
            Color weekendBg = new Color(0xF5, 0xF5, 0xF5);
            Color gridBorderColor = new Color(0xDD, 0xDD, 0xDD);

            for (AttendanceRowDTO row : data.getRows()) {
                boolean isWeekend = row.getStatus() == null || row.getStatus().trim().isEmpty();
                Font currentFont = isWeekend ? tableRowWeekendFont : tableRowFont;
                Color currentBg = isWeekend ? weekendBg : Color.WHITE;

                table.addCell(createTableCell(row.getDate(), currentFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getDay(), currentFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getLogIn(), currentFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getLogOut(), currentFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getTotalHours(), currentFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getEmployeeName(), currentFont, Element.ALIGN_LEFT, currentBg, gridBorderColor));
                table.addCell(createTableCell(row.getClientCompany(), currentFont, Element.ALIGN_LEFT, currentBg, gridBorderColor));

                Font statusFont = currentFont;
                if ("Present".equalsIgnoreCase(row.getStatus())) {
                    statusFont = presentStatusFont;
                } else if ("Holiday".equalsIgnoreCase(row.getStatus())) {
                    statusFont = holidayStatusFont;
                }
                table.addCell(createTableCell(row.getStatus(), statusFont, Element.ALIGN_CENTER, currentBg, gridBorderColor));
            }

            document.add(table);

        } catch (DocumentException e) {
            throw new RuntimeException("Error writing PDF document", e);
        } finally {
            document.close();
        }
    }

    private void addMetaCell(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        Phrase p = new Phrase();
        p.add(new Chunk(label + " ", labelFont));
        p.add(new Chunk(value != null ? value : "N/A", valFont));
        cell.addElement(p);
        cell.setPadding(3);
        table.addCell(cell);
    }

    private PdfPCell createTableCell(String text, Font font, int alignment, Color bg, Color border) {
        PdfPCell cell = new PdfPCell(new Paragraph(text != null ? text : "", font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBackgroundColor(bg);
        cell.setPadding(5);
        cell.setBorderColor(border);
        return cell;
    }
}
