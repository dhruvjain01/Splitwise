package com.splitwise.backend.service;

import com.splitwise.backend.model.EmailVerificationToken;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.EmailVerificationTokenRepository;
import com.splitwise.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    private static final int EXPIRY_HOURS = 24;

    public void createAndSendToken(User user) {

        tokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken =
                EmailVerificationToken.builder()
                        .token(token)
                        .user(user)
                        .used(false)
                        .expiresAt(Instant.now().plusSeconds(EXPIRY_HOURS*60*60))
                        .build();

        tokenRepository.save(verificationToken);

        String link = "http://localhost:8080/auth/verify?token=" + token;

        emailService.sendVerificationEmail(user.getEmail(), link);
    }

    public User verifyAndReturnUser(String token) {

        EmailVerificationToken verificationToken =
                tokenRepository.findByToken(token)
                        .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (verificationToken.isUsed()) {
            throw new RuntimeException("Token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Token expired");
        }

        User user = verificationToken.getUser();
        user.setVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);

        return user;
    }
}
