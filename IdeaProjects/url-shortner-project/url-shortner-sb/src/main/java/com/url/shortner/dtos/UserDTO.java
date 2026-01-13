package com.url.shortner.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;

    // Email verification status
    @JsonProperty("emailVerified")
    private boolean emailVerified;

    // Deletion status fields
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    private LocalDateTime deletionScheduledAt;
    private LocalDateTime deletionDate;
}

