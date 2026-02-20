package com.example.demo.service;

import com.example.demo.model.Person;
import com.example.demo.Repository.PersonRepository;
import net.sf.jasperreports.engine.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class JasperReportService {

    @Autowired
    private PersonRepository personRepository;

    public byte[] generateEmployeeReport(String employeeId) throws Exception {

        // 1. Fetch Person (with nested PersonDetails and Address via JPA)
        Person person = personRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        // 2. Build flat parameters map — safely handle nulls
        Map<String, Object> params = new HashMap<>();

        // Person fields
        params.put("employeeId",  safeStr(person.getEmployeeId()));
        params.put("salutation",  safeStr(person.getSalutation()));
        params.put("firstName",   safeStr(person.getFirstName()));
        params.put("middleName",  safeStr(person.getMiddleName()));
        params.put("lastName",    safeStr(person.getLastName()));
        params.put("gender",      safeStr(person.getGender()));
        params.put("dob",         person.getDob() != null ? person.getDob().toString() : "N/A");
        params.put("mobile",      safeStr(person.getMobile()));

        // PersonDetails fields (null-safe)
        if (person.getPersonDetails() != null) {
            params.put("email",            safeStr(person.getPersonDetails().getEmail()));
            params.put("designation",      safeStr(person.getPersonDetails().getDesignation()));
            params.put("employeeGroup",    safeStr(person.getPersonDetails().getEmployeeGroup()));
            params.put("reportingManager", safeStr(person.getPersonDetails().getReportingManager()));
            params.put("department",       safeStr(person.getPersonDetails().getDepartment()));
            params.put("status",           safeStr(person.getPersonDetails().getStatus()));
            params.put("relievingDate",    person.getPersonDetails().getRelievingDate() != null
                                            ? person.getPersonDetails().getRelievingDate().toString() : "N/A");
            params.put("site",             safeStr(person.getPersonDetails().getSite()));
        } else {
            // Fill blanks if no PersonDetails exists
            for (String key : new String[]{"email","designation","employeeGroup",
                    "reportingManager","department","status","relievingDate","site"}) {
                params.put(key, "N/A");
            }
        }

        // Address fields (null-safe)
        if (person.getAddress() != null) {
            params.put("country",      safeStr(person.getAddress().getCountry()));
            params.put("state",        safeStr(person.getAddress().getState()));
            params.put("city",         safeStr(person.getAddress().getCity()));
            params.put("zipCode",      safeStr(person.getAddress().getZipCode()));
            params.put("addressLine1", safeStr(person.getAddress().getAddressLine1()));
            params.put("addressLine2", safeStr(person.getAddress().getAddressLine2()));
        } else {
            for (String key : new String[]{"country","state","city",
                    "zipCode","addressLine1","addressLine2"}) {
                params.put(key, "N/A");
            }
        }

        // 3. Load and compile the .jrxml
        InputStream reportStream = getClass()
            .getResourceAsStream("/reports/EmployeeDetails.jrxml");

        if (reportStream == null) {
            throw new RuntimeException("Report file not found at /reports/EmployeeDetails.jrxml");
        }

        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

        // 4. Fill report — JREmptyDataSource since we use only Parameters
        JasperPrint jasperPrint = JasperFillManager.fillReport(
            jasperReport, params, new JREmptyDataSource()
        );

        // 5. Export to PDF bytes
        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    // Helper to avoid null pointer in string concatenation inside Jasper
    private String safeStr(String value) {
        return value != null ? value : "";
    }
}