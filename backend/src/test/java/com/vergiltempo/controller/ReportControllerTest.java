package com.vergiltempo.controller;

import com.vergiltempo.security.JwtAuthenticationFilter;
import com.vergiltempo.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.io.Writer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    public void testExportMasterCsv() throws Exception {
        doAnswer(invocation -> {
            Writer writer = invocation.getArgument(0);
            writer.write("header1,header2\nvalue1,value2\n");
            return null;
        }).when(reportService).writeMasterCsv(any(Writer.class), any(), any(), any(), any());

        mockMvc.perform(get("/api/reports/export-master"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Vergil_Tempo_Timesheets_")))
                .andExpect(content().string("header1,header2\nvalue1,value2\n"));
    }

    @Test
    public void testExportMonthlyCsv() throws Exception {
        doAnswer(invocation -> {
            Writer writer = invocation.getArgument(0);
            writer.write("monthlyHeader\nmonthlyValue\n");
            return null;
        }).when(reportService).writeMonthlyCsv(any(Writer.class), eq("emp-123"), eq("2026-06"));

        mockMvc.perform(get("/api/reports/export-monthly")
                .param("userId", "emp-123")
                .param("month", "2026-06"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Vergil_Tempo_Billing_emp-123_2026-06.csv")))
                .andExpect(content().string("monthlyHeader\nmonthlyValue\n"));
    }
}
