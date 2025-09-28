package com.fitness.userservice.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table (name = "users")
@Data
public class User {
    @Id
    @GeneratedValue (strategy = GenerationType.UUID )
    private String id;
    private String name;
    private String email;
    private String password;
    private UserRole role = UserRole.USER;

    private LocalDateTime created;
    private LocalDateTime updated;


}
