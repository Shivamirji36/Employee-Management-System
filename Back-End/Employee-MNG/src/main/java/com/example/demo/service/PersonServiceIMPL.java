package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.Repository.PersonRepository;
import com.example.demo.dto.EmployeeReportDTO;
import com.example.demo.dto.EmployeeReportProjection;
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
        person.setEmployeeId(dto.id != null && !dto.id.isEmpty()
            ? dto.id : generateEmployeeId());
        mapDtoToEntity(dto, person);
        return personRepository.save(person);
    }

    // ===================== GET ALL =====================
    @Override
    public List<Person> getAllEmployees() {
        return personRepository.findAll();
    }

    // ===================== GET BY ID (DB function) =====================
    @Override
    public EmployeeReportDTO getEmployeeById(String id) {
        EmployeeReportProjection projection = personRepository
            .getEmployeeByIdFromFunction(id)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        return mapProjectionToDTO(projection);
    }

    // ===================== UPDATE =====================
    @Override
    public Person updateEmployee(String id, PersonRequestDTO dto) {
        Person existing = findPersonEntity(id);
        mapDtoToEntity(dto, existing);
        return personRepository.save(existing);
    }

    @Override
    public void deleteEmployee(String id) {
        personRepository.delete(findPersonEntity(id));
    }

    // ===================== PRIVATE: Fetch JPA entity (for update/delete) =====================
    private Person findPersonEntity(String id) {
        return personRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
    }

    // ===================== PRIVATE: Map Projection → DTO =====================
    // Projection uses snake_case (matching DB column names), DTO uses camelCase
    private EmployeeReportDTO mapProjectionToDTO(EmployeeReportProjection p) {
        EmployeeReportDTO dto = new EmployeeReportDTO();
        dto.setEmployeeId(safe(p.getEmployee_id()));
        dto.setSalutation(safe(p.getSalutation()));
        dto.setFirstName(safe(p.getFirst_name()));
        dto.setMiddleName(safe(p.getMiddle_name()));
        dto.setLastName(safe(p.getLast_name()));
        dto.setGender(safe(p.getGender()));
        dto.setDob(p.getDob() != null ? p.getDob().toString() : "");
        dto.setMobile(safe(p.getMobile()));
        dto.setEmail(safe(p.getEmail()));
        dto.setDesignation(safe(p.getDesignation()));
        dto.setEmployeeGroup(safe(p.getEmployee_group()));
        dto.setReportingManager(safe(p.getReporting_manager()));
        dto.setDepartment(safe(p.getDepartment()));
        dto.setStatus(safe(p.getStatus()));
        dto.setRelievingDate(p.getRelieving_date() != null ? p.getRelieving_date().toString() : "");
        dto.setSite(safe(p.getSite()));
        dto.setCountry(safe(p.getCountry()));
        dto.setState(safe(p.getState()));
        dto.setCity(safe(p.getCity()));
        dto.setZipCode(safe(p.getZip_code()));
        dto.setAddressLine1(safe(p.getAddress_line1()));
        dto.setAddressLine2(safe(p.getAddress_line2()));
        return dto;
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    // ===================== PRIVATE: Map RequestDTO → Entity =====================
    private void mapDtoToEntity(PersonRequestDTO dto, Person person) {
        person.setSalutation(dto.salutation);
        person.setFirstName(dto.firstName);
        person.setMiddleName(dto.middleName);
        person.setLastName(dto.lastName);
        person.setGender(dto.gender);
        person.setDob(dto.dob);
        person.setMobile(dto.mobile);

        if (dto.personDetails != null) {
            PersonDetails pd = person.getPersonDetails() != null
                ? person.getPersonDetails() : new PersonDetails();
            pd.setEmail(dto.personDetails.getEmail());
            pd.setDesignation(dto.personDetails.getDesignation());
            pd.setEmployeeGroup(dto.personDetails.getEmployeeGroup());
            pd.setReportingManager(dto.personDetails.getReportingManager());
            pd.setDepartment(dto.personDetails.getDepartment());
            pd.setStatus(dto.personDetails.getStatus());
            pd.setRelievingDate(dto.personDetails.getRelievingDate());
            pd.setSite(dto.personDetails.getSite());
            pd.setPerson(person);
            person.setPersonDetails(pd);
        }

        if (dto.address != null) {
            Address addr = person.getAddress() != null
                ? person.getAddress() : new Address();
            addr.setCountry(dto.address.getCountry());
            addr.setState(dto.address.getState());
            addr.setCity(dto.address.getCity());
            addr.setZipCode(dto.address.getZipCode());
            addr.setAddressLine1(dto.address.getAddressLine1());
            addr.setAddressLine2(dto.address.getAddressLine2());
            addr.setPerson(person);
            person.setAddress(addr);
        }
    }

    // ===================== ID GENERATOR =====================
    private String generateEmployeeId() {
        return "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}