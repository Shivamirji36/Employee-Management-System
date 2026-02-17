package com.example.demo.service;

import java.util.List;
import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;

public interface PersonService {
	
	Person savePerson(PersonRequestDTO dto); 
		
	List<Person> getAllEmployees();

    Person getEmployeeById(String id);

    Person updateEmployee(String id, PersonRequestDTO dto);

    void deleteEmployee(String id);

}
 