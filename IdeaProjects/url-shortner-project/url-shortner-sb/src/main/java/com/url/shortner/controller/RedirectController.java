package com.url.shortner.controller;

import com.url.shortner.models.UrlMapping;
import com.url.shortner.service.UrlMappingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@RestController
@AllArgsConstructor
public class RedirectController {
    private UrlMappingService urlMappingService;

    @GetMapping("/{shortUrl}")
    public ResponseEntity<Void> redirect(@PathVariable String shortUrl, HttpServletRequest request){
        // Generate device fingerprint from IP + User-Agent
        String deviceFingerprint = generateDeviceFingerprint(request);
        
        UrlMapping urlMapping = urlMappingService.getOriginalUrl(shortUrl, deviceFingerprint);
        if(urlMapping != null){
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.add("Location", urlMapping.getOriginalUrl());
            return ResponseEntity.status(302).headers(httpHeaders).build();
        }else{
            return ResponseEntity.notFound().build();
        }
    }
    
    private String generateDeviceFingerprint(HttpServletRequest request) {
        String ip = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        String combined = ip + "|" + (userAgent != null ? userAgent : "");
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(combined.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            // Fallback to simple hash if SHA-256 is not available
            return String.valueOf(combined.hashCode());
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        return request.getRemoteAddr();
    }
}
