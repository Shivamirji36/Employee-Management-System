package com.example.Controller;

import com.example.dto.*;
import com.example.model.Person;
import com.example.service.*;
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
