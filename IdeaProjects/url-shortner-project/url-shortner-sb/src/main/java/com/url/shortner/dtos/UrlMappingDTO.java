package com.url.shortner.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UrlMappingDTO {
    private Long id;
    private String originalUrl;
    private String shortUrl;
    private int clickCount;
    private LocalDateTime createdDate;
    private String username;
    
    // New fields
    @JsonProperty("isOneTimeUrl")
    private boolean isOneTimeUrl;

    @JsonProperty("isUsed")
    private boolean isUsed;

    private LocalDateTime expiresAt;

    @JsonProperty("isActive")
    private boolean isActive;
}
