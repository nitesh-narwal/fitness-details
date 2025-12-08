package com.example.activityservice.service;

import com.example.activityservice.ActivityRepository;
import com.example.activityservice.dto.ActivityRequest;
import com.example.activityservice.dto.ActivityResponse;
import com.example.activityservice.model.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {
    private final ActivityRepository activityRepository;
    private WebClient.Builder webClientBuilder;
    private final UserValidationService userValidationService;
    private final KafkaTemplate<String, Activity> kafkaTemplate;

    @Value("${kafka.topic.name}")
    private String topicName;


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

        try{
            kafkaTemplate.send(topicName, savedActivity.getUserId(), savedActivity);
        } catch (Exception e) {
            //e.printStackTrace();
            log.error("Unexpected exception while sending to Kafka for userId={}", savedActivity.getUserId(), e);
            // optional: rethrow or handle according to business needs
        }
        return mapToResponse(savedActivity);

    }

    @Transactional
    public void deleteActivity(String activityId, String userId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this activity");
        }

        // Delete from recommendation service first
        try {
            webClientBuilder.build()
                    .delete()
                    .uri("http://aiservice/api/recommendations/activity/{activityId}", activityId)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
            log.info("Deleted recommendations for activity: {}", activityId);
        } catch (Exception e) {
            log.error("Error deleting recommendations: {}", e.getMessage());
        }

        // Delete activity
        activityRepository.deleteById(activityId);
        log.info("Activity deleted successfully: {}", activityId);
    }

    @Transactional
    public void deleteOldActivities() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusMonths(1).minusDays(15); // 1.5 months
        List<Activity> oldActivities = activityRepository.findByCreatedAtBefore(cutoffDate);

        log.info("Found {} activities older than 1.5 months", oldActivities.size());

        for (Activity activity : oldActivities) {
            try {
                deleteActivity(activity.getId(), activity.getUserId());
            } catch (Exception e) {
                log.error("Error deleting old activity {}: {}", activity.getId(), e.getMessage());
            }
        }
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

    public List<ActivityResponse> getUserActivities(String userId) {
        List<Activity> activityList = activityRepository.findByUserId(userId);
        return activityList.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}
