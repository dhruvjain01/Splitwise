package com.splitwise.backend.service;

import com.splitwise.backend.dto.CreateUserRequest;
import com.splitwise.backend.exception.DuplicateEmailException;
import com.splitwise.backend.exception.ResourceNotFoundException;
import com.splitwise.backend.exception.UnauthorizedException;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.UserRepository;
import com.splitwise.backend.util.CurrentUserContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;

    public UserService(UserRepository userRepository, EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.emailVerificationService = emailVerificationService;
    }

    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // 🔐
        user.setVerified(false);
        User savedUser = userRepository.save(user);

        emailVerificationService.createAndSendToken(savedUser);
        return savedUser;
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getCurrentUser() {
        String email = CurrentUserContext.getEmail();
        if (email == null) {
            throw new UnauthorizedException("User not authenticated");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UnauthorizedException("User not found")
                );
    }

}

