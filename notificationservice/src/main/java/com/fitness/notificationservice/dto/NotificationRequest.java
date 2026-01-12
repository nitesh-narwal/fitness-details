package com.fitness.notificationservice.dto;

import com.fitness.notificationservice.model.NotificationType;
import lombok.Data;

@Data
public class NotificationRequest {
    private String userId;
    private String title;
    private NotificationType type;
    private String message;
    private String referenceId;
    private String referenceType;
    private boolean sendEmail;
    private String email;
}
