package com.url.shortner.repository;

import com.url.shortner.models.UrlMapping;
import com.url.shortner.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UrlMappingRepository extends JpaRepository<UrlMapping, Long> {

    UrlMapping findByShortUrl(String shortUrl);
    List<UrlMapping> findByUser(User user);
    Optional<UrlMapping> findByIdAndUser(Long id, User user);
    void deleteByUser(User user);
    
    // Find expired URLs (custom expiration)
    @Query("SELECT u FROM UrlMapping u WHERE u.expiresAt IS NOT NULL AND u.expiresAt < :now AND u.isActive = true")
    List<UrlMapping> findExpiredUrls(@Param("now") LocalDateTime now);
    
    // Find URLs older than 3 months
    @Query("SELECT u FROM UrlMapping u WHERE u.createdDate < :cutoffDate AND u.isActive = true")
    List<UrlMapping> findUrlsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
