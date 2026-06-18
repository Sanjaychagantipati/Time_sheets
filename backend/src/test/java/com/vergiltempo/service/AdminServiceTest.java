package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import com.vergiltempo.entity.*;
import com.vergiltempo.exception.*;
import com.vergiltempo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AdminServiceTest {

    private UserRepository userRepository;
    private ClientRepository clientRepository;
    private TimesheetRepository timesheetRepository;
    private PasswordEncoder passwordEncoder;
    private AdminService adminService;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        clientRepository = Mockito.mock(ClientRepository.class);
        timesheetRepository = Mockito.mock(TimesheetRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        adminService = new AdminServiceImpl(userRepository, clientRepository, timesheetRepository, passwordEncoder);
    }

    @Test
    public void testGetStats() {
        when(timesheetRepository.countByClockOutIsNull()).thenReturn(3L);
        when(userRepository.countByRole(Role.EMPLOYEE)).thenReturn(10L);
        when(clientRepository.countByActiveTrue()).thenReturn(5L);
        when(timesheetRepository.countDistinctUserByDateAndClockOutIsNotNull(LocalDate.now())).thenReturn(2L);

        AdminStatsResponse stats = adminService.getStats();

        assertNotNull(stats);
        assertEquals(3, stats.getCurrentlyClockedIn());
        assertEquals(3, stats.getActiveEmployees());
        assertEquals(10, stats.getTotalEmployees());
        assertEquals(5, stats.getActiveClients());
        assertEquals(5, stats.getTotalClients());
        assertEquals(2, stats.getTimesheetsSubmittedToday());
    }

    @Test
    public void testGetFilteredTimesheets() {
        User user = User.builder().id("emp-1").name("John").build();
        Client client = Client.builder().id(1).name("Microsoft").build();
        Timesheet t = Timesheet.builder()
                .id("ts-1")
                .user(user)
                .client(client)
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .hours(BigDecimal.valueOf(8.0))
                .build();

        when(timesheetRepository.findFilteredTimesheets(eq("emp-1"), eq("Microsoft"), any(), any()))
                .thenReturn(Collections.singletonList(t));

        List<TimesheetLogDto> result = adminService.getFilteredTimesheets("emp-1", "Microsoft", null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ts-1", result.get(0).getId());
        assertEquals("COMPLETED", result.get(0).getStatus());
    }

    @Test
    public void testCreateManualTimesheet() {
        User user = User.builder().id("emp-1").name("John").build();
        Client client = Client.builder().id(1).name("Microsoft").build();
        Timesheet t = Timesheet.builder()
                .id("ts-1")
                .user(user)
                .client(client)
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .hours(BigDecimal.valueOf(8.0))
                .build();

        when(userRepository.findById("emp-1")).thenReturn(Optional.of(user));
        when(clientRepository.findByName("Microsoft")).thenReturn(Optional.of(client));
        when(timesheetRepository.save(any(Timesheet.class))).thenReturn(t);

        AdminTimesheetRequest request = AdminTimesheetRequest.builder()
                .userId("emp-1")
                .clientCompany("Microsoft")
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .build();

        TimesheetLogDto saved = adminService.createManualTimesheet(request);

        assertNotNull(saved);
        assertEquals("ts-1", saved.getId());
        assertEquals(BigDecimal.valueOf(8.0), saved.getHours());
    }

    @Test
    public void testCreateEmployeeSuccess() {
        Client client = Client.builder().id(1).name("Microsoft").build();
        User employee = User.builder()
                .id("emp-1")
                .name("John")
                .username("john")
                .role(Role.EMPLOYEE)
                .client(client)
                .hourlyRate(BigDecimal.valueOf(35.0))
                .build();

        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(clientRepository.findByName("Microsoft")).thenReturn(Optional.of(client));
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(employee);

        CreateUserRequest request = CreateUserRequest.builder()
                .name("John")
                .username("john")
                .password("password")
                .role("employee")
                .clientCompany("Microsoft")
                .rate(BigDecimal.valueOf(35.0))
                .build();

        UserResponse response = adminService.createEmployee(request);

        assertNotNull(response);
        assertEquals("emp-1", response.getId());
        assertEquals("john", response.getUsername());
        assertEquals("employee", response.getRole());
    }

    @Test
    public void testCreateEmployeeUsernameTaken() {
        when(userRepository.existsByUsername("john")).thenReturn(true);

        CreateUserRequest request = CreateUserRequest.builder()
                .username("john")
                .build();

        assertThrows(UsernameAlreadyExistsException.class, () -> adminService.createEmployee(request));
    }

    @Test
    public void testBulkDeleteTimesheets() {
        List<String> ids = List.of("ts-1", "ts-2");
        doNothing().when(timesheetRepository).deleteAllById(ids);

        adminService.bulkDeleteTimesheets(ids);

        verify(timesheetRepository, times(1)).deleteAllById(ids);
    }
}
