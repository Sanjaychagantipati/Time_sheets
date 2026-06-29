package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.TimesheetRepository;
import com.vergiltempo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimesheetServiceImpl implements TimesheetService {

    private final UserRepository userRepository;
    private final TimesheetRepository timesheetRepository;
    private final HttpServletRequest httpServletRequest;

    public TimesheetServiceImpl(UserRepository userRepository,
                                TimesheetRepository timesheetRepository,
                                HttpServletRequest httpServletRequest) {
        this.userRepository = userRepository;
        this.timesheetRepository = timesheetRepository;
        this.httpServletRequest = httpServletRequest;
    }

    @Override
    @Transactional(readOnly = true)
    public ActiveStatusResponse getActiveStatus(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        return timesheetRepository.findByUserAndClockOutIsNull(user)
                .map(t -> ActiveStatusResponse.builder()
                        .hasActive(true)
                        .log(ActiveStatusResponse.ActiveShiftDto.builder()
                                .id(t.getId())
                                .date(t.getDate())
                                .clockIn(t.getClockIn())
                                .build())
                        .build())
                .orElseGet(() -> ActiveStatusResponse.builder()
                        .hasActive(false)
                        .log(null)
                        .build());
    }

    @Override
    public ClockInResponse clockIn(String username, ClockInRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Validation: One active timesheet rule
        boolean hasActive = timesheetRepository.findByUserAndClockOutIsNull(user).isPresent();
        if (hasActive) {
            throw new com.vergiltempo.exception.ActiveShiftExistsException("Active shift already exists");
        }

        if (user.getClient() == null) {
            throw new IllegalStateException("User is not assigned to any client company");
        }

        // Validation: Future timestamps
        if (request.getClientElapsedMs() != null && request.getClientElapsedMs() < 0) {
            throw new IllegalArgumentException("Future timestamps are not allowed");
        }

        // Time synchronization: reconstruct event date and time using server time minus client-elapsed ms
        LocalDate eventDate = LocalDate.now();
        LocalTime eventClockIn = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);
        if (request.getClientElapsedMs() != null) {
            LocalDateTime eventLdt = LocalDateTime.now().minus(request.getClientElapsedMs(), ChronoUnit.MILLIS);
            eventDate = eventLdt.toLocalDate();
            eventClockIn = eventLdt.toLocalTime().truncatedTo(ChronoUnit.SECONDS);
        }


        Timesheet timesheet = Timesheet.builder()
                .user(user)
                .client(user.getClient())
                .date(eventDate)
                .clockIn(eventClockIn)
                .browser(request.getBrowser())
                .operatingSystem(request.getOperatingSystem())
                .deviceType(request.getDeviceType())
                .screenResolution(request.getScreenResolution())
                .ipAddress(getClientIp())
                .userAgent(getUserAgent())
                .build();

        Timesheet saved = timesheetRepository.save(timesheet);

        return ClockInResponse.builder()
                .message("Clocked in successfully")
                .log(mapToTimesheetLogDto(saved))
                .build();
    }

    @Override
    public ClockOutResponse clockOut(String username, ClockOutRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Validation: Clock Out without Clock In -> Reject
        Timesheet timesheet = timesheetRepository.findByUserAndClockOutIsNull(user)
                .orElseThrow(() -> new com.vergiltempo.exception.NoActiveShiftException("No active shift found"));

        // Validation: Future timestamps
        if (request.getClientElapsedMs() != null && request.getClientElapsedMs() < 0) {
            throw new IllegalArgumentException("Future timestamps are not allowed");
        }

        // Reconstruct event date and time using server time minus client-elapsed ms
        LocalDate eventDate = LocalDate.now();
        LocalTime clockOutTime = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);
        if (request.getClientElapsedMs() != null) {
            LocalDateTime eventLdt = LocalDateTime.now().minus(request.getClientElapsedMs(), ChronoUnit.MILLIS);
            eventDate = eventLdt.toLocalDate();
            clockOutTime = eventLdt.toLocalTime().truncatedTo(ChronoUnit.SECONDS);
        }

        // Validation: Negative working hours -> Reject
        LocalDateTime startLdt = LocalDateTime.of(timesheet.getDate(), timesheet.getClockIn());
        LocalDateTime endLdt = LocalDateTime.of(eventDate, clockOutTime);

        long minutes = ChronoUnit.MINUTES.between(startLdt, endLdt);
        if (minutes < 0) {
            throw new IllegalArgumentException("Working hours cannot be negative");
        }

        BigDecimal decimalHours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        timesheet.setClockOut(clockOutTime);
        timesheet.setHours(decimalHours);
        timesheet.setNotes(request.getNotes());

        // Update audit fields on Clock Out
        if (request.getBrowser() != null) timesheet.setBrowser(request.getBrowser());
        if (request.getOperatingSystem() != null) timesheet.setOperatingSystem(request.getOperatingSystem());
        if (request.getDeviceType() != null) timesheet.setDeviceType(request.getDeviceType());
        if (request.getScreenResolution() != null) timesheet.setScreenResolution(request.getScreenResolution());
        timesheet.setIpAddress(getClientIp());
        timesheet.setUserAgent(getUserAgent());

        Timesheet saved = timesheetRepository.save(timesheet);

        System.out.println("Clock Out Success");
        System.out.println("Candidate ID: " + user.getId());
        long submittedCount = timesheetRepository.countDistinctUserByDateAndClockOutIsNotNull(LocalDate.now());
        System.out.println("Today's Submitted Count: " + submittedCount);

        return ClockOutResponse.builder()
                .message("Clocked out successfully")
                .log(ClockOutResponse.ClockOutLogDto.builder()
                        .id(saved.getId())
                        .clockOut(saved.getClockOut())
                        .hours(saved.getHours())
                        .notes(saved.getNotes())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimesheetLogDto> getMyLogs(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        List<Timesheet> logs = timesheetRepository.findByUserOrderByDateDesc(user);
        return logs.stream()
                .map(this::mapToTimesheetLogDto)
                .collect(Collectors.toList());
    }

    private String getClientIp() {
        String ipAddress = httpServletRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = httpServletRequest.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = httpServletRequest.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = httpServletRequest.getRemoteAddr();
        }
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress;
    }

    private String getUserAgent() {
        return httpServletRequest.getHeader("User-Agent");
    }

    private TimesheetLogDto mapToTimesheetLogDto(Timesheet t) {
        return TimesheetLogDto.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .date(t.getDate())
                .clockIn(t.getClockIn())
                .clockOut(t.getClockOut())
                .hours(t.getHours())
                .notes(t.getNotes())
                .clientCompany(t.getClient().getName())
                .status(t.getClockOut() == null ? "ACTIVE" : "COMPLETED")
                .browser(t.getBrowser())
                .operatingSystem(t.getOperatingSystem())
                .deviceType(t.getDeviceType())
                .screenResolution(t.getScreenResolution())
                .ipAddress(t.getIpAddress())
                .userAgent(t.getUserAgent())
                .build();
    }
}

