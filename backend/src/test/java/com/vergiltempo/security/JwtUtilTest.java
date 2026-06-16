package com.vergiltempo.security;

import com.vergiltempo.entity.Role;
import com.vergiltempo.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    public void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "your-secret-key");
    }

    @Test
    public void testGenerateAndValidateToken() {
        User user = User.builder()
                .id("test-uuid")
                .username("testuser")
                .role(Role.EMPLOYEE)
                .build();

        String token = jwtUtil.generateToken(user);
        assertNotNull(token);

        assertTrue(jwtUtil.validateToken(token));

        String username = jwtUtil.extractUsername(token);
        assertEquals("testuser", username);

        String role = jwtUtil.extractRole(token);
        assertEquals("EMPLOYEE", role);
    }

    @Test
    public void testInvalidToken() {
        assertFalse(jwtUtil.validateToken("invalid-token-string"));
    }
}
