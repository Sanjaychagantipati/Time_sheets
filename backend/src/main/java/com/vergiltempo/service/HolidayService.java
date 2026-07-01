package com.vergiltempo.service;

import com.vergiltempo.dto.HolidayDTO;
import java.util.List;

public interface HolidayService {
    List<HolidayDTO> getAllHolidays();
    List<HolidayDTO> getActiveHolidays();
    HolidayDTO createHoliday(HolidayDTO dto);
    HolidayDTO updateHoliday(String id, HolidayDTO dto);
    void deleteHoliday(String id);
}
