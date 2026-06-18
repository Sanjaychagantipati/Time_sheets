package com.vergiltempo.service;

import com.vergiltempo.dto.*;
import java.util.List;

public interface AdminService {
    AdminStatsResponse getStats();
    List<TimesheetLogDto> getFilteredTimesheets(String userId, String client, String startDate, String endDate);
    TimesheetLogDto createManualTimesheet(AdminTimesheetRequest request);
    TimesheetLogDto updateTimesheet(String logId, AdminTimesheetRequest request);
    void deleteTimesheet(String logId);
    void bulkDeleteTimesheets(List<String> logIds);
    UserResponse createEmployee(CreateUserRequest request);
    List<UserResponse> getEmployees();
    void deleteEmployee(String id);
}
