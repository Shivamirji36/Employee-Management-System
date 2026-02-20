package com.example.demo.dto;

import java.time.LocalDate;

// JPA cannot map native query results directly to a class DTO.
// This projection interface lets Spring Data map each column by method name.
public interface EmployeeReportProjection {
    String getEmployee_id();
    String getSalutation();
    String getFirst_name();
    String getMiddle_name();
    String getLast_name();
    String getGender();
    LocalDate getDob();
    String getMobile();
    String getEmail();
    String getDesignation();
    String getEmployee_group();
    String getReporting_manager();
    String getDepartment();
    String getStatus();
    LocalDate getRelieving_date();
    String getSite();
    String getCountry();
    String getState();
    String getCity();
    String getZip_code();
    String getAddress_line1();
    String getAddress_line2();
}