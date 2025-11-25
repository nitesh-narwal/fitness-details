package com.fitness.aiservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Activity {
    private String id;
    private  String userId;
    private ActivityType  type;
    private Integer duration; // in minutes
    private String calories;
    private LocalDateTime startTime;
    private Map<String, Object> additionalmetrics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
