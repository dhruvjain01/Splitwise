package com.splitwise.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${spring.mail.properties.mail.smtp.from}")
    private String mailFrom;

    private final RestTemplate restTemplate;

    private static final String BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

    @Async
    public void sendVerificationEmail(String to, String verificationLink) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            // HTML email
            String htmlContent = """
                    <div style="font-family:Arial,sans-serif;">
                      <h2>Verify your Splitwise account</h2>
                      <p>Click below to verify your account:</p>
                      <p><a href="%s">Verify Account</a></p>
                      <p>If you did not create this account, ignore this email.</p>
                    </div>
                    """.formatted(verificationLink);

            // Plain text backup
            String textContent = "Verify your Splitwise account: " + verificationLink;

            Map<String, Object> payload = Map.of(
                    "sender", Map.of("email", mailFrom, "name", "Splitwise Admin"),
                    "to", List.of(Map.of("email", to)),
                    "subject", "Verify your Splitwise account",
                    "htmlContent", htmlContent,
                    "textContent", textContent
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_SEND_EMAIL_URL, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Brevo send email failed. status={}, body={}",
                        response.getStatusCode(), response.getBody());
            } else {
                log.info("Brevo verification email sent to {}", to);
            }

        } catch (Exception e) {
            log.error("Brevo email send exception to={}", to, e);
        }
    }
}
