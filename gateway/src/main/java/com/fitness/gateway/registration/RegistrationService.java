package com.fitness.gateway.registration;

import com.fitness.gateway.KeycloakConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class RegistrationService {

    private final KeycloakConfig keycloakConfig;
    private final RestTemplate restTemplate;  // For external calls (Keycloak)
    private final RestTemplate loadBalancedRestTemplate;  // For internal microservice calls

    public RegistrationService(KeycloakConfig keycloakConfig,
                               RestTemplate restTemplate,
                               @Qualifier("loadBalancedRestTemplate") RestTemplate loadBalancedRestTemplate) {
        this.keycloakConfig = keycloakConfig;
        this.restTemplate = restTemplate;
        this.loadBalancedRestTemplate = loadBalancedRestTemplate;
    }

    public Map<String, Object> registerUser(SelfRegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Step 1: Get admin access token
            String adminToken = getAdminAccessToken();
            log.info("Admin token obtained successfully");

            // Step 2: Check if user already exists
            if (userExistsByEmail(request.getEmail(), adminToken)) {
                response.put("success", false);
                response.put("message", "User with this email already exists");
                return response;
            }

            // Step 3: Create user in Keycloak
            String userId = createKeycloakUser(request, adminToken);
            log.info("User created in Keycloak with ID: {}", userId);

            // Step 4: Set user password
            setUserPassword(userId, request.getPassword(), adminToken);
            log.info("Password set for user: {}", userId);

            // Step 5: Assign default role
            try {
                assignDefaultRole(userId, adminToken);
                log.info("Default role assigned to user: {}", userId);
            } catch (Exception e) {
                log.warn("Could not assign default role: {}", e.getMessage());
            }

            // Step 6: Send verification email (only if enabled and SMTP is configured)
            boolean emailSent = false;
            if (keycloakConfig.getRegistration().isEmailVerificationRequired()) {
                try {
                    sendVerificationEmail(userId, adminToken);
                    emailSent = true;
                    log.info("Verification email sent to user: {}", userId);
                } catch (Exception e) {
                    log.warn("Could not send verification email (SMTP may not be configured): {}", e.getMessage());
                    // Don't fail registration if email sending fails
                }
            }

            // Step 7: Sync user to local database
            try {
                syncUserToLocalDatabase(request, userId);
                log.info("User synced to local database");
            } catch (Exception e) {
                log.warn("Could not sync user to local database: {}", e.getMessage());
            }

            response.put("success", true);
            response.put("userId", userId);

            if (keycloakConfig.getRegistration().isEmailVerificationRequired() && emailSent) {
                response.put("message", "Registration successful. Please check your email to verify your account.");
                response.put("emailVerificationRequired", true);
            } else if (keycloakConfig.getRegistration().isEmailVerificationRequired() && !emailSent) {
                response.put("message", "Registration successful. Email verification is required but could not send email. Please contact support or try logging in.");
                response.put("emailVerificationRequired", true);
                response.put("emailSendFailed", true);
            } else {
                response.put("message", "Registration successful. You can now login.");
                response.put("emailVerificationRequired", false);
            }

        } catch (HttpClientErrorException e) {
            log.error("Keycloak API error during registration: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            response.put("success", false);
            response.put("message", "Registration failed: " + parseKeycloakError(e.getResponseBodyAsString()));
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
        }

        return response;
    }

    private String parseKeycloakError(String responseBody) {
        try {
            if (responseBody.contains("errorMessage")) {
                int start = responseBody.indexOf("errorMessage") + 15;
                int end = responseBody.indexOf("\"", start);
                return responseBody.substring(start, end);
            }
            return "Unknown error";
        } catch (Exception e) {
            return "Unknown error";
        }
    }

    private String getAdminAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", keycloakConfig.getAdmin().getClientId());
        body.add("username", keycloakConfig.getAdmin().getUsername());
        body.add("password", keycloakConfig.getAdmin().getPassword());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        String tokenUrl = keycloakConfig.getAdminTokenUrl();
        log.debug("Getting admin token from: {}", tokenUrl);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                tokenUrl,
                request,
                Map.class
        );

        if (response.getBody() == null || !response.getBody().containsKey("access_token")) {
            throw new RuntimeException("Failed to get admin access token");
        }

        return (String) response.getBody().get("access_token");
    }

    private boolean userExistsByEmail(String email, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    keycloakConfig.getUserByEmailUrl(email),
                    HttpMethod.GET,
                    request,
                    List.class
            );
            return response.getBody() != null && !response.getBody().isEmpty();
        } catch (Exception e) {
            log.warn("Error checking if user exists: {}", e.getMessage());
            return false;
        }
    }

    private String createKeycloakUser(SelfRegisterRequest registerRequest, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> userRepresentation = new HashMap<>();
        userRepresentation.put("username", registerRequest.getEmail());
        userRepresentation.put("email", registerRequest.getEmail());
        userRepresentation.put("firstName", registerRequest.getFirstName());
        userRepresentation.put("lastName", registerRequest.getLastName());
        userRepresentation.put("enabled", true);

        // If email verification is not required, mark email as verified
        userRepresentation.put("emailVerified", !keycloakConfig.getRegistration().isEmailVerificationRequired());

        Map<String, List<String>> attributes = new HashMap<>();
        if (registerRequest.getPhoneNumber() != null && !registerRequest.getPhoneNumber().isEmpty()) {
            attributes.put("phoneNumber", Collections.singletonList(registerRequest.getPhoneNumber()));
        }
        attributes.put("registrationType", Collections.singletonList("self-registration"));
        userRepresentation.put("attributes", attributes);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(userRepresentation, headers);

        ResponseEntity<Void> response = restTemplate.postForEntity(
                keycloakConfig.getUsersUrl(),
                request,
                Void.class
        );

        // Extract user ID from Location header
        if (response.getHeaders().getLocation() == null) {
            throw new RuntimeException("User created but could not get user ID from response");
        }

        String location = response.getHeaders().getLocation().toString();
        return location.substring(location.lastIndexOf("/") + 1);
    }

    private void setUserPassword(String userId, String password, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> credentials = new HashMap<>();
        credentials.put("type", "password");
        credentials.put("value", password);
        credentials.put("temporary", false);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(credentials, headers);

        String passwordUrl = keycloakConfig.getUsersUrl() + "/" + userId + "/reset-password";
        restTemplate.put(passwordUrl, request);
    }

    private void assignDefaultRole(String userId, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        // Get the default role
        HttpEntity<Void> getRequest = new HttpEntity<>(headers);
        ResponseEntity<List> rolesResponse = restTemplate.exchange(
                keycloakConfig.getRealmRolesUrl(),
                HttpMethod.GET,
                getRequest,
                List.class
        );

        if (rolesResponse.getBody() == null || rolesResponse.getBody().isEmpty()) {
            log.warn("No roles found in realm");
            return;
        }

        String defaultRoleName = keycloakConfig.getRegistration().getDefaultRole();
        Map<String, Object> defaultRole = null;

        for (Object role : rolesResponse.getBody()) {
            Map<String, Object> roleMap = (Map<String, Object>) role;
            if (defaultRoleName.equals(roleMap.get("name"))) {
                defaultRole = roleMap;
                break;
            }
        }

        if (defaultRole != null) {
            List<Map<String, Object>> roles = Collections.singletonList(defaultRole);
            HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(roles, headers);

            restTemplate.postForEntity(
                    keycloakConfig.getUserRoleMappingsUrl(userId),
                    assignRequest,
                    Void.class
            );
        } else {
            log.warn("Default role '{}' not found in realm", defaultRoleName);
        }
    }

    private void sendVerificationEmail(String userId, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        String verifyEmailUrl = keycloakConfig.getSendVerifyEmailUrl(userId);
        log.debug("Sending verification email using URL: {}", verifyEmailUrl);

        restTemplate.put(verifyEmailUrl, request);
        log.info("Verification email request sent for user: {}", userId);
    }

    private void syncUserToLocalDatabase(SelfRegisterRequest registerRequest, String keycloakUserId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> userDto = new HashMap<>();
        userDto.put("keycloakId", keycloakUserId);
        userDto.put("email", registerRequest.getEmail());
        userDto.put("firstName", registerRequest.getFirstName());
        userDto.put("lastName", registerRequest.getLastName());
        userDto.put("phoneNumber", registerRequest.getPhoneNumber());
        userDto.put("role", "USER");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(userDto, headers);

        try {
            // Use load-balanced RestTemplate for internal service calls
            loadBalancedRestTemplate.postForEntity(
                    "http://USER-SERVICE/api/users/sync",
                    request,
                    Void.class
            );
        } catch (Exception e) {
            log.warn("Could not sync user to local database (user service may not be available): {}", e.getMessage());
        }
    }

    public Map<String, Object> resendVerificationEmail(String email) {
        Map<String, Object> response = new HashMap<>();

        try {
            String adminToken = getAdminAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<List> usersResponse = restTemplate.exchange(
                    keycloakConfig.getUserByEmailUrl(email),
                    HttpMethod.GET,
                    request,
                    List.class
            );

            if (usersResponse.getBody() == null || usersResponse.getBody().isEmpty()) {
                response.put("success", false);
                response.put("message", "User not found with this email");
                return response;
            }

            Map<String, Object> user = (Map<String, Object>) usersResponse.getBody().get(0);
            String userId = (String) user.get("id");

            // Check if email is already verified
            Boolean emailVerified = (Boolean) user.get("emailVerified");
            if (Boolean.TRUE.equals(emailVerified)) {
                response.put("success", false);
                response.put("message", "Email is already verified. You can login now.");
                return response;
            }

            sendVerificationEmail(userId, adminToken);

            response.put("success", true);
            response.put("message", "Verification email sent successfully. Please check your inbox.");

        } catch (HttpClientErrorException e) {
            log.error("Failed to resend verification email: {}", e.getResponseBodyAsString());
            response.put("success", false);
            response.put("message", "Failed to send verification email. SMTP may not be configured properly.");
        } catch (Exception e) {
            log.error("Failed to resend verification email: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to send verification email: " + e.getMessage());
        }

        return response;
    }
}
