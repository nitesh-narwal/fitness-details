package com.url.shortner.service;

import com.url.shortner.dtos.ClickEventDTO;
import com.url.shortner.dtos.CreateUrlRequest;
import com.url.shortner.dtos.UrlMappingDTO;
import com.url.shortner.models.ClickEvent;
import com.url.shortner.models.DeviceAccess;
import com.url.shortner.models.UrlMapping;
import com.url.shortner.models.User;
import com.url.shortner.repository.ClickEventRepository;
import com.url.shortner.repository.DeviceAccessRepository;
import com.url.shortner.repository.UrlMappingRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UrlMappingService {
    private UrlMappingRepository urlMappingRepository;
    private ClickEventRepository clickEventRepository;
    private DeviceAccessRepository deviceAccessRepository;

    public UrlMappingDTO createShortUrl(String originalUrl, User user) {
        return createShortUrl(originalUrl, user, false, null);
    }

    public UrlMappingDTO createShortUrl(String originalUrl, User user, boolean isOneTimeUrl, LocalDateTime expiresAt) {
        String shortUrl = generateShortUrl();
        UrlMapping urlMapping = new UrlMapping();
        urlMapping.setOriginalUrl(originalUrl);
        urlMapping.setShortUrl(shortUrl);
        urlMapping.setUser(user);
        urlMapping.setCreatedDate(LocalDateTime.now());
        urlMapping.setOneTimeUrl(isOneTimeUrl);
        urlMapping.setExpiresAt(expiresAt);
        urlMapping.setActive(true);
        urlMapping.setUsed(false);
        UrlMapping savedUrlMapping = urlMappingRepository.save(urlMapping);

        return convertToDto(savedUrlMapping);
    }

    public UrlMappingDTO createShortUrlWithRequest(CreateUrlRequest request, User user) {
        LocalDateTime expiresAt = request.getExpiresAt();
        if (expiresAt == null && request.getExpiresInHours() != null) {
            expiresAt = LocalDateTime.now().plusHours(request.getExpiresInHours());
        }
        return createShortUrl(request.getOriginalUrl(), user, request.isOneTimeUrl(), expiresAt);
    }

    private UrlMappingDTO convertToDto(UrlMapping urlMapping) {
        UrlMappingDTO urlMappingDTO = new UrlMappingDTO();
        urlMappingDTO.setId(urlMapping.getId());
        urlMappingDTO.setOriginalUrl(urlMapping.getOriginalUrl());
        urlMappingDTO.setShortUrl(urlMapping.getShortUrl());
        urlMappingDTO.setClickCount(urlMapping.getClickCount());
        urlMappingDTO.setCreatedDate(urlMapping.getCreatedDate());
        urlMappingDTO.setUsername(urlMapping.getUser().getUsername());
        urlMappingDTO.setOneTimeUrl(urlMapping.isOneTimeUrl());
        urlMappingDTO.setUsed(urlMapping.isUsed());
        urlMappingDTO.setExpiresAt(urlMapping.getExpiresAt());
        urlMappingDTO.setActive(urlMapping.isActive());
        return urlMappingDTO;
    }

    private String generateShortUrl() {
        String characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder shortUrl = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            shortUrl.append(characters.charAt(random.nextInt(characters.length())));
        }
        return shortUrl.toString();
    }

    public List<UrlMappingDTO> getUrlsByUser(User user) {
        return urlMappingRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Transactional
    public boolean deleteUrl(Long urlId, User user) {
        Optional<UrlMapping> urlMapping = urlMappingRepository.findByIdAndUser(urlId, user);
        if (urlMapping.isPresent()) {
            urlMappingRepository.delete(urlMapping.get());
            return true;
        }
        return false;
    }

    @Transactional
    public void deleteAllUrlsByUser(User user) {
        urlMappingRepository.deleteByUser(user);
    }

    public List<ClickEventDTO> getClickEventsByDate(String shortUrl, LocalDateTime start, LocalDateTime end) {
        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if (urlMapping != null) {
            return clickEventRepository.findByUrlMappingAndClickDateBetween(urlMapping, start, end).stream()
                    .collect(
                            Collectors.groupingBy(
                                    click -> click.getClickDate().toLocalDate(),
                                    Collectors.counting()
                            )
                    )
                    .entrySet().stream()
                    .map(entry -> {
                        ClickEventDTO clickEventDTO = new ClickEventDTO();
                        clickEventDTO.setClickDate(entry.getKey());
                        clickEventDTO.setCount(entry.getValue());
                        return clickEventDTO;
                    })
                    .collect(Collectors.toList());
        }
        return null;
    }

    public Map<LocalDate, Long> getTotalClicksByUserAndDate(User user, LocalDate start, LocalDate end) {
        List<UrlMapping> urlMappings = urlMappingRepository.findByUser(user);

        if (urlMappings == null || urlMappings.isEmpty()) {
            return Map.of();
        }

        List<ClickEvent> clickEvents = clickEventRepository.findByUrlMappingInAndClickDateBetween(urlMappings, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        return clickEvents.stream()
                .collect(
                        Collectors.groupingBy(
                                click -> click.getClickDate().toLocalDate(),
                                Collectors.counting()
                        )
                );
    }

    public UrlMapping getOriginalUrl(String shortUrl) {
        return getOriginalUrl(shortUrl, null);
    }

    @Transactional
    public UrlMapping getOriginalUrl(String shortUrl, String deviceFingerprint) {
        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if (urlMapping != null) {
            // Check if URL is active
            if (!urlMapping.isActive()) {
                return null;
            }

            // Check if URL has expired
            if (urlMapping.getExpiresAt() != null && LocalDateTime.now().isAfter(urlMapping.getExpiresAt())) {
                urlMapping.setActive(false);
                urlMappingRepository.save(urlMapping);
                return null;
            }

            // Check if one-time URL has been used
            if (urlMapping.isOneTimeUrl()) {
                if (deviceFingerprint != null) {
                    // Check if this device has already accessed this URL
                    Optional<DeviceAccess> existingAccess = deviceAccessRepository.findByUrlMappingAndDeviceFingerprint(urlMapping, deviceFingerprint);
                    if (existingAccess.isPresent()) {
                        return null; // Already accessed by this device
                    }

                    // Record device access
                    DeviceAccess deviceAccess = new DeviceAccess();
                    deviceAccess.setUrlMapping(urlMapping);
                    deviceAccess.setDeviceFingerprint(deviceFingerprint);
                    deviceAccess.setAccessedAt(LocalDateTime.now());
                    deviceAccessRepository.save(deviceAccess);
                }
            }

            urlMapping.setClickCount(urlMapping.getClickCount() + 1);
            urlMappingRepository.save(urlMapping);

            // Record click event
            ClickEvent clickEvent = new ClickEvent();
            clickEvent.setUrlMapping(urlMapping);
            clickEvent.setClickDate(LocalDateTime.now());
            clickEventRepository.save(clickEvent);
        }
        return urlMapping;
    }

    // Cleanup methods for scheduled tasks
    @Transactional
    public void cleanupExpiredUrls() {
        List<UrlMapping> expiredUrls = urlMappingRepository.findExpiredUrls(LocalDateTime.now());
        for (UrlMapping url : expiredUrls) {
            url.setActive(false);
            urlMappingRepository.save(url);
        }
    }

    @Transactional
    public void cleanupOldUrls() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusMonths(3);
        List<UrlMapping> oldUrls = urlMappingRepository.findUrlsOlderThan(cutoffDate);
        urlMappingRepository.deleteAll(oldUrls);
    }
}
