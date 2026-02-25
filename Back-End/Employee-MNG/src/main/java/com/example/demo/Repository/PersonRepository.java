package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.dto.EmployeeReportProjection;
import com.example.demo.model.Person;

public interface PersonRepository extends JpaRepository<Person, String> {

    // Uses PostgreSQL function — returns projection interface which JPA can map
    @Query(value = "SELECT * FROM get_employee_by_id(:employeeId)", nativeQuery = true)
    Optional<EmployeeReportProjection> getEmployeeByIdFromFunction(@Param("employeeId") String employeeId);

    @Query("SELECT p FROM Person p " +
            "LEFT JOIN FETCH p.personDetails " +
            "LEFT JOIN FETCH p.addresses")
    List<Person> findAllWithDetails();
}