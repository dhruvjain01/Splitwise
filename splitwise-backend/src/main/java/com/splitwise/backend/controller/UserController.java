package com.splitwise.backend.controller;

import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.CreateUserRequest;
import com.splitwise.backend.dto.UserResponse;
import com.splitwise.backend.model.User;
import com.splitwise.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody @Valid CreateUserRequest request) {
        User user = userService.createUser(request);
        UserResponse userResponse = new UserResponse(user.getId(), user.getName(), user.getEmail());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>("User created successfully", userResponse));
    }


    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserResponse> userResponses = users.stream()
                .map(user -> new UserResponse(user.getId(), user.getName(), user.getEmail()))
                .collect(Collectors.toList());

        ApiResponse<List<UserResponse>> response = new ApiResponse<>(
                "Users fetched successfully",
                userResponses
        );

        return ResponseEntity.ok(response);
    }
}
