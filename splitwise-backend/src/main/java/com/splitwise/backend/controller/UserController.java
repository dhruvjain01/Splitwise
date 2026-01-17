package com.splitwise.backend.controller;

import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.CreateUserRequest;
import com.splitwise.backend.model.User;
import com.splitwise.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@RequestBody @Valid CreateUserRequest request) {
        User user = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>("User created successfully", user));
    }


    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userService.getAllUsers();

        ApiResponse<List<User>> response = new ApiResponse<>(
                "Users fetched successfully",
                users
        );

        return ResponseEntity.ok(response);
    }
}
