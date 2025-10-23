package com.example.activityservice.dto;

import com.example.activityservice.model.ActivityType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ActivityRequest {

    private  String userId;
    private ActivityType type;
    private Integer duration; // in minutes
    private String calories;
    private LocalDateTime startTime;

    private Map<String, Object> additionalMetrics;

}
