package com.url.shortner.service;

import com.url.shortner.models.User;
import com.url.shortner.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class UrlCleanupScheduler {

    private UrlMappingService urlMappingService;
    private UserService userService;
    private UserRepository userRepository;

    // Run every hour to cleanup expired URLs
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredUrls() {
        log.info("Running scheduled task to cleanup expired URLs...");
        urlMappingService.cleanupExpiredUrls();
        log.info("Expired URLs cleanup completed.");
    }

    // Run once daily at midnight to cleanup URLs older than 3 months
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupOldUrls() {
        log.info("Running scheduled task to cleanup URLs older than 3 months...");
        urlMappingService.cleanupOldUrls();
        log.info("Old URLs cleanup completed.");
    }

    // Run every hour to permanently delete users whose 5-day grace period has expired
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupScheduledDeletedUsers() {
        log.info("Running scheduled task to cleanup users scheduled for deletion...");
        List<User> usersToDelete = userRepository.findUsersToDelete(LocalDateTime.now());
        for (User user : usersToDelete) {
            try {
                log.info("Permanently deleting user: {}", user.getUsername());
                userService.deleteUserAccountById(user.getId());
            } catch (Exception e) {
                log.error("Failed to delete user {}: {}", user.getUsername(), e.getMessage());
            }
        }
        log.info("User cleanup completed. Deleted {} users.", usersToDelete.size());
    }
}

