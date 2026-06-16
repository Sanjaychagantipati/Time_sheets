package com.vergiltempo.controller;

import com.vergiltempo.dto.*;
import com.vergiltempo.service.TimesheetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
public class TimesheetController {

    private final TimesheetService timesheetService;

    public TimesheetController(TimesheetService timesheetService) {
        this.timesheetService = timesheetService;
    }

    @GetMapping("/active")
    public ResponseEntity<ActiveStatusResponse> getActiveStatus(Principal principal) {
        ActiveStatusResponse response = timesheetService.getActiveStatus(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clock-in")
    public ResponseEntity<ClockInResponse> clockIn(Principal principal, @Valid @RequestBody ClockInRequest request) {
        ClockInResponse response = timesheetService.clockIn(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/clock-out")
    public ResponseEntity<ClockOutResponse> clockOut(Principal principal, @RequestBody ClockOutRequest request) {
        ClockOutResponse response = timesheetService.clockOut(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-logs")
    public ResponseEntity<List<TimesheetLogDto>> getMyLogs(Principal principal) {
        List<TimesheetLogDto> response = timesheetService.getMyLogs(principal.getName());
        return ResponseEntity.ok(response);
    }
}
