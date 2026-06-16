package com.vergiltempo.repository;

import com.vergiltempo.entity.User;
import com.vergiltempo.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByRole(Role role);
    long countByRole(Role role);
}

