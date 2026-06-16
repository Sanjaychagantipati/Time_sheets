package com.vergiltempo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vergiltempo.dto.*;
import com.vergiltempo.security.JwtAuthenticationFilter;
import com.vergiltempo.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetStats() throws Exception {
        AdminStatsResponse stats = AdminStatsResponse.builder()
                .currentlyClockedIn(3)
                .activeEmployees(3)
                .totalEmployees(10)
                .activeClients(5)
                .totalClients(5)
                .todaysHours(BigDecimal.valueOf(15.5))
                .build();

        when(adminService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentlyClockedIn").value(3))
                .andExpect(jsonPath("$.totalEmployees").value(10))
                .andExpect(jsonPath("$.todaysHours").value(15.5));
    }

    @Test
    public void testGetFilteredTimesheets() throws Exception {
        TimesheetLogDto dto = TimesheetLogDto.builder()
                .id("ts-123")
                .userId("emp-1")
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .hours(BigDecimal.valueOf(8.0))
                .clientCompany("Microsoft")
                .status("COMPLETED")
                .build();

        when(adminService.getFilteredTimesheets("emp-1", "Microsoft", "2026-06-12", "2026-06-12"))
                .thenReturn(Collections.singletonList(dto));

        mockMvc.perform(get("/api/admin/timesheets")
                .param("userId", "emp-1")
                .param("client", "Microsoft")
                .param("startDate", "2026-06-12")
                .param("endDate", "2026-06-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("ts-123"))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
    }

    @Test
    public void testCreateManualTimesheet() throws Exception {
        TimesheetLogDto dto = TimesheetLogDto.builder()
                .id("ts-123")
                .build();

        AdminTimesheetRequest request = AdminTimesheetRequest.builder()
                .userId("emp-1")
                .clientCompany("Microsoft")
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .build();

        when(adminService.createManualTimesheet(any(AdminTimesheetRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/admin/timesheets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("ts-123"));
    }

    @Test
    public void testUpdateTimesheet() throws Exception {
        TimesheetLogDto dto = TimesheetLogDto.builder()
                .id("ts-123")
                .build();

        AdminTimesheetRequest request = AdminTimesheetRequest.builder()
                .clientCompany("Microsoft")
                .date(LocalDate.of(2026, 6, 12))
                .clockIn(LocalTime.of(9, 0))
                .clockOut(LocalTime.of(17, 0))
                .build();

        when(adminService.updateTimesheet(eq("ts-123"), any(AdminTimesheetRequest.class))).thenReturn(dto);

        mockMvc.perform(put("/api/admin/timesheets/ts-123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ts-123"));
    }

    @Test
    public void testDeleteTimesheet() throws Exception {
        doNothing().when(adminService).deleteTimesheet("ts-123");

        mockMvc.perform(delete("/api/admin/timesheets/ts-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Timesheet record permanently deleted"));
    }

    @Test
    public void testBulkDeleteTimesheets() throws Exception {
        java.util.List<String> ids = java.util.List.of("ts-1", "ts-2");
        doNothing().when(adminService).bulkDeleteTimesheets(ids);

        java.util.Map<String, java.util.List<String>> requestBody = java.util.Map.of("ids", ids);

        mockMvc.perform(post("/api/admin/timesheets/bulk-delete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Selected timesheet records permanently deleted"));
    }

    @Test
    public void testCreateEmployee() throws Exception {
        UserResponse response = UserResponse.builder()
                .id("emp-123")
                .username("john")
                .build();

        CreateUserRequest request = CreateUserRequest.builder()
                .name("John")
                .username("john")
                .password("password")
                .role("employee")
                .clientCompany("Microsoft")
                .rate(BigDecimal.valueOf(35.0))
                .build();

        when(adminService.createEmployee(any(CreateUserRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("emp-123"))
                .andExpect(jsonPath("$.username").value("john"));
    }
}
