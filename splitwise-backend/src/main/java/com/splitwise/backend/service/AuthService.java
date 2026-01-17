package com.splitwise.backend.service;
//
//import com.splitwise.backend.dto.LoginRequest;
//import com.splitwise.backend.dto.LoginResponse;
//import com.splitwise.backend.exception.ResourceNotFoundException;
//import com.splitwise.backend.exception.UnauthorizedException;
//import com.splitwise.backend.model.RefreshToken;
//import com.splitwise.backend.model.User;
//import com.splitwise.backend.repository.RefreshTokenRepository;
//import com.splitwise.backend.repository.UserRepository;
//import com.splitwise.backend.util.JwtUtil;
//import com.splitwise.backend.util.RefreshTokenUtil;
//import jakarta.servlet.http.HttpServletResponse;
//import org.springframework.http.ResponseCookie;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.BadCredentialsException;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//
//
//import java.time.Instant;
//import java.time.LocalDateTime;
//import java.util.Date;
//
//@Service
//public class AuthService {
//
//    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;
//    private final JwtUtil jwtUtil;
//    private final RefreshTokenUtil refreshTokenUtil;
//    private final RefreshTokenRepository refreshTokenRepository;
//    private final AuthenticationManager authenticationManager;
//
//    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, RefreshTokenUtil refreshTokenUtil, RefreshTokenRepository refreshTokenRepository, AuthenticationManager authenticationManager) {
//        this.userRepository = userRepository;
//        this.passwordEncoder = passwordEncoder;
//        this.jwtUtil = jwtUtil;
//        this.refreshTokenUtil = refreshTokenUtil;
//        this.refreshTokenRepository = refreshTokenRepository;
//        this.authenticationManager = authenticationManager;
//    }
//
//    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
//        authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(
//                        request.getEmail(),
//                        request.getPassword()
//                )
//        );
//        User user = userRepository.findByEmail(request.getEmail())
//                .orElseThrow(() ->
//                        new UnauthorizedException("User not found")
//                );
//        String accessToken = jwtUtil.generateToken(user);
//        // 🔁 Refresh token (replace-in-place)
//        String refreshTokenValue = refreshTokenUtil.generateToken();
//        RefreshToken refreshToken = refreshTokenRepository
//                .findByUserAndRevokedFalse(user)
//                .orElse(new RefreshToken());
//
//        refreshToken.setUser(user);
//        refreshToken.setToken(refreshTokenValue);
//        refreshToken.setExpiresAt(refreshTokenUtil.expiryM(3));
//        refreshToken.setRevoked(false);
//
//        refreshTokenRepository.save(refreshToken);
//
//        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshTokenValue)
//                .httpOnly(true)
//                .secure(false) // 🔴 LOCALHOST FIX
//                .sameSite("Strict")
//                .path("/auth")
////                .maxAge(14 * 24 * 60 * 60)
//                .maxAge(3 * 60)
//                .build();
//        response.addHeader("Set-Cookie", cookie.toString());
//
//        return new LoginResponse(
//                user.getId(),
//                user.getEmail(),
//                accessToken
//        );
//    }
//
//
//    public LoginResponse refresh(String refreshTokenValue, HttpServletResponse response) {
//
//        if (refreshTokenValue == null) {
//            throw new UnauthorizedException("Refresh token missing");
//        }
//
//        RefreshToken token = refreshTokenRepository
//                .findByToken(refreshTokenValue)
//                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
//
//        if (token.isRevoked() ||
//                token.getExpiresAt().isBefore(Instant.now())) {
//            throw new UnauthorizedException("Refresh token expired");
//        }
//
//        // 🔁 ROTATE TOKEN
//        String newTokenValue = refreshTokenUtil.generateToken();
//        token.setToken(newTokenValue);
////        token.setExpiresAt(refreshTokenUtil.expiryM(3));₹
//
//        refreshTokenRepository.save(token);
//
//        ResponseCookie cookie = ResponseCookie.from("refreshToken", newTokenValue)
//                .httpOnly(true)
//                .secure(false) // localhost
//                .sameSite("Strict")
//                .path("/auth")
//                .maxAge(3 * 60)

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
import org.springframework.stereotype.Service;

import java.time.Instant;

////                .maxAge(14 * 24 * 60 * 60)
//                .build();
//
//        response.addHeader("Set-Cookie", cookie.toString());
//
//        String newAccessToken =
//                jwtUtil.generateToken(token.getUser());
//
//        return new LoginResponse(
//                token.getUser().getId(),
//                token.getUser().getEmail(),
//                newAccessToken
//        );
//    }
//
//    public void logout(String refreshTokenValue, HttpServletResponse response) {
//        System.out.println(refreshTokenValue);
//        System.out.println(response);
//        if (refreshTokenValue != null) {
//            refreshTokenRepository.findByToken(refreshTokenValue)
//                    .ifPresent(token -> {
//                        token.setRevoked(true);
//                        refreshTokenRepository.save(token);
//                    });
//        }
//
//        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
//                .httpOnly(true)
//                .secure(false)
//                .path("/auth")
//                .maxAge(0)
//                .build();
//
//        response.addHeader("Set-Cookie", cookie.toString());
//    }
//}
//

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenUtil refreshTokenUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            RefreshTokenUtil refreshTokenUtil,
            RefreshTokenRepository refreshTokenRepository,
            AuthenticationManager authenticationManager,
            UserService userService
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.refreshTokenUtil = refreshTokenUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
    }

    // ================= LOGIN =================

    public LoginResponse login(LoginRequest request, HttpServletResponse response) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

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

        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenUtil.generateToken());
        refreshToken.setCreatedAt(now);
        refreshToken.setExpiresAt(now.plusSeconds(15 * 60)); // 3 mins
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true)
                .secure(true) // localhost
                .sameSite("None")
                .path("/auth")
                .maxAge(15 * 60)
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

        RefreshToken token = refreshTokenRepository
                .findByToken(refreshTokenValue)
                .orElseThrow(() ->
                        new UnauthorizedException("Invalid refresh token")
                );

        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        // 🔁 Rotate token ONLY (do NOT extend expiry)
        String newTokenValue = refreshTokenUtil.generateToken();
        token.setToken(newTokenValue);

        refreshTokenRepository.save(token);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", newTokenValue)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/auth")
                .maxAge(15 * 60)
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
            refreshTokenRepository.findByToken(refreshTokenValue)
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/auth")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    // ========== AUTO LOGIN AFTER VERIFICATION ==========

    public String loginAfterVerification(User user, HttpServletResponse response) {

        String accessToken = jwtUtil.generateToken(user);

        RefreshToken refreshToken = new RefreshToken();
        Instant now = Instant.now();

        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenUtil.generateToken());
        refreshToken.setCreatedAt(now);
        refreshToken.setExpiresAt(now.plusSeconds(15 * 60));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true)
                .secure(true) // localhost
                .sameSite("None")
                .path("/auth")
                .maxAge(15 * 60)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return accessToken;
    }

}

