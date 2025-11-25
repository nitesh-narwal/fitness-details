package com.example.activityservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing  // Enable auditing for createdAt and updatedAt fields
public class MongoConfig {


}
