package com.url.shortner.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String username;
    private String password;
    private String role = "ROLE_USER";

    // Email verification fields - Use Boolean wrapper to handle NULL from DB
    @Column(name = "email_verified", columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean emailVerified = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_token_expiry")
    private LocalDateTime verificationTokenExpiry;

    // Soft delete fields for 5-day grace period - Use Boolean wrapper to handle NULL
    // Field name 'deleted' instead of 'isDeleted' for proper Lombok getter/setter generation
    @Column(name = "is_deleted", columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean deleted = false;

    @Column(name = "deletion_scheduled_at")
    private LocalDateTime deletionScheduledAt;

    @Column(name = "deletion_date")
    private LocalDateTime deletionDate;

    // Custom getter to handle null safely - Lombok will generate getEmailVerified()/setEmailVerified()
    public boolean isEmailVerified() {
        return emailVerified != null && emailVerified;
    }

    // Custom getter to handle null safely - Lombok will generate getDeleted()/setDeleted()
    public boolean isDeleted() {
        return deleted != null && deleted;
    }
}
