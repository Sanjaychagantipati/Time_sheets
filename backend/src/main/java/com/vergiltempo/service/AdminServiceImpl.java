package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import com.vergiltempo.entity.*;
import com.vergiltempo.repository.*;
import com.vergiltempo.exception.*;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final TimesheetRepository timesheetRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(UserRepository userRepository,
                            ClientRepository clientRepository,
                            TimesheetRepository timesheetRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.timesheetRepository = timesheetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long currentlyClockedIn = timesheetRepository.countByClockOutIsNull();
        long totalEmployees = userRepository.countByRole(Role.EMPLOYEE);
        long activeClients = clientRepository.countByActiveTrue();
        long submittedToday = timesheetRepository.countDistinctUserByDateAndClockOutIsNotNull(LocalDate.now());

        return AdminStatsResponse.builder()
                .currentlyClockedIn(currentlyClockedIn)
                .activeEmployees(currentlyClockedIn)
                .totalEmployees(totalEmployees)
                .activeClients(activeClients)
                .totalClients(activeClients)
                .timesheetsSubmittedToday(submittedToday)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimesheetLogDto> getFilteredTimesheets(String userId, String client, String startDate, String endDate) {
        String queryUserId = (userId == null || userId.trim().isEmpty() || "all".equalsIgnoreCase(userId)) ? null : userId;
        String queryClient = (client == null || client.trim().isEmpty() || "all".equalsIgnoreCase(client)) ? null : client;
        LocalDate queryStartDate = (startDate == null || startDate.trim().isEmpty()) ? null : LocalDate.parse(startDate);
        LocalDate queryEndDate = (endDate == null || endDate.trim().isEmpty()) ? null : LocalDate.parse(endDate);

        List<Timesheet> timesheets = timesheetRepository.findFilteredTimesheets(
                queryUserId, queryClient, queryStartDate, queryEndDate);

        return timesheets.stream()
                .map(this::mapToTimesheetLogDto)
                .collect(Collectors.toList());
    }

    @Override
    public TimesheetLogDto createManualTimesheet(AdminTimesheetRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));

        Client client = getOrCreateClient(request.getClientCompany());

        BigDecimal hours = calculateHours(request.getClockIn(), request.getClockOut());

        java.util.Optional<Timesheet> existingOpt = timesheetRepository.findByUserAndDate(user, request.getDate());
        Timesheet timesheet;
        if (existingOpt.isPresent()) {
            timesheet = existingOpt.get();
            BigDecimal currentHours = timesheet.getHours() != null ? timesheet.getHours() : BigDecimal.ZERO;
            timesheet.setHours(currentHours.add(hours != null ? hours : BigDecimal.ZERO));
            timesheet.setClockIn(request.getClockIn().truncatedTo(ChronoUnit.SECONDS));
            timesheet.setClockOut(request.getClockOut() != null ? request.getClockOut().truncatedTo(ChronoUnit.SECONDS) : null);
            timesheet.setNotes(request.getNotes());
            timesheet.setLocation(request.getLocation() != null ? request.getLocation() : "Office (Manual)");
            timesheet.setClient(client);
        } else {
            timesheet = Timesheet.builder()
                    .user(user)
                    .client(client)
                    .date(request.getDate())
                    .clockIn(request.getClockIn().truncatedTo(ChronoUnit.SECONDS))
                    .clockOut(request.getClockOut() != null ? request.getClockOut().truncatedTo(ChronoUnit.SECONDS) : null)
                    .hours(hours)
                    .notes(request.getNotes())
                    .location(request.getLocation() != null ? request.getLocation() : "Office (Manual)")
                    .build();
        }

        Timesheet saved = timesheetRepository.save(timesheet);
        return mapToTimesheetLogDto(saved);
    }

    @Override
    public TimesheetLogDto updateTimesheet(String logId, AdminTimesheetRequest request) {
        Timesheet timesheet = timesheetRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet entry not found: " + logId));

        Client client = getOrCreateClient(request.getClientCompany());

        BigDecimal hours = calculateHours(request.getClockIn(), request.getClockOut());

        timesheet.setDate(request.getDate());
        timesheet.setClockIn(request.getClockIn().truncatedTo(ChronoUnit.SECONDS));
        timesheet.setClockOut(request.getClockOut() != null ? request.getClockOut().truncatedTo(ChronoUnit.SECONDS) : null);
        timesheet.setHours(hours);
        timesheet.setNotes(request.getNotes());
        timesheet.setLocation(request.getLocation());
        timesheet.setClient(client);

        Timesheet saved = timesheetRepository.save(timesheet);
        return mapToTimesheetLogDto(saved);
    }

    @Override
    public void deleteTimesheet(String logId) {
        if (!timesheetRepository.existsById(logId)) {
            throw new ResourceNotFoundException("Timesheet entry not found: " + logId);
        }
        timesheetRepository.deleteById(logId);
    }

    @Override
    public void bulkDeleteTimesheets(List<String> logIds) {
        if (logIds == null || logIds.isEmpty()) {
            return;
        }
        timesheetRepository.deleteAllById(logIds);
    }

    @Override
    public UserResponse createEmployee(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException("Username already taken");
        }

        Client client = null;
        if (request.getClientCompany() != null && !request.getClientCompany().trim().isEmpty()) {
            client = getOrCreateClient(request.getClientCompany());
        }

        Role role = Role.EMPLOYEE;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            // default to EMPLOYEE
        }

        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .client(client)
                .hourlyRate(request.getRate() != null ? request.getRate() : BigDecimal.ZERO)
                .build();

        User saved = userRepository.save(user);
        return mapToUserResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getEmployees() {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        return employees.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteEmployee(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));

        // Delete all timesheet logs associated with this user
        List<Timesheet> timesheets = timesheetRepository.findByUserId(id);
        timesheetRepository.deleteAll(timesheets);

        // Delete the user record
        userRepository.delete(user);
    }

    private BigDecimal calculateHours(LocalTime clockIn, LocalTime clockOut) {
        if (clockOut == null) {
            return null;
        }
        long minutes = ChronoUnit.MINUTES.between(clockIn, clockOut);
        if (minutes < 0) {
            minutes += 24 * 60;
        }
        BigDecimal result = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Working hours cannot be negative");
        }
        return result;
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

    private UserResponse mapToUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .username(u.getUsername())
                .role(u.getRole().name().toLowerCase())
                .hourlyRate(u.getHourlyRate())
                .clientId(u.getClient() != null ? u.getClient().getId() : null)
                .clientCompany(u.getClient() != null ? u.getClient().getName() : null)
                .rate(u.getHourlyRate())
                .build();
    }

    private Client getOrCreateClient(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String trimmedName = name.trim();
        return clientRepository.findByName(trimmedName)
                .orElseGet(() -> {
                    String code = trimmedName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                    if (code.length() > 10) {
                        code = code.substring(0, 10);
                    } else if (code.isEmpty()) {
                        code = "CL" + String.format("%04d", (int)(Math.random() * 10000));
                    } else {
                        int counter = 1;
                        String baseCode = code;
                        while (clientRepository.findByCode(code).isPresent()) {
                            String suffix = String.valueOf(counter);
                            int limit = 10 - suffix.length();
                            code = (baseCode.length() > limit ? baseCode.substring(0, limit) : baseCode) + suffix;
                            counter++;
                        }
                    }
                    Client newClient = Client.builder()
                            .name(trimmedName)
                            .code(code)
                            .active(true)
                            .build();
                    return clientRepository.save(newClient);
                });
    }
}
