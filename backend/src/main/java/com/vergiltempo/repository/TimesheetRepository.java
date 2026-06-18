package com.vergiltempo.repository;

import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, String> {
    
    List<Timesheet> findByUserId(String userId);

    List<Timesheet> findByDateBetween(LocalDate startDate, LocalDate endDate);

    // Find logs for a specific user ordered by date (newest first)
    List<Timesheet> findByUserOrderByDateDesc(User user);


    // Find the currently active shift for a user (where clockOut is NULL)
    Optional<Timesheet> findByUserAndClockOutIsNull(User user);

    Optional<Timesheet> findByUserAndDate(User user, LocalDate date);

    @Query("SELECT COUNT(DISTINCT t.user.id) FROM Timesheet t WHERE t.date = :date AND (t.clockOut IS NOT NULL OR (t.hours IS NOT NULL AND t.hours > 0))")
    long countDistinctUserByDateAndClockOutIsNotNull(@Param("date") LocalDate date);


    long countByClockOutIsNull();

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM Timesheet t WHERE t.date = :date AND t.clockOut IS NOT NULL")
    BigDecimal sumHoursByDate(@Param("date") LocalDate date);

    @Query("SELECT t FROM Timesheet t JOIN FETCH t.user u JOIN FETCH t.client c WHERE " +
           "(:userId IS NULL OR u.id = :userId) AND " +
           "(:client IS NULL OR c.name = :client) AND " +
           "(:startDate IS NULL OR t.date >= :startDate) AND " +
           "(:endDate IS NULL OR t.date <= :endDate) " +
           "ORDER BY t.date DESC, t.clockIn DESC")
    List<Timesheet> findFilteredTimesheets(
            @Param("userId") String userId,
            @Param("client") String client,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<Timesheet> findByUserIdAndDateBetweenAndClockOutIsNotNullOrderByDateAscClockInAsc(
            String userId, LocalDate start, LocalDate end);

    List<Timesheet> findByUserIdAndDateBetweenOrderByDateAsc(
            String userId, LocalDate start, LocalDate end);
}


