package com.approval.repository;

import com.approval.entity.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestTypeRepository extends JpaRepository<RequestType, Long> {

    List<RequestType> findByActiveTrue();

    boolean existsByCode(String code);
}