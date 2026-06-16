package com.vergiltempo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class DebugController {

    @GetMapping("/api/debug/me")
    public ResponseEntity<Map<String, Object>> debugMe(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "No authentication"));
        }
        return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "roles", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList())
        ));
    }
}
