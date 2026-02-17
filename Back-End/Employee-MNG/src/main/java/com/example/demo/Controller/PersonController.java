package com.example.demo.Controller;

import com.example.demo.dto.*;
import com.example.demo.model.Person;
import com.example.demo.service.*;

import org.springframework.web.bind.annotation.*;

public class PersonController {
	
	private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @PostMapping
    public Person savePerson(@RequestBody PersonRequestDTO dto) {

        return personService.savePerson(dto);
    }

}
