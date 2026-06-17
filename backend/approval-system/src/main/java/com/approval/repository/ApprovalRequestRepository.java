package com.approval.repository;

import com.approval.entity.ApprovalRequest;
import com.approval.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    Page<ApprovalRequest> findByRequesterId(Long requesterId, Pageable pageable);

    Page<ApprovalRequest> findByRequesterIdAndStatus(
            Long requesterId, RequestStatus status, Pageable pageable);

    boolean existsByRequestNumber(String requestNumber);
}