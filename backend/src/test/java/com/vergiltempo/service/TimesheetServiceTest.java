package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import com.vergiltempo.entity.AttendanceSession;
import com.vergiltempo.entity.Client;
import com.vergiltempo.entity.Role;
import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.TimesheetRepository;
import com.vergiltempo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class TimesheetServiceTest {

    private UserRepository userRepository;
    private TimesheetRepository timesheetRepository;
    private HttpServletRequest httpServletRequest;
    private TimesheetService timesheetService;

    private User employee;
    private Client client;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        timesheetRepository = Mockito.mock(TimesheetRepository.class);
        httpServletRequest = Mockito.mock(HttpServletRequest.class);
        timesheetService = new TimesheetServiceImpl(userRepository, timesheetRepository, httpServletRequest);

        client = Client.builder().id(1).name("Microsoft").code("MSFT").active(true).build();
        employee = User.builder()
                .id("emp-123")
                .name("John Doe")
                .username("john")
                .role(Role.EMPLOYEE)
                .client(client)
                .build();
    }

    @Test
    public void testGetActiveStatusNoShift() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.empty());

        ActiveStatusResponse response = timesheetService.getActiveStatus("john");
        assertNotNull(response);
        assertFalse(response.isHasActive());
        assertNull(response.getLog());
    }

    @Test
    public void testGetActiveStatusWithShift() {
        Timesheet active = Timesheet.builder()
                .id("ts-123")
                .user(employee)
                .client(client)
                .date(LocalDate.now())
                .clockIn(LocalTime.of(9, 0))
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.of(active));

        ActiveStatusResponse response = timesheetService.getActiveStatus("john");
        assertNotNull(response);
        assertTrue(response.isHasActive());
        assertNotNull(response.getLog());
        assertEquals("ts-123", response.getLog().getId());
    }

    @Test
    public void testClockInSuccess() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.empty());
        when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(invocation -> {
            Timesheet ts = invocation.getArgument(0);
            ts.setId("ts-new");
            return ts;
        });

        ClockInRequest request = new ClockInRequest();
        ClockInResponse response = timesheetService.clockIn("john", request);

        assertNotNull(response);
        assertEquals("Clocked in successfully", response.getMessage());
        assertNotNull(response.getLog());
        assertEquals("ts-new", response.getLog().getId());
    }

    @Test
    public void testClockInAlreadyClockedIn() {
        Timesheet active = Timesheet.builder().id("ts-123").build();
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.of(active));

        ClockInRequest request = new ClockInRequest();
        assertThrows(com.vergiltempo.exception.ActiveShiftExistsException.class, () -> timesheetService.clockIn("john", request));
    }

    @Test
    public void testClockOutSuccess() {
        Timesheet active = Timesheet.builder()
                .id("ts-123")
                .user(employee)
                .client(client)
                .date(LocalDate.now())
                .clockIn(LocalTime.now().minusHours(8).truncatedTo(java.time.temporal.ChronoUnit.SECONDS))
                .build();
        AttendanceSession session = AttendanceSession.builder()
                .timesheet(active)
                .clockIn(active.getClockIn())
                .clockOut(null)
                .build();
        active.getSessions().add(session);

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.of(active));
        when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClockOutRequest request = ClockOutRequest.builder().notes("Worked on layouts").build();
        ClockOutResponse response = timesheetService.clockOut("john", request);

        assertNotNull(response);
        assertEquals("Clocked out successfully", response.getMessage());
        assertNotNull(response.getLog());
        assertEquals("ts-123", response.getLog().getId());
        assertEquals("Worked on layouts", response.getLog().getNotes());
        assertNotNull(response.getLog().getHours());
        assertTrue(response.getLog().getHours().compareTo(BigDecimal.valueOf(8.0)) >= 0);
    }

    @Test
    public void testClockOutNoActiveShift() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.empty());

        ClockOutRequest request = ClockOutRequest.builder().notes("Worked on layouts").build();
        assertThrows(com.vergiltempo.exception.NoActiveShiftException.class, () -> timesheetService.clockOut("john", request));
    }

    @Test
    public void testGetMyLogs() {
        Timesheet t = Timesheet.builder()
                .id("ts-123")
                .user(employee)
                .client(client)
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .hours(BigDecimal.valueOf(8.0))
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserOrderByDateDesc(employee)).thenReturn(Collections.singletonList(t));

        List<TimesheetLogDto> logs = timesheetService.getMyLogs("john");

        assertNotNull(logs);
        assertEquals(1, logs.size());
        assertEquals("ts-123", logs.get(0).getId());
        assertEquals("COMPLETED", logs.get(0).getStatus());
    }

    @Test
    public void testClockInMultipleTimesOnSameDayAllowed() {
        // Set up a completed timesheet for today
        Timesheet completedToday = Timesheet.builder()
                .id("ts-completed-today")
                .user(employee)
                .client(client)
                .date(LocalDate.now())
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(12, 0))
                .hours(BigDecimal.valueOf(3.0))
                .build();
        AttendanceSession session = AttendanceSession.builder()
                .timesheet(completedToday)
                .clockIn(completedToday.getClockIn())
                .clockOut(completedToday.getClockOut())
                .hours(completedToday.getHours())
                .build();
        completedToday.getSessions().add(session);

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(employee));
        when(timesheetRepository.findByUserAndClockOutIsNull(employee)).thenReturn(Optional.empty());
        when(timesheetRepository.findByUserAndDate(employee, LocalDate.now())).thenReturn(Optional.of(completedToday));

        when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClockInRequest request = new ClockInRequest();
        ClockInResponse response = timesheetService.clockIn("john", request);

        assertNotNull(response);
        assertEquals("Clocked in successfully", response.getMessage());
        assertEquals("ts-completed-today", response.getLog().getId());
        // Verify that a new active session was added
        assertEquals(2, completedToday.getSessions().size());
        assertNull(completedToday.getSessions().get(1).getClockOut());
    }
}


