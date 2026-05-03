package com.splitwise.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api.key:${brevo.api-key}}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String fromEmail;

    @Value("${brevo.sender.name:Splitwise}")
    private String fromName;

    private static final String BREVO_SEND_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    @Async
    public void sendVerificationEmail(String to, String verificationLink) {
        try {
            String htmlContent = """
                    <div style="font-family:Arial,sans-serif;">
                      <h2>Verify your Splitwise account</h2>
                      <p>Click below to verify your account:</p>
                      <p><a href="%s">Verify Account</a></p>
                      <p>If you did not create this account, ignore this email.</p>
                    </div>
                    """.formatted(verificationLink);

            sendHtmlEmail(to,"Verify your Splitwise account",htmlContent);
            log.info("Verification email sent to {}", to);

        } catch (Exception e) {
            log.error("Brevo email send exception to={}", to, e);
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try{
            Map<String, Object> payload = Map.of(
                    "sender", Map.of("name", fromName, "email", fromEmail),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "htmlContent", htmlContent
            );
            sendViaBrevo(payload);
        } catch (Exception exp){
            throw new RuntimeException("Failed to send email");
        }
    }

    private void sendViaBrevo(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(BREVO_SEND_EMAIL_ENDPOINT, request, String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Brevo API request failed");
        }
    }
}
