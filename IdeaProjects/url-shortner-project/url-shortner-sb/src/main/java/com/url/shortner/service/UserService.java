package com.url.shortner.service;

import com.url.shortner.dtos.LoginRequest;
import com.url.shortner.dtos.UserDTO;
import com.url.shortner.models.User;
import com.url.shortner.repository.UserRepository;
import com.url.shortner.security.jwt.JwtAuthenticationResponse;
import com.url.shortner.security.jwt.JwtUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * UserService - Handles user management including registration, authentication, and email verification
 *
 * EMAIL VERIFICATION FLOW:
 * 1. registerUser() - Creates user with emailVerified=false, generates token, sends email
 * 2. verifyEmail() - Validates token, sets emailVerified=true
 * 3. resendVerificationEmail() - Generates new token and sends email again
 * 4. authenticateUser() - Checks if email is verified before allowing login
 */
@Service
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UrlMappingService urlMappingService;
    private final EmailService emailService;
    private final String frontendUrl;

    public UserService(
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils,
            UrlMappingService urlMappingService,
            EmailService emailService,
            @Value("${frontend.url}") String frontendUrl) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.urlMappingService = urlMappingService;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Registers a new user and sends verification email
     * Flow: Validate → Create User → Generate Token → Send Email
     *
     * @param user - User object with registration details
     * @return User - Saved user object
     */
    @Transactional
    public User registerUser(User user) {
        // Check for existing username
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists: " + user.getUsername());
        }
        // Check for existing email
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }

        // Set password encoded
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Email verification setup
        user.setEmailVerified(false);
        String verificationToken = generateVerificationToken();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusDays(7)); // Token valid for 7 days

        // Save user first
        User savedUser = userRepository.save(user);

        // Send verification email - don't fail registration if email fails
        try {
            String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
            emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationLink);
        } catch (Exception e) {
            // Log the error but don't fail registration
            // User can request resend verification email later
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return savedUser;
    }

    /**
     * Generates a unique verification token
     * Uses UUID for uniqueness
     */
    private String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * Verifies user email using the token from verification link
     *
     * @param token - Verification token from email link
     * @return boolean - true if verification successful
     */
    @Transactional
    public boolean verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or already used verification token. If you've already verified your email, please login."));

        // Check if already verified first (before checking expiry)
        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified. Please login.");
        }

        // Check if token is expired
        if (user.getVerificationTokenExpiry() != null && user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired. Please use the 'Resend Verification Email' option with email: " + user.getEmail());
        }

        // Verify the email
        user.setEmailVerified(true);
        user.setVerificationToken(null); // Clear the token after use
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return true;
    }

    /**
     * Resends verification email with a new token
     * Used when user requests new verification link
     *
     * @param email - User's email address
     */
    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified. Please login.");
        }

        // Generate new token
        String newToken = generateVerificationToken();
        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusDays(7)); // Token valid for 7 days
        userRepository.save(user);

        // Send new verification email
        String verificationLink = frontendUrl + "/verify-email?token=" + newToken;
        emailService.resendVerificationEmail(user.getEmail(), user.getUsername(), verificationLink);
    }

    /**
     * Authenticates user and returns JWT token
     * Checks if email is verified before allowing login
     */
    public JwtAuthenticationResponse authenticateUser(LoginRequest loginRequest) {
        // First check if user exists and email is verified
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in. Check your inbox for the verification link.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                        loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateToken(userDetails);
        return new JwtAuthenticationResponse(jwt, userDetails.getUsername(), userDetails.getEmail());
    }

    public User getUserByUsername(String name) {
         return userRepository.findByUsername(name).orElseThrow(
                 () -> new UsernameNotFoundException("Username not found with the username: " + name)
         );
    }

    public UserDTO getUserProfile(String username) {
        User user = getUserByUsername(username);
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(user.getRole());
        userDTO.setEmailVerified(user.isEmailVerified());
        userDTO.setDeleted(user.isDeleted());
        userDTO.setDeletionScheduledAt(user.getDeletionScheduledAt());
        userDTO.setDeletionDate(user.getDeletionDate());
        return userDTO;
    }

    /**
     * Schedule account for deletion with 5-day grace period (soft delete)
     */
    @Transactional
    public void scheduleAccountDeletion(String username) {
        User user = getUserByUsername(username);
        user.setDeleted(true);
        user.setDeletionScheduledAt(LocalDateTime.now());
        user.setDeletionDate(LocalDateTime.now().plusDays(5));  // 5-day grace period
        userRepository.save(user);
    }

    /**
     * Cancel scheduled deletion and recover the account
     */
    @Transactional
    public void cancelAccountDeletion(String username) {
        User user = getUserByUsername(username);
        if (!user.isDeleted()) {
            throw new RuntimeException("Account is not scheduled for deletion");
        }
        user.setDeleted(false);
        user.setDeletionScheduledAt(null);
        user.setDeletionDate(null);
        userRepository.save(user);
    }

    /**
     * Permanently delete user account (called by scheduler after grace period)
     */
    @Transactional
    public void deleteUserAccount(String username) {
        User user = getUserByUsername(username);
        // Delete all URLs associated with the user (cascade will handle click events and device accesses)
        urlMappingService.deleteAllUrlsByUser(user);
        // Delete the user
        userRepository.delete(user);
    }

    /**
     * Permanently delete user account by ID (used by cleanup scheduler)
     */
    @Transactional
    public void deleteUserAccountById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        urlMappingService.deleteAllUrlsByUser(user);
        userRepository.delete(user);
    }
}
