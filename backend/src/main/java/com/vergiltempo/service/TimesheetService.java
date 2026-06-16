package com.vergiltempo.service;

import com.vergiltempo.dto.ActiveStatusResponse;
import com.vergiltempo.dto.ClockInRequest;
import com.vergiltempo.dto.ClockInResponse;
import com.vergiltempo.dto.ClockOutRequest;
import com.vergiltempo.dto.ClockOutResponse;
import com.vergiltempo.dto.TimesheetLogDto;

import java.util.List;

public interface TimesheetService {
    ActiveStatusResponse getActiveStatus(String username);
    ClockInResponse clockIn(String username, ClockInRequest request);
    ClockOutResponse clockOut(String username, ClockOutRequest request);
    List<TimesheetLogDto> getMyLogs(String username);
}
