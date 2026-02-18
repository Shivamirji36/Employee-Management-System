package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.Repository.PersonRepository;
import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;
import com.example.demo.model.PersonDetails;
import com.example.demo.model.Address;

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
            PersonDetails existingDetails = person.getPersonDetails();
            if (existingDetails != null && existingDetails.getId() != null) {
                existingDetails.setEmail(dto.personDetails.getEmail());
                existingDetails.setDesignation(dto.personDetails.getDesignation());
                existingDetails.setEmployeeGroup(dto.personDetails.getEmployeeGroup());
                existingDetails.setReportingManager(dto.personDetails.getReportingManager());
                existingDetails.setDepartment(dto.personDetails.getDepartment());
                existingDetails.setStatus(dto.personDetails.getStatus());
                existingDetails.setRelievingDate(dto.personDetails.getRelievingDate());
                existingDetails.setSite(dto.personDetails.getSite());
            } else {
                PersonDetails newDetails = new PersonDetails();
                newDetails.setEmail(dto.personDetails.getEmail());
                newDetails.setDesignation(dto.personDetails.getDesignation());
                newDetails.setEmployeeGroup(dto.personDetails.getEmployeeGroup());
                newDetails.setReportingManager(dto.personDetails.getReportingManager());
                newDetails.setDepartment(dto.personDetails.getDepartment());
                newDetails.setStatus(dto.personDetails.getStatus());
                newDetails.setRelievingDate(dto.personDetails.getRelievingDate());
                newDetails.setSite(dto.personDetails.getSite());
                newDetails.setPerson(person);
                person.setPersonDetails(newDetails);
            }
        }

        if (dto.address != null) {
            Address existingAddress = person.getAddress();
            if (existingAddress != null && existingAddress.getId() != null) {
                existingAddress.setCountry(dto.address.getCountry());
                existingAddress.setState(dto.address.getState());
                existingAddress.setCity(dto.address.getCity());
                existingAddress.setZipCode(dto.address.getZipCode());
                existingAddress.setAddressLine1(dto.address.getAddressLine1());
                existingAddress.setAddressLine2(dto.address.getAddressLine2());
            } else {
                Address newAddress = new Address();
                newAddress.setCountry(dto.address.getCountry());
                newAddress.setState(dto.address.getState());
                newAddress.setCity(dto.address.getCity());
                newAddress.setZipCode(dto.address.getZipCode());
                newAddress.setAddressLine1(dto.address.getAddressLine1());
                newAddress.setAddressLine2(dto.address.getAddressLine2());
                newAddress.setPerson(person);
                person.setAddress(newAddress);
            }
        }
    }

    // ===================== ID GENERATOR =====================
    private String generateEmployeeId() {
        return "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
