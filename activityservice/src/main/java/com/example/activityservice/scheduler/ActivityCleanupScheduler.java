package com.example.activityservice.scheduler;

import com.example.activityservice.service.ActivityService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
@Slf4j
public class ActivityCleanupScheduler {
    private ActivityService activityService;

    @Scheduled(cron = "0 0 2 * * ?") // Runs every day at 2 AM
    public void cleanupOldActivities() {
        log.info("Starting scheduled cleanup of old activities");
        activityService.deleteOldActivities();
        log.info("Completed scheduled cleanup of old activities");
    }
}
