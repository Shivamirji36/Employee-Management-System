package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EmployeeMngApplication {

	public static void main(String[] args) {
		System.setProperty("java.awt.headless", "true");
		SpringApplication.run(EmployeeMngApplication.class, args);
	}

}
