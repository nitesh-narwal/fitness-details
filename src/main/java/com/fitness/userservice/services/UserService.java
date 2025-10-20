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
            throw new RuntimeException("Email already exists");

        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        User savedUser = repository.save(user);
        UserResponse userResponse = new UserResponse();
        userResponse.setId(savedUser.getId());
        userResponse.setEmail(savedUser.getEmail());
        userResponse.setPassword(savedUser.getPassword());
        userResponse.setFirstName(savedUser.getFirstName());
        userResponse.setLastName(savedUser.getLastName());
        userResponse.setCreated(savedUser.getCreated());
        userResponse.setUpdated(savedUser.getUpdated());

        return userResponse;

        /*try {
            savedUser = repository.save(user);
            userResponsee.setId(String.valueOf(savedUser.getId()));
            userResponsee.setEmail(savedUser.getEmail());
            userResponsee.setFirstName(savedUser.getFirstName());
            userResponsee.setLastName(savedUser.getLastName());
            userResponsee.setCreated(savedUser.getCreated());
            userResponsee.setUpdated(savedUser.getUpdated());
        } catch (Exception e) {
            System.out.println("Error saving user: " + e.getMessage());
        }
       */

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
        return repository.existsById(userId);
    }
}
