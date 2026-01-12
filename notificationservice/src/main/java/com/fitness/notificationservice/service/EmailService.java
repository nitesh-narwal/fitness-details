package com.fitness.notificationservice.service;

import com.fitness.notificationservice.dto.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    public void sendNotificationEmail(NotificationRequest request) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(request.getUserId()); // Assuming userId is email
            message.setSubject("Fitness App: " + request.getTitle());
            message.setText(request.getMessage());
            mailSender.send(message);
            log.info("Email sent to: {}", request.getUserId());
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
        }
    }
}
