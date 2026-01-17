package com.splitwise.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class RefreshTokenUtil {

    public String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public Instant expiry(int days) {
        return Instant.now().plus(days, ChronoUnit.DAYS);
    }

    public Instant expiryM(int minutes) {
        return Instant.now().plus(minutes, ChronoUnit.MINUTES);
    }
}


