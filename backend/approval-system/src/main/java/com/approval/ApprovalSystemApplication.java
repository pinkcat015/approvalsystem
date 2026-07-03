package com.approval;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ApprovalSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApprovalSystemApplication.class, args);
	}

}
