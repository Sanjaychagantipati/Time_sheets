package com.vergiltempo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "hourly_rate", nullable = false, precision = 8, scale = 2)
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public User() {
    }

    @Builder
    public User(String id, String name, String username, String passwordHash, Role role, Client client, BigDecimal hourlyRate, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.client = client;
        this.hourlyRate = hourlyRate != null ? hourlyRate : BigDecimal.ZERO;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
