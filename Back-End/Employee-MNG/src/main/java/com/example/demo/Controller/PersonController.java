package com.example.demo.Controller;

import com.example.demo.dto.PersonRequestDTO;
import com.example.demo.model.Person;
import com.example.demo.service.PersonService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200", 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true")
@RestController
@RequestMapping("/api/employees")
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @PostMapping
    public Person createEmployee(@RequestBody PersonRequestDTO dto) {
        System.out.println("Received POST request: " + dto);
        return personService.savePerson(dto);
    }

    @GetMapping
    public List<Person> getAllEmployees() {
        return personService.getAllEmployees();
    }

    @GetMapping("/{employeeId}")
    public Person getEmployeeById(@PathVariable String employeeId) {
        return personService.getEmployeeById(employeeId);
    }

    @PutMapping("/{employeeId}")
    public Person updateEmployee(
            @PathVariable String employeeId,
            @RequestBody PersonRequestDTO dto) {
        return personService.updateEmployee(employeeId, dto);
    }

    @DeleteMapping("/{employeeId}")
    public void deleteEmployee(@PathVariable String employeeId) {
        personService.deleteEmployee(employeeId);
    }
}
