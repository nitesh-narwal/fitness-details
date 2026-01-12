package com.example.activityservice.dto;

import com.example.activityservice.model.ActivityType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ActivityResponse {
    private String id;
    private  String userId;
    private ActivityType type;
    private Integer duration; // in minutes
    private String calories;
    private Double distance;
    private String additionalNotes;
    private LocalDateTime startTime;


    private Map<String, Object> additionalmetrics;


    private LocalDateTime createdAt;


    private LocalDateTime updatedAt;
}
