package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "person_details")
public class PersonDetails {

	
	 @Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	 private Long id;

	 private String emailId;
	 private String designation;
	 private String employeeGroup;
	 private String reportingManager;
	 private String department;
	 private String status;
	 private LocalDate relievingDate;
	 private String defaultStatus;

	 @OneToOne
	 @JoinColumn(name = "employee_id")
	 private Person person;
	 
	 //Getters and Setters

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEmailId() {
		return emailId;
	}

	public void setEmailId(String emailId) {
		this.emailId = emailId;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public String getEmployeeGroup() {
		return employeeGroup;
	}

	public void setEmployeeGroup(String employeeGroup) {
		this.employeeGroup = employeeGroup;
	}

	public String getReportingManager() {
		return reportingManager;
	}

	public void setReportingManager(String reportingManager) {
		this.reportingManager = reportingManager;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDate getRelievingDate() {
		return relievingDate;
	}

	public void setRelievingDate(LocalDate relievingDate) {
		this.relievingDate = relievingDate;
	}

	public String getDefaultStatus() {
		return defaultStatus;
	}

	public void setDefaultStatus(String defaultStatus) {
		this.defaultStatus = defaultStatus;
	}

	public Person getPerson() {
		return person;
	}

	public void setPerson(Person person) {
		this.person = person;
	}
	 
	 
}
