package com.vergiltempo.service;

import com.vergiltempo.dto.HolidayDTO;
import com.vergiltempo.entity.Holiday;
import com.vergiltempo.repository.HolidayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class HolidayServiceTest {

    private HolidayRepository holidayRepository;
    private HolidayService holidayService;

    @BeforeEach
    public void setUp() {
        holidayRepository = Mockito.mock(HolidayRepository.class);
        holidayService = new HolidayServiceImpl(holidayRepository);
    }

    @Test
    public void testGetAllHolidays() {
        Holiday h1 = Holiday.builder().id("h1").holidayName("New Year").holidayDate(LocalDate.of(2026, 1, 1)).holidayType("Public").isActive(true).build();
        Holiday h2 = Holiday.builder().id("h2").holidayName("Independence Day").holidayDate(LocalDate.of(2026, 8, 15)).holidayType("Public").isActive(true).build();
        when(holidayRepository.findAll()).thenReturn(Arrays.asList(h1, h2));

        List<HolidayDTO> list = holidayService.getAllHolidays();
        assertEquals(2, list.size());
        assertEquals("New Year", list.get(0).getHolidayName());
        assertEquals("Independence Day", list.get(1).getHolidayName());
    }

    @Test
    public void testCreateHolidayDuplicateDate() {
        HolidayDTO dto = HolidayDTO.builder().holidayName("New Year").holidayDate(LocalDate.of(2026, 1, 1)).holidayType("Public").active(true).build();
        when(holidayRepository.existsByHolidayDate(dto.getHolidayDate())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> holidayService.createHoliday(dto));
        verify(holidayRepository, never()).save(any());
    }
}
