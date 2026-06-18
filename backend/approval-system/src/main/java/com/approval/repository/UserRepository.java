package com.approval.repository;

import com.approval.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByActiveTrue();

    long countByActiveTrue();

    boolean existsByEmployeeCodeAndActiveTrue(String employeeCode);

    boolean existsByEmployeeCodeAndActiveTrueAndIdNot(String employeeCode, Long id);

    boolean existsByUsernameAndActiveTrue(String username);

    boolean existsByEmailAndActiveTrue(String email);

    boolean existsByUsernameAndActiveTrueAndIdNot(String username, Long id);

    boolean existsByEmailAndActiveTrueAndIdNot(String email, Long id);
}