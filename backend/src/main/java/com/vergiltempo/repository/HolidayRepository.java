package com.vergiltempo.repository;

import com.vergiltempo.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, String> {
    Optional<Holiday> findByHolidayDate(LocalDate date);
    List<Holiday> findByIsActiveTrue();
    boolean existsByHolidayDate(LocalDate date);
    boolean existsByHolidayDateAndIdNot(LocalDate date, String id);
}
