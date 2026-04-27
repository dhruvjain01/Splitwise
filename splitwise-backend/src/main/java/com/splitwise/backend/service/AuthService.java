package com.splitwise.backend.service;

import com.splitwise.backend.dto.LoginRequest;
import com.splitwise.backend.dto.LoginResponse;
import com.splitwise.backend.exception.UnauthorizedException;
import com.splitwise.backend.exception.UserNotVerified;
import com.splitwise.backend.model.RefreshToken;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.RefreshTokenRepository;
import com.splitwise.backend.repository.UserRepository;
import com.splitwise.backend.util.JwtUtil;
import com.splitwise.backend.util.RefreshTokenUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class AuthService {

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenUtil refreshTokenUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            RefreshTokenUtil refreshTokenUtil,
            RefreshTokenRepository refreshTokenRepository,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.refreshTokenUtil = refreshTokenUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
    }

    // ================= LOGIN =================

    public LoginResponse login(LoginRequest request, HttpServletResponse response) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new UnauthorizedException("User not found")
                );

        if (!user.isVerified()) {
            throw new UserNotVerified("Please verify your email before logging in");
        }

        String accessToken = jwtUtil.generateToken(user);

        // 🔐 NEW refresh session
        RefreshToken refreshToken = new RefreshToken();
        Instant now = Instant.now();
        String rawRefreshToken = refreshTokenUtil.generateToken();

        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenUtil.hashToken(rawRefreshToken));
        refreshToken.setCreatedAt(now);
        refreshToken.setExpiresAt(now.plusMillis(refreshExpirationMs));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", rawRefreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(refreshTokenCookieMaxAgeSeconds())
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                accessToken
        );
    }

    // ================= REFRESH =================

    public LoginResponse refresh(String refreshTokenValue, HttpServletResponse response) {

        if (refreshTokenValue == null) {
            throw new UnauthorizedException("Refresh token missing");
        }

        String hashedTokenValue = refreshTokenUtil.hashToken(refreshTokenValue);

        RefreshToken token = refreshTokenRepository
                .findByToken(hashedTokenValue)
                .orElseThrow(() ->
                        new UnauthorizedException("Invalid refresh token")
                );

        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        // 🔁 Rotate token ONLY (do NOT extend expiry)
        String newRawTokenValue = refreshTokenUtil.generateToken();
        token.setToken(refreshTokenUtil.hashToken(newRawTokenValue));

        refreshTokenRepository.save(token);

        long remainingSeconds = remainingRefreshTokenTtlSeconds(token.getExpiresAt());

        ResponseCookie cookie = ResponseCookie.from("refreshToken", newRawTokenValue)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(remainingSeconds)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        String newAccessToken = jwtUtil.generateToken(token.getUser());

        return new LoginResponse(
                token.getUser().getId(),
                token.getUser().getEmail(),
                newAccessToken
        );
    }

    // ================= LOGOUT =================

    public void logout(String refreshTokenValue, HttpServletResponse response) {

        if (refreshTokenValue != null) {
            String hashedTokenValue = refreshTokenUtil.hashToken(refreshTokenValue);
            refreshTokenRepository.findByToken(hashedTokenValue)
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    // ========== AUTO LOGIN AFTER VERIFICATION ==========

    public String loginAfterVerification(User user, HttpServletResponse response) {

        String accessToken = jwtUtil.generateToken(user);

        RefreshToken refreshToken = new RefreshToken();
        Instant now = Instant.now();
        String rawRefreshToken = refreshTokenUtil.generateToken();

        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenUtil.hashToken(rawRefreshToken));
        refreshToken.setCreatedAt(now);
        refreshToken.setExpiresAt(now.plusMillis(refreshExpirationMs));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", rawRefreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/auth")
                .maxAge(refreshTokenCookieMaxAgeSeconds())
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return accessToken;
    }

    private long refreshTokenCookieMaxAgeSeconds() {
        return Math.max(1L, refreshExpirationMs / 1000);
    }

    private long remainingRefreshTokenTtlSeconds(Instant expiresAt) {
        long seconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (seconds <= 0) {
            throw new UnauthorizedException("Refresh token expired");
        }
        return seconds;
    }

}
