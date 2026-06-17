package com.approval.repository;

import com.approval.entity.ApprovalAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalActionRepository extends JpaRepository<ApprovalAction, Long> {

    List<ApprovalAction> findByRequestIdOrderByActionAtAsc(Long requestId);
}