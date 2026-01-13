package com.url.shortner.repository;

import com.url.shortner.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    // Find user by verification token for email verification
    Optional<User> findByVerificationToken(String token);

    // Find users whose deletion grace period has expired
    @Query("SELECT u FROM User u WHERE u.deleted = true AND u.deletionDate < :now")
    List<User> findUsersToDelete(@Param("now") LocalDateTime now);
}
