package com.example.demo.service;

import com.example.demo.dto.EmployeeReportDTO;

import jakarta.annotation.PostConstruct;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.util.JRLoader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;

@Service
public class JasperReportService {

    private static final Logger log = LoggerFactory.getLogger(JasperReportService.class);

    private final PersonService personService;
    private final DataSource dataSource; // ✅ Fix 4: now final

    // Declared at top for clarity
    private JasperReport allEmployeesReport;
    private JasperReport employeeDetailsReport;

    public JasperReportService(PersonService personService, DataSource dataSource) {
        this.personService = personService;
        this.dataSource = dataSource;
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
        // ✅ Try loading pre-compiled .jasper first (faster + less memory)
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

        // ✅ Fix 3: null check — returns clean 404-able exception instead of NPE
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

        try (var connection = dataSource.getConnection()) {
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                    allEmployeesReport,
                    new HashMap<>(),
                    connection);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        }
    }

    // ─────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────
    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}