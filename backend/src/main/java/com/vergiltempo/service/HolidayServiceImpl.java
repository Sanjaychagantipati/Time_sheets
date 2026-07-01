package com.vergiltempo.service;

import com.vergiltempo.dto.HolidayDTO;
import com.vergiltempo.entity.Holiday;
import com.vergiltempo.repository.HolidayRepository;
import com.vergiltempo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    public HolidayServiceImpl(HolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HolidayDTO> getAllHolidays() {
        return holidayRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HolidayDTO> getActiveHolidays() {
        return holidayRepository.findByIsActiveTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public HolidayDTO createHoliday(HolidayDTO dto) {
        if (holidayRepository.existsByHolidayDate(dto.getHolidayDate())) {
            throw new IllegalArgumentException("A holiday already exists on date " + dto.getHolidayDate());
        }
        Holiday holiday = Holiday.builder()
                .holidayName(dto.getHolidayName())
                .holidayDate(dto.getHolidayDate())
                .description(dto.getDescription())
                .holidayType(dto.getHolidayType())
                .isActive(dto.isActive())
                .build();
        Holiday saved = holidayRepository.save(holiday);
        return convertToDto(saved);
    }

    @Override
    public HolidayDTO updateHoliday(String id, HolidayDTO dto) {
        Holiday existing = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found: " + id));

        if (holidayRepository.existsByHolidayDateAndIdNot(dto.getHolidayDate(), id)) {
            throw new IllegalArgumentException("A holiday already exists on date " + dto.getHolidayDate());
        }

        existing.setHolidayName(dto.getHolidayName());
        existing.setHolidayDate(dto.getHolidayDate());
        existing.setDescription(dto.getDescription());
        existing.setHolidayType(dto.getHolidayType());
        existing.setIsActive(dto.isActive());

        Holiday saved = holidayRepository.save(existing);
        return convertToDto(saved);
    }

    @Override
    public void deleteHoliday(String id) {
        Holiday existing = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found: " + id));
        holidayRepository.delete(existing);
    }

    private HolidayDTO convertToDto(Holiday h) {
        return HolidayDTO.builder()
                .id(h.getId())
                .holidayName(h.getHolidayName())
                .holidayDate(h.getHolidayDate())
                .description(h.getDescription())
                .holidayType(h.getHolidayType())
                .active(h.getIsActive())
                .build();
    }
}
