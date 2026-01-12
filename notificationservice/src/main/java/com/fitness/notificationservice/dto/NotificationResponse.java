package com.fitness.notificationservice.dto;

import com.fitness.notificationservice.model.NotificationStatus;
import com.fitness.notificationservice.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String userId;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationStatus status;
    private String referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
