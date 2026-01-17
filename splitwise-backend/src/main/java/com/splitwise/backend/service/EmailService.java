package com.splitwise.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${spring.mail.properties.mail.smtp.from}")
    private String from;
    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String link) {

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject("Verify your Splitwise account");
        msg.setText("Click the link to verify your account:\n\n" + link);

        mailSender.send(msg);
    }
}
