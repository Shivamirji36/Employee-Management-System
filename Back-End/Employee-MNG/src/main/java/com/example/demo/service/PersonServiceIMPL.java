package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.Repository.PersonRepository;
import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;

import java.util.List;
import java.util.UUID;

@Service
public class PersonServiceIMPL implements PersonService {

    private final PersonRepository personRepository;

    public PersonServiceIMPL(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    // ===================== CREATE =====================
    @Override
    public Person savePerson(PersonRequestDTO dto) {

        Person person = new Person();

        // Set employee ID from DTO
        if (dto.id != null && !dto.id.isEmpty()) {
            person.setEmployeeId(dto.id);
        } else {
            person.setEmployeeId(generateEmployeeId());
        }

        mapDtoToEntity(dto, person);

        return personRepository.save(person);
    }

    // ===================== GET ALL =====================
    @Override
    public List<Person> getAllEmployees() {
        return personRepository.findAll();
    }

    // ===================== GET BY ID =====================
    @Override
    public Person getEmployeeById(String id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    // ===================== UPDATE =====================
    @Override
    public Person updateEmployee(String id, PersonRequestDTO dto) {

        Person existingPerson = getEmployeeById(id);

        mapDtoToEntity(dto, existingPerson);

        return personRepository.save(existingPerson);
    }

    // ===================== DELETE =====================
    @Override
    public void deleteEmployee(String id) {

        Person person = getEmployeeById(id);
        personRepository.delete(person);
    }

    // ===================== COMMON MAPPING METHOD =====================
    private void mapDtoToEntity(PersonRequestDTO dto, Person person) {

        person.setSalutation(dto.salutation);
        person.setFirstName(dto.firstName);
        person.setMiddleName(dto.middleName);
        person.setLastName(dto.lastName);
        person.setGender(dto.gender);
        person.setDob(dto.dob);
        person.setMobile(dto.mobile);

        if (dto.personDetails != null) {
            dto.personDetails.setPerson(person);
            person.setPersonDetails(dto.personDetails);
        }

        if (dto.address != null) {
            dto.address.setPerson(person);
            person.setAddress(dto.address);
        }
    }

    // ===================== ID GENERATOR =====================
    private String generateEmployeeId() {
        return "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
