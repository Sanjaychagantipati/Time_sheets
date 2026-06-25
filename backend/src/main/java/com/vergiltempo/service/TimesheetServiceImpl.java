package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.TimesheetRepository;
import com.vergiltempo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimesheetServiceImpl implements TimesheetService {

    private final UserRepository userRepository;
    private final TimesheetRepository timesheetRepository;

    public TimesheetServiceImpl(UserRepository userRepository, TimesheetRepository timesheetRepository) {
        this.userRepository = userRepository;
        this.timesheetRepository = timesheetRepository;
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
                                .location(t.getLocation())
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

        boolean hasActive = timesheetRepository.findByUserAndClockOutIsNull(user).isPresent();
        if (hasActive) {
            throw new com.vergiltempo.exception.ActiveShiftExistsException("Active shift already exists");
        }

        if (user.getClient() == null) {
            throw new IllegalStateException("User is not assigned to any client company");
        }

        java.util.Optional<Timesheet> existingOpt = timesheetRepository.findByUserAndDate(user, LocalDate.now());
        Timesheet timesheet;
        if (existingOpt.isPresent()) {
            timesheet = existingOpt.get();
            timesheet.setClockIn(LocalTime.now().truncatedTo(ChronoUnit.SECONDS));
            timesheet.setClockOut(null);
            timesheet.setLocation(request.getLocation());
        } else {
            timesheet = Timesheet.builder()
                    .user(user)
                    .client(user.getClient())
                    .date(LocalDate.now())
                    .clockIn(LocalTime.now().truncatedTo(ChronoUnit.SECONDS))
                    .location(request.getLocation())
                    .build();
        }

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

        Timesheet timesheet = timesheetRepository.findByUserAndClockOutIsNull(user)
                .orElseThrow(() -> new com.vergiltempo.exception.NoActiveShiftException("No active shift found"));


        LocalTime clockOutTime = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);
        timesheet.setClockOut(clockOutTime);

        long minutes = ChronoUnit.MINUTES.between(timesheet.getClockIn(), clockOutTime);
        if (minutes < 0) {
            minutes += 24 * 60;
        }
        BigDecimal decimalHours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        if (decimalHours.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Working hours cannot be negative");
        }

        BigDecimal currentHours = timesheet.getHours() != null ? timesheet.getHours() : BigDecimal.ZERO;
        timesheet.setHours(currentHours.add(decimalHours));
        timesheet.setNotes(request.getNotes());

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

    private TimesheetLogDto mapToTimesheetLogDto(Timesheet t) {
        return TimesheetLogDto.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .date(t.getDate())
                .clockIn(t.getClockIn())
                .clockOut(t.getClockOut())
                .hours(t.getHours())
                .location(t.getLocation())
                .notes(t.getNotes())
                .clientCompany(t.getClient().getName())
                .status(t.getClockOut() == null ? "ACTIVE" : "COMPLETED")
                .build();
    }
}

