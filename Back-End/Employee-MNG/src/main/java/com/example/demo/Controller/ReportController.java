package com.example.demo.Controller;

import com.example.demo.service.JasperReportService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    // ✅ Fix 1: Constructor injection — testable, no hidden dependencies
    private final JasperReportService jasperReportService;

    public ReportController(JasperReportService jasperReportService) {
        this.jasperReportService = jasperReportService;
    }

    // ─────────────────────────────────────────────────────
    // GET /api/employees/report/{employeeId}
    // Download individual employee PDF report
    // ─────────────────────────────────────────────────────
    @GetMapping("/report/{employeeId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String employeeId) {
        try {
            byte[] pdfBytes = jasperReportService.generateEmployeeReport(employeeId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=employee_" + employeeId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);

        } catch (IllegalArgumentException e) {
            // ✅ Employee not found → 404 (thrown from service when emp == null)
            log.warn("Employee not found for report: {}", employeeId);
            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            // ✅ Fix 2: proper logger visible in Render logs
            log.error("Failed to generate report for employee: {}", employeeId, e);

            // ✅ Fix 3: never leak internal error message to client
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─────────────────────────────────────────────────────
    // GET /api/employees/report
    // Download all employees PDF report
    // ─────────────────────────────────────────────────────
    @GetMapping("/report")
    public ResponseEntity<byte[]> generateReport() { // ✅ removed "throws Exception"
        try {
            byte[] pdf = jasperReportService.generateAllEmployeesReport();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=all_employees.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);

        } catch (Exception e) {
            // ✅ Fix 4: was completely unhandled before
            log.error("Failed to generate all employees report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}