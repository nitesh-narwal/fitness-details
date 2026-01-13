package com.url.shortner.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class UrlMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String originalUrl;
    private String shortUrl;
    private int clickCount = 0;
    private LocalDateTime createdDate;
    
    // New fields for advanced features
    private boolean isOneTimeUrl = false;  // One-time use URL
    private boolean isUsed = false;  // Track if one-time URL has been used
    private LocalDateTime expiresAt;  // Custom expiration time
    private boolean isActive = true;  // URL status

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "urlMapping", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClickEvent> clickEvents;
    
    @OneToMany(mappedBy = "urlMapping", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeviceAccess> deviceAccesses;
}
