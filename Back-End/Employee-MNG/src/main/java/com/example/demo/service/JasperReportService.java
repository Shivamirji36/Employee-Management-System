package com.example.demo.service;

import com.example.demo.dto.EmployeeReportDTO;
import net.sf.jasperreports.engine.*;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;

@Service
public class JasperReportService {

    private final PersonService personService;
    private DataSource dataSource;

    public JasperReportService(PersonService personService, DataSource dataSource) {
        this.personService = personService;
        this.dataSource = dataSource;
    }

    public byte[] generateEmployeeReport(String employeeId) throws Exception {

        // Fetch flat data via DB function
        EmployeeReportDTO emp = personService.getEmployeeById(employeeId);

        // Build params map — all values are already String in EmployeeReportDTO
        Map<String, Object> params = new HashMap<>();
        params.put("employeeId",       emp.getEmployeeId());
        params.put("salutation",       emp.getSalutation());
        params.put("firstName",        emp.getFirstName());
        params.put("middleName",       emp.getMiddleName());
        params.put("lastName",         emp.getLastName());
        params.put("gender",           emp.getGender());
        params.put("dob",              emp.getDob());
        params.put("mobile",           emp.getMobile());
        params.put("email",            emp.getEmail());
        params.put("designation",      emp.getDesignation());
        params.put("employeeGroup",    emp.getEmployeeGroup());
        params.put("reportingManager", emp.getReportingManager());
        params.put("department",       emp.getDepartment());
        params.put("status",           emp.getStatus());
        params.put("relievingDate",    emp.getRelievingDate());
        params.put("site",             emp.getSite());
        params.put("country",          emp.getCountry());
        params.put("state",            emp.getState());
        params.put("city",             emp.getCity());
        params.put("zipCode",          emp.getZipCode());
        params.put("addressLine1",     emp.getAddressLine1());
        params.put("addressLine2",     emp.getAddressLine2());

        // Load JRXML from classpath
        InputStream stream = getClass().getResourceAsStream("/reports/EmployeeDetails.jrxml");
        if (stream == null) {
            throw new RuntimeException("Report file not found at /reports/EmployeeDetails.jrxml");
        }

        JasperReport jasperReport = JasperCompileManager.compileReport(stream);
        JasperPrint  jasperPrint  = JasperFillManager.fillReport(jasperReport, params, new JREmptyDataSource());
        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    public byte[] generateAllEmployeesReport() throws Exception {

        InputStream stream = getClass()
                .getResourceAsStream("/reports/AllEmployees.jrxml");
        if (stream == null) {
            throw new RuntimeException("Report file not found at /reports/AllEmployees.jrxml");
        }

        JasperReport jasperReport = JasperCompileManager.compileReport(stream);

        // Pass JDBC connection since the report has its own SQL query
        JasperPrint jasperPrint = JasperFillManager.fillReport(
                jasperReport, new HashMap<>(), dataSource.getConnection());

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}