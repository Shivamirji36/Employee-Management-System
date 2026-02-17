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
        
        // Set basic person details from DTO
        person.setSalutation(dto.salutation);
        person.setFirstName(dto.firstName);
        person.setMiddleName(dto.middleName);
        person.setLastName(dto.lastName);
        person.setGender(dto.gender);
        person.setDob(dto.dob);
        person.setMobile(dto.mobile);

        // Set PersonDetails with bidirectional relationship
        if (dto.personDetails != null) {
            dto.personDetails.setPerson(person);  // Set back-reference
            person.setPersonDetails(dto.personDetails);
        }

        // Set Address with bidirectional relationship
        if (dto.address != null) {
            dto.address.setPerson(person);  // Set back-reference
            person.setAddress(dto.address);
        }

        return personRepository.save(person);
    }
}
