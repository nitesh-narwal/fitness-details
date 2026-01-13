package com.url.shortner.controller;

import com.url.shortner.dtos.LoginRequest;
import com.url.shortner.dtos.RegistrationRequest;
import com.url.shortner.dtos.UserDTO;
import com.url.shortner.models.User;
import com.url.shortner.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * AuthController - Handles all authentication-related endpoints
 *
 * PUBLIC ENDPOINTS (no authentication required):
 * - POST /api/auth/public/register - Register new user (sends verification email)
 * - POST /api/auth/public/login - Login user (requires verified email)
 * - GET /api/auth/public/verify-email - Verify email with token
 * - POST /api/auth/public/resend-verification - Resend verification email
 *
 * PROTECTED ENDPOINTS (requires authentication):
 * - GET /api/auth/profile - Get user profile
 * - POST /api/auth/account/schedule-deletion - Schedule account deletion
 * - POST /api/auth/account/cancel-deletion - Cancel scheduled deletion
 * - DELETE /api/auth/account - Immediately delete account
 */
@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private UserService userService;

    /**
     * Login endpoint - Returns JWT token if credentials are valid and email is verified
     */
    @PostMapping("/public/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            return ResponseEntity.ok(userService.authenticateUser(loginRequest));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Register endpoint - Creates new user and sends verification email
     * User must verify email before logging in
     */
    @PostMapping("/public/register")
    public ResponseEntity<?> registerUser(@RequestBody RegistrationRequest registrationRequest) {
        try {
            User user = new User();
            user.setUsername(registrationRequest.getUsername());
            user.setPassword(registrationRequest.getPassword());
            user.setEmail(registrationRequest.getEmail());
            user.setRole("ROLE_USER");
            userService.registerUser(user);
            return ResponseEntity.ok(Map.of(
                "message", "Registration successful! Please check your email to verify your account.",
                "email", registrationRequest.getEmail()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Email verification endpoint - Verifies user email using token from email link
     * Called when user clicks verification link in email
     *
     * @param token - Verification token from email
     */
    @GetMapping("/public/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            userService.verifyEmail(token);
            return ResponseEntity.ok(Map.of(
                "message", "Email verified successfully! You can now login.",
                "verified", true
            ));
        } catch (RuntimeException e) {
            String message = e.getMessage();
            boolean isExpired = message.contains("expired");
            boolean isAlreadyVerified = message.contains("already verified");

            return ResponseEntity.badRequest().body(Map.of(
                "message", message,
                "verified", false,
                "expired", isExpired,
                "alreadyVerified", isAlreadyVerified
            ));
        }
    }

    /**
     * Resend verification email endpoint - Sends new verification email
     * Used when verification link expires or user didn't receive email
     * 
     * @param request - Request body containing email field
     */
    @PostMapping("/public/resend-verification")
    public ResponseEntity<?> resendVerificationEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }
            userService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of(
                "message", "Verification email sent successfully! Please check your inbox."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserDTO> getUserProfile(Principal principal) {
        UserDTO userDTO = userService.getUserProfile(principal.getName());
        return ResponseEntity.ok(userDTO);
    }

    /**
     * Schedule account for deletion with 5-day grace period
     */
    @PostMapping("/account/schedule-deletion")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> scheduleAccountDeletion(Principal principal) {
        userService.scheduleAccountDeletion(principal.getName());
        return ResponseEntity.ok(Map.of(
            "message", "Account scheduled for deletion. You have 5 days to cancel this action.",
            "gracePeriodDays", 5
        ));
    }

    /**
     * Cancel scheduled deletion and recover account
     */
    @PostMapping("/account/cancel-deletion")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelAccountDeletion(Principal principal) {
        userService.cancelAccountDeletion(principal.getName());
        return ResponseEntity.ok(Map.of("message", "Account deletion cancelled. Your account has been recovered."));
    }

    /**
     * Immediately delete account (skips grace period)
     */
    @DeleteMapping("/account")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> deleteUserAccount(Principal principal) {
        userService.deleteUserAccount(principal.getName());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
