package com.vergiltempo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "timesheets")
public class Timesheet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "clock_in", nullable = false)
    private LocalTime clockIn;

    @Column(name = "clock_out")
    private LocalTime clockOut;

    @Column(precision = 5, scale = 2)
    private BigDecimal hours;

    @Column(length = 255)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public Timesheet() {
    }

    @Builder
    public Timesheet(String id, User user, Client client, LocalDate date, LocalTime clockIn, LocalTime clockOut, BigDecimal hours, String location, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.client = client;
        this.date = date;
        this.clockIn = clockIn;
        this.clockOut = clockOut;
        this.hours = hours;
        this.location = location;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getClockIn() {
        return clockIn;
    }

    public void setClockIn(LocalTime clockIn) {
        this.clockIn = clockIn;
    }

    public LocalTime getClockOut() {
        return clockOut;
    }

    public void setClockOut(LocalTime clockOut) {
        this.clockOut = clockOut;
    }

    public BigDecimal getHours() {
        return hours;
    }

    public void setHours(BigDecimal hours) {
        this.hours = hours;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
