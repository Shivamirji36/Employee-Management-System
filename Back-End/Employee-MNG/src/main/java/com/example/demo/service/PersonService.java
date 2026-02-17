package com.example.demo.service;

import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;

public interface PersonService {
	
	Person savePerson(PersonRequestDTO dto); 	

}
 