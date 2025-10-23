package com.example.activityservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserValidationService {

    private final WebClient userServiceWebClient;


    public boolean validateUser(String userId) {
        log.info("Calling user service for {}", userId);
       try {
            Boolean result = userServiceWebClient.get()
                   .uri("/api/users/{userId}/validate", userId)
                   .retrieve()
                   .bodyToMono(Boolean.class)
                   .block();
            return Boolean.TRUE.equals(result);

       }catch (WebClientResponseException e){
           e.printStackTrace();
       }
        return false;
    }
}
