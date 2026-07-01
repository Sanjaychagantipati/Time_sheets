package com.vergiltempo.controller;

import com.vergiltempo.dto.HolidayDTO;
import com.vergiltempo.service.HolidayService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping("/api/holidays")
    public ResponseEntity<List<HolidayDTO>> getActiveHolidays() {
        return ResponseEntity.ok(holidayService.getActiveHolidays());
    }

    @GetMapping("/api/admin/holidays")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HolidayDTO>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    @PostMapping("/api/admin/holidays")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HolidayDTO> createHoliday(@Valid @RequestBody HolidayDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holidayService.createHoliday(request));
    }

    @PutMapping("/api/admin/holidays/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HolidayDTO> updateHoliday(
            @PathVariable String id,
            @Valid @RequestBody HolidayDTO request) {
        return ResponseEntity.ok(holidayService.updateHoliday(id, request));
    }

    @DeleteMapping("/api/admin/holidays/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteHoliday(@PathVariable String id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.ok(Map.of("message", "Holiday deleted successfully"));
    }
}
