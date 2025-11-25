package com.fitness.userservice.services;

import com.fitness.userservice.UserRepository;
import com.fitness.userservice.dto.RegisterRequest;
import com.fitness.userservice.dto.UserResponse;
import com.fitness.userservice.models.User;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class UserService
{

    private final  UserRepository repository;

    public UserResponse register(RegisterRequest request) {

        if (repository.existsByEmail(request.getEmail())){
            User existingUser = repository.findByEmail(request.getEmail());
            UserResponse userResponse = new UserResponse();
            userResponse.setId(existingUser.getId());
            userResponse.setEmail(existingUser.getEmail());
            userResponse.setPassword(existingUser.getPassword());
            userResponse.setFirstName(existingUser.getFirstName());
            userResponse.setLastName(existingUser.getLastName());
            userResponse.setCreated(existingUser.getCreated());
            userResponse.setUpdated(existingUser.getUpdated());

            return userResponse;

        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setKeycloakId(request.getKeycloakId() );
        user.setPassword(request.getPassword());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        User savedUser = repository.save(user);
        UserResponse userResponse = new UserResponse();
        userResponse.setId(savedUser.getId());
        userResponse.setKeycloakId(savedUser.getKeycloakId());
        userResponse.setEmail(savedUser.getEmail());
        userResponse.setPassword(savedUser.getPassword());
        userResponse.setFirstName(savedUser.getFirstName());
        userResponse.setLastName(savedUser.getLastName());
        userResponse.setCreated(savedUser.getCreated());
        userResponse.setUpdated(savedUser.getUpdated());

        return userResponse;

    }

    public UserResponse getUserProfile(String userId) {
        User user = repository.findById(userId)
                .orElseThrow(() -> new RuntimeException(("User not found :)")));
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());
        userResponse.setPassword(user.getPassword());
        userResponse.setFirstName(user.getFirstName());
        userResponse.setLastName(user.getLastName());
        userResponse.setCreated(user.getCreated());
        userResponse.setUpdated(user.getUpdated());

        return userResponse;
    }

    public Boolean existByUserId(String userId) {
        log.info("Calling user service for {}", userId);
        return repository.existsByKeycloakId(userId);
    }
}
