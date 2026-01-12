package com.fitness.gateway;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "keycloak")
@Data
public class KeycloakConfig {
    private String authServerUrl;
    private String realm;
    private String clientId;
    private String clientSecret;
    private Admin admin;
    private Registration registration;


    @Data
    public static class Admin {
        private String username;
        private String password;
        private String clientId;
    }

    @Data
    public static class Registration {
        private boolean enabled = true;
        private boolean emailVerificationRequired = true;
        private String defaultRole = "user";
    }

    public String getTokenUrl() {

        return authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    public String getUsersUrl() {

        return authServerUrl + "/admin/realms/" + realm + "/users";
    }

    public String getAdminTokenUrl() {

        return authServerUrl + "/realms/master/protocol/openid-connect/token";
    }

    public String getUserByEmailUrl(String email) {
        return authServerUrl + "/admin/realms/" + realm + "/users?email=" + email;
    }

    public String getSendVerifyEmailUrl(String userId) {
        return authServerUrl + "/admin/realms/" + realm + "/users/" + userId + "/send-verify-email";
    }

    public String getRealmRolesUrl() {
        return authServerUrl + "/admin/realms/" + realm + "/roles";
    }

    public String getUserRoleMappingsUrl(String userId) {
        return authServerUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
    }

}
