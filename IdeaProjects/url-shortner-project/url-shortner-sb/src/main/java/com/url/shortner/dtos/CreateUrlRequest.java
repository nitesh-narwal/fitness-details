package com.url.shortner.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateUrlRequest {
    private String originalUrl;

    @JsonProperty("isOneTimeUrl")
    private boolean isOneTimeUrl = false;

    private LocalDateTime expiresAt;
    private Integer expiresInHours;  // Alternative: specify hours until expiration
}

