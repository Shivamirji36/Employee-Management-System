package com.example.demo.Controller;

import com.example.demo.service.JasperReportService;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:4200")
public class ReportController {

    @Autowired
    private JasperReportService jasperReportService;

    @GetMapping("/report/{employeeId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String employeeId) {
        try {
            byte[] pdfBytes = jasperReportService.generateEmployeeReport(employeeId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // "attachment" = force download | "inline" = open in browser
            headers.setContentDispositionFormData("attachment", "employee_" + employeeId + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage().getBytes());
        }
    }

    @GetMapping("/employees")
    public ResponseEntity<byte[]> generateReport() throws Exception {

        byte[] pdf = jasperReportService.generateAllEmployeesReport();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=employees.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}