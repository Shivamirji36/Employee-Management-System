package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.Repository.PersonRepository;
import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;

@Service
public class PersonServiceIMPL implements PersonService {

	private final PersonRepository personRepository;

    public PersonServiceIMPL(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    @Override
    public Person savePerson(PersonRequestDTO dto) {

        Person person = new Person();

        person.setPersonDetails(dto.personDetails);
        person.setAddress(dto.address);

        return personRepository.save(person);
    }
}
