package com.approval.repository;

import com.approval.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

    List<Workflow> findByActiveTrue();

    List<Workflow> findByRequestTypeIdAndActiveTrue(Long requestTypeId);

    // Lấy workflow mới nhất theo loại yêu cầu
    Optional<Workflow> findFirstByRequestTypeIdAndActiveTrueOrderByVersionDesc(Long requestTypeId);
}