package com.splitwise.backend.controller;

import com.splitwise.backend.dto.*;
import com.splitwise.backend.model.User;
import com.splitwise.backend.service.AuthService;
import com.splitwise.backend.service.EmailVerificationService;
import com.splitwise.backend.service.UserService;
import com.splitwise.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Value("${app.cors.allowed-origins}")
    String frontendURL;

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(UserService userService, JwtUtil jwtUtil, AuthService authService,EmailVerificationService emailVerificationService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request, response);

        return ResponseEntity.ok(
                new ApiResponse<>("Login successful", loginResponse)
        );
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser() {
        User user = userService.getCurrentUser();

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return new ApiResponse<>(
                "Current user fetched successfully",
                response
        );
    }

    @PostMapping("/signup")
    public ApiResponse<UserResponse> signup(@RequestBody @Valid CreateUserRequest request) {
        User user = userService.createUser(request);

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return new ApiResponse<>(
                "User registered successfully",
                response
        );
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@CookieValue(name = "refreshToken", required = false) String rawToken, HttpServletResponse response) {
        LoginResponse refreshed = authService.refresh(rawToken, response);

        return new ApiResponse<>("Token refreshed", refreshed);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@CookieValue(name = "refreshToken", required = false) String rawToken, HttpServletResponse response) {
        System.out.println("logout");
        authService.logout(rawToken, response);
        return new ApiResponse<>("Logged out successfully", null);
    }

//    @GetMapping("/verify")
//    public ApiResponse<Void> verifyEmail(@RequestParam String token) {
//        emailVerificationService.verifyToken(token);
//        return new ApiResponse<>("Email verified successfully. You can now login.", null);
//    }

    @GetMapping("/verify")
    public void verifyEmail(@RequestParam String token, HttpServletResponse response) throws IOException {
        System.out.println(frontendURL);
        try {
            User user = emailVerificationService.verifyAndReturnUser(token);
            String accessToken = authService.loginAfterVerification(user, response);
            String redirectUrl = frontendURL + "/verify-success?token=" + accessToken;
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            response.sendRedirect(frontendURL + "/verify-failed");
        }
    }

}


