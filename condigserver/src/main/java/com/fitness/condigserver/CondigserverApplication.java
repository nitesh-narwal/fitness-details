package com.fitness.condigserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer
public class CondigserverApplication {

	public static void main(String[] args) {
		SpringApplication.run(CondigserverApplication.class, args);
	}

}
