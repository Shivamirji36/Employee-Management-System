package com.example.demo.service;

import com.example.demo.dto.EmployeeReportDTO;
import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;
import java.util.List;

public interface PersonService {
    Person savePerson(PersonRequestDTO dto);
    List<Person> getAllEmployees();
    EmployeeReportDTO getEmployeeById(String id);  // returns DTO from DB function
    Person updateEmployee(String id, PersonRequestDTO dto);
    void deleteEmployee(String id);
}