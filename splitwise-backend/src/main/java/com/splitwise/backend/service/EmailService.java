package com.splitwise.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.internet.MimeMessage;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${spring.mail.properties.mail.smtp.from}")
    private String mailFrom;

    private final JavaMailSender mailSender;

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
            log.error("SMTP email send exception to={}", to, e);
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {

        try{
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,"utf-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        }
        catch (Exception exp){
            throw new RuntimeException("Failed to Send Mail : " + exp);
        }
    }
}
