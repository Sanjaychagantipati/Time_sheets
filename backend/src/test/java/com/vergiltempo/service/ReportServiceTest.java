package com.vergiltempo.service;

import com.vergiltempo.dto.AttendanceRowDTO;
import com.vergiltempo.dto.MonthlyAttendanceDTO;
import com.vergiltempo.entity.Client;
import com.vergiltempo.entity.Role;
import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.TimesheetRepository;
import com.vergiltempo.repository.UserRepository;
import com.vergiltempo.repository.HolidayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class ReportServiceTest {

    private TimesheetRepository timesheetRepository;
    private UserRepository userRepository;
    private HolidayRepository holidayRepository;
    private ReportService reportService;

    private User employee;
    private Client client;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        timesheetRepository = Mockito.mock(TimesheetRepository.class);
        holidayRepository = Mockito.mock(HolidayRepository.class);
        reportService = new ReportServiceImpl(timesheetRepository, userRepository, holidayRepository);

        client = Client.builder().id(1).name("Microsoft").code("MSFT").active(true).build();
        employee = User.builder()
                .id("emp-123")
                .name("Sanjay")
                .username("sanjay")
                .role(Role.EMPLOYEE)
                .client(client)
                .hourlyRate(BigDecimal.valueOf(50.00))
                .build();
    }

    @Test
    public void testGetMonthlyAttendanceDataMultiSession() {
        LocalDate testDate = LocalDate.of(2026, 6, 26);
        
        // Session 1: 09:00 to 11:30 (2.5h)
        Timesheet ts1 = Timesheet.builder()
                .id("ts-1")
                .user(employee)
                .client(client)
                .date(testDate)
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(11, 30))
                .hours(BigDecimal.valueOf(2.50))
                .build();
        
        // Session 2: 12:15 to 15:00 (2.75h)
        Timesheet ts2 = Timesheet.builder()
                .id("ts-2")
                .user(employee)
                .client(client)
                .date(testDate)
                .clockIn(LocalTime.of(12, 15))
                .clockOut(LocalTime.of(15, 0))
                .hours(BigDecimal.valueOf(2.75))
                .build();
                
        // Session 3: 15:30 to null (Active - ignore for totals and logout)
        Timesheet ts3 = Timesheet.builder()
                .id("ts-3")
                .user(employee)
                .client(client)
                .date(testDate)
                .clockIn(LocalTime.of(15, 30))
                .clockOut(null)
                .hours(null)
                .build();

        List<Timesheet> logs = Arrays.asList(ts1, ts2, ts3);

        when(userRepository.findById("emp-123")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserIdAndDateBetweenOrderByDateAsc(
                "emp-123", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)))
                .thenReturn(logs);

        MonthlyAttendanceDTO result = reportService.getMonthlyAttendanceData("emp-123", 6, 2026);

        assertNotNull(result);
        assertEquals("Sanjay", result.getEmployeeName());
        assertEquals("Microsoft", result.getClientCompany());

        // Find the row for 26-06-2026
        AttendanceRowDTO targetRow = result.getRows().stream()
                .filter(row -> "26-06-2026".equals(row.getDate()))
                .findFirst()
                .orElse(null);

        assertNotNull(targetRow);
        assertEquals("Friday", targetRow.getDay());
        assertEquals("09:00", targetRow.getLogIn());
        assertEquals("15:00", targetRow.getLogOut()); // Latest completed session clock-out
        assertEquals("5.25", targetRow.getTotalHours()); // 2.50 + 2.75
        assertEquals("Present", targetRow.getStatus());
    }
}
