package com.splitwise.backend.service;

import com.splitwise.backend.model.EmailVerificationToken;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.EmailVerificationTokenRepository;
import com.splitwise.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    private static final int EXPIRY_HOURS = 24;

    @Value("${app.backend.base-url}")
    private String backendBaseUrl;

    @Transactional
    public void createAndSendToken(User user) {

        log.info("Deleting old token for user {}", user.getId());
        tokenRepository.deleteByUserId(user.getId());
        log.info("Deleted old token");

        String token = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken =
                EmailVerificationToken.builder()
                        .token(token)
                        .user(user)
                        .used(false)
                        .expiresAt(Instant.now().plusSeconds(EXPIRY_HOURS*60*60L))
                        .build();

        log.info("Saving new token...");
        tokenRepository.save(verificationToken);
        log.info("Saved token");

        String link = backendBaseUrl + "/auth/verify?token=" + token;

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
