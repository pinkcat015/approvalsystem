package com.approval.repository;

import com.approval.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByActiveTrue();

    boolean existsByCode(String code);

    // Lấy các phòng ban gốc (không có cha)
    @Query("SELECT d FROM Department d WHERE d.parent IS NULL AND d.active = true")
    List<Department> findRootDepartments();
}