package com.vergiltempo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vergiltempo.dto.*;
import com.vergiltempo.security.JwtAuthenticationFilter;
import com.vergiltempo.service.TimesheetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TimesheetController.class)
@AutoConfigureMockMvc(addFilters = false)
public class TimesheetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TimesheetService timesheetService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetActiveStatus() throws Exception {
        ActiveStatusResponse response = ActiveStatusResponse.builder()
                .hasActive(true)
                .log(ActiveStatusResponse.ActiveShiftDto.builder()
                        .id("ts-123")
                        .date(LocalDate.of(2026, 6, 12))
                        .clockIn(LocalTime.of(9, 0))
                        .location("HQ Boston")
                        .build())
                .build();

        Principal principal = () -> "john";

        when(timesheetService.getActiveStatus("john")).thenReturn(response);

        mockMvc.perform(get("/api/timesheets/active")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasActive").value(true))
                .andExpect(jsonPath("$.log.id").value("ts-123"))
                .andExpect(jsonPath("$.log.location").value("HQ Boston"));
    }

    @Test
    public void testClockIn() throws Exception {
        ClockInResponse response = ClockInResponse.builder()
                .message("Clocked in successfully")
                .log(TimesheetLogDto.builder()
                        .id("ts-123")
                        .userId("emp-123")
                        .date(LocalDate.of(2026, 6, 12))
                        .clockIn(LocalTime.of(9, 0))
                        .location("HQ Boston")
                        .clientCompany("Microsoft")
                        .build())
                .build();

        Principal principal = () -> "john";
        ClockInRequest request = new ClockInRequest("HQ Boston");

        when(timesheetService.clockIn(eq("john"), any(ClockInRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/timesheets/clock-in")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Clocked in successfully"))
                .andExpect(jsonPath("$.log.id").value("ts-123"));
    }

    @Test
    public void testClockInAlreadyClockedIn() throws Exception {
        Principal principal = () -> "john";
        ClockInRequest request = new ClockInRequest("HQ Boston");

        when(timesheetService.clockIn(eq("john"), any(ClockInRequest.class)))
                .thenThrow(new com.vergiltempo.exception.ActiveShiftExistsException("Active shift already exists"));

        mockMvc.perform(post("/api/timesheets/clock-in")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Active shift already exists"));
    }
}
