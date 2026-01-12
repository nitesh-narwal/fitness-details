package com.fitness.userservice.controller;

import com.fitness.userservice.dto.RegisterRequest;
import com.fitness.userservice.dto.SelfRegisterReques;
import com.fitness.userservice.dto.UserResponse;
import com.fitness.userservice.services.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class Usercontroller
{
    private UserService userService;

    @GetMapping("/{userId}")                   //here we are defining the endpoint to get user profile by userId
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable String userId) {
        // Fetch user profile logic here
        return ResponseEntity.ok(userService.getUserProfile(userId));

    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {

        // Registration logic here
        return ResponseEntity.ok(userService.register(request));
    }


    @GetMapping("/{userId}/validate")                   //here we are defining the endpoint to get user profile by userId
    public ResponseEntity<Boolean> validateUser(@PathVariable String userId) {
        // Fetch user profile logic here
        return ResponseEntity.ok(userService.existByUserId(userId));
    }

    @PostMapping("/sync")
    public ResponseEntity<UserResponse> syncSelfRegisteredUser(@RequestBody SelfRegisterReques request) {
        // Sync self-registered user from Keycloak to local database
        return ResponseEntity.ok(userService.syncSelfRegisteredUser(request));
    }

    @PutMapping("/{keycloakId}/verify-email")
    public ResponseEntity<Void> updateEmailVerification(
            @PathVariable String keycloakId,
            @RequestParam boolean verified) {
        userService.updateEmailVerificationStatus(keycloakId, verified);
        return ResponseEntity.ok().build();
    }
}
