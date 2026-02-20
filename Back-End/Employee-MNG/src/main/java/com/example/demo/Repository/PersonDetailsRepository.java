package com.example.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.PersonDetails;

public interface PersonDetailsRepository extends JpaRepository<PersonDetails, Long> {

}
