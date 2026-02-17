package com.example.demo.dto;

import java.time.LocalDate;

import com.example.demo.model.Address;
import com.example.demo.model.PersonDetails;

public class PersonRequestDTO {

	public String salutation;
    public String firstName;
    public String middleName;
    public String lastName;
    public String gender;
    public LocalDate dob;
    public String mobile;

    public PersonDetails personDetails;
    public Address address;
    public Object employeeId;
}
