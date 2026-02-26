package com.example.demo.service;

import com.example.demo.dto.EmployeeReportDTO;
import com.example.demo.model.Address;
import com.example.demo.model.Person;
import com.example.demo.model.PersonDetails;

import jakarta.annotation.PostConstruct;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import net.sf.jasperreports.engine.util.JRLoader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JasperReportService {

    private static final Logger log = LoggerFactory.getLogger(JasperReportService.class);

    private final PersonService personService;

    private JasperReport allEmployeesReport;
    private JasperReport employeeDetailsReport;

    public JasperReportService(PersonService personService) {
        this.personService = personService;
    }

    // ─────────────────────────────────────────────────────
    // STARTUP — runs once when Spring boots
    // App will REFUSE TO START if any report file is missing
    // ─────────────────────────────────────────────────────
    @PostConstruct
    public void loadReports() {
        allEmployeesReport = compileReport("/reports/AllEmployees.jrxml");
        employeeDetailsReport = compileReport("/reports/EmployeeDetails.jrxml");
    }

    private JasperReport compileReport(String classpathPath) {
        // Try loading pre-compiled .jasper first (faster + less memory)
        String jasperPath = classpathPath.replace(".jrxml", ".jasper");
        InputStream jasperStream = getClass().getResourceAsStream(jasperPath);

        if (jasperStream != null) {
            try {
                log.info("Loading pre-compiled report: {}", jasperPath);
                return (JasperReport) JRLoader.loadObject(jasperStream);
            } catch (JRException e) {
                log.warn("Failed to load .jasper, falling back to .jrxml: {}", jasperPath);
            }
        }

        // Fallback: compile from jrxml
        InputStream stream = getClass().getResourceAsStream(classpathPath);
        if (stream == null) {
            throw new IllegalStateException(
                    "Report not found on classpath: " + classpathPath);
        }
        try {
            log.info("Compiling report from jrxml: {}", classpathPath);
            return JasperCompileManager.compileReport(stream);
        } catch (JRException e) {
            throw new IllegalStateException("Failed to compile: " + classpathPath, e);
        }
    }

    // ─────────────────────────────────────────────────────
    // INDIVIDUAL EMPLOYEE REPORT
    // ─────────────────────────────────────────────────────
    public byte[] generateEmployeeReport(String employeeId) throws Exception {
        EmployeeReportDTO emp = personService.getEmployeeById(employeeId);

        if (emp == null) {
            throw new IllegalArgumentException("Employee not found: " + employeeId);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("employeeId", nullSafe(emp.getEmployeeId()));
        params.put("salutation", nullSafe(emp.getSalutation()));
        params.put("firstName", nullSafe(emp.getFirstName()));
        params.put("middleName", nullSafe(emp.getMiddleName()));
        params.put("lastName", nullSafe(emp.getLastName()));
        params.put("gender", nullSafe(emp.getGender()));
        params.put("dob", nullSafe(emp.getDob()));
        params.put("mobile", nullSafe(emp.getMobile()));
        params.put("email", nullSafe(emp.getEmail()));
        params.put("designation", nullSafe(emp.getDesignation()));
        params.put("employeeGroup", nullSafe(emp.getEmployeeGroup()));
        params.put("reportingManager", nullSafe(emp.getReportingManager()));
        params.put("department", nullSafe(emp.getDepartment()));
        params.put("status", nullSafe(emp.getStatus()));
        params.put("relievingDate", nullSafe(emp.getRelievingDate()));
        params.put("site", nullSafe(emp.getSite()));
        params.put("country", nullSafe(emp.getCountry()));
        params.put("state", nullSafe(emp.getState()));
        params.put("city", nullSafe(emp.getCity()));
        params.put("zipCode", nullSafe(emp.getZipCode()));
        params.put("addressLine1", nullSafe(emp.getAddressLine1()));
        params.put("addressLine2", nullSafe(emp.getAddressLine2()));

        log.info("Generating individual report for: {}", employeeId);

        JasperPrint jasperPrint = JasperFillManager.fillReport(
                employeeDetailsReport,
                params,
                new JREmptyDataSource());

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    // ─────────────────────────────────────────────────────
    // ALL EMPLOYEES REPORT
    // ─────────────────────────────────────────────────────
    public byte[] generateAllEmployeesReport() throws Exception {
        log.info("Generating all employees report");

        // 1. Fetch all employees via existing service
        List<Person> employees = personService.getAllEmployees();

        // 2. Map each Person (+ nested PersonDetails + Address) into a flat row
        Collection<Map<String, ?>> dataList = new ArrayList<>();
        for (Person emp : employees) {
            PersonDetails details = emp.getPersonDetails(); // may be null
            Address address = emp.getAddress(); // may be null

            Map<String, Object> row = new HashMap<>();

            // From Person
            row.put("employeeId", nullSafe(emp.getEmployeeId()));
            row.put("salutation", nullSafe(emp.getSalutation()));
            row.put("firstName", nullSafe(emp.getFirstName()));
            row.put("middleName", nullSafe(emp.getMiddleName()));
            row.put("lastName", nullSafe(emp.getLastName()));
            row.put("gender", nullSafe(emp.getGender()));
            row.put("dob", emp.getDob() != null ? emp.getDob().toString() : "");
            row.put("mobile", nullSafe(emp.getMobile()));

            // From PersonDetails (null-safe)
            row.put("email", details != null ? nullSafe(details.getEmail()) : "");
            row.put("designation", details != null ? nullSafe(details.getDesignation()) : "");
            row.put("employeeGroup", details != null ? nullSafe(details.getEmployeeGroup()) : "");
            row.put("reportingManager", details != null ? nullSafe(details.getReportingManager()) : "");
            row.put("department", details != null ? nullSafe(details.getDepartment()) : "");
            row.put("status", details != null ? nullSafe(details.getStatus()) : "");
            row.put("relievingDate", details != null && details.getRelievingDate() != null
                    ? details.getRelievingDate().toString()
                    : "");
            row.put("site", details != null ? nullSafe(details.getSite()) : "");

            // From Address (null-safe)
            row.put("country", address != null ? nullSafe(address.getCountry()) : "");
            row.put("state", address != null ? nullSafe(address.getState()) : "");
            row.put("city", address != null ? nullSafe(address.getCity()) : "");
            row.put("zipCode", address != null ? nullSafe(address.getZipCode()) : "");
            row.put("addressLine1", address != null ? nullSafe(address.getAddressLine1()) : "");
            row.put("addressLine2", address != null ? nullSafe(address.getAddressLine2()) : "");

            dataList.add(row);
        }

        // 3. Wrap in datasource and fill report
        JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataList);

        JasperPrint jasperPrint = JasperFillManager.fillReport(
                allEmployeesReport,
                new HashMap<>(),
                dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    // ─────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────
    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
