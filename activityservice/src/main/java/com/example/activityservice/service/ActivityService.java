package com.example.activityservice.service;

import com.example.activityservice.ActivityRepository;
import com.example.activityservice.dto.ActivityRequest;
import com.example.activityservice.dto.ActivityResponse;
import com.example.activityservice.model.Activity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final ActivityRepository activityRepository;
    private final UserValidationService userValidationService;


    public ActivityResponse trackActivity(ActivityRequest request) {

        boolean isValidUser = userValidationService.validateUser(request.getUserId());
        if (!isValidUser) {
            throw new RuntimeException("Invalid User" + request.getUserId());
        }

        Activity activity = Activity.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .duration(request.getDuration())
                .calories(request.getCalories())
                .startTime(request.getStartTime())
                .additionalmetrics(request.getAdditionalMetrics())
                .build();
        Activity savedActivity = activityRepository.save(activity);
        return mapToResponse(savedActivity);

    }

    private ActivityResponse mapToResponse(Activity activity) {
        ActivityResponse response = new ActivityResponse();
        response.setId(activity.getId());
        response.setUserId(activity.getUserId());
        response.setType(activity.getType());
        response.setDuration(activity.getDuration());
        response.setCalories(activity.getCalories());
        response.setStartTime(activity.getStartTime());
        response.setAdditionalmetrics(activity.getAdditionalmetrics());
        response.setCreatedAt(activity.getCreatedAt());
        response.setUpdatedAt(activity.getUpdatedAt());
        return response;
    }
}
