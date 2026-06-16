package com.vergiltempo.controller;

import com.vergiltempo.dto.*;
import com.vergiltempo.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/timesheets")
    public ResponseEntity<List<TimesheetLogDto>> getFilteredTimesheets(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(adminService.getFilteredTimesheets(userId, client, startDate, endDate));
    }

    @PostMapping("/timesheets")
    public ResponseEntity<TimesheetLogDto> createManualTimesheet(
            @Valid @RequestBody AdminTimesheetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createManualTimesheet(request));
    }

    @PutMapping("/timesheets/{id}")
    public ResponseEntity<TimesheetLogDto> updateTimesheet(
            @PathVariable String id,
            @Valid @RequestBody AdminTimesheetRequest request) {
        return ResponseEntity.ok(adminService.updateTimesheet(id, request));
    }

    @DeleteMapping("/timesheets/{id}")
    public ResponseEntity<Map<String, String>> deleteTimesheet(@PathVariable String id) {
        adminService.deleteTimesheet(id);
        return ResponseEntity.ok(Map.of("message", "Timesheet record permanently deleted"));
    }

    @PostMapping("/timesheets/bulk-delete")
    public ResponseEntity<Map<String, String>> bulkDeleteTimesheets(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.get("ids");
        adminService.bulkDeleteTimesheets(ids);
        return ResponseEntity.ok(Map.of("message", "Selected timesheet records permanently deleted"));
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createEmployee(
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createEmployee(request));
    }

    @GetMapping("/employees")
    public ResponseEntity<List<UserResponse>> getEmployees() {
        return ResponseEntity.ok(adminService.getEmployees());
    }
}
