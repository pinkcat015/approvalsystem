package com.approval.repository;

import com.approval.entity.ApprovalRequest;
import com.approval.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    Page<ApprovalRequest> findByRequesterId(Long requesterId, Pageable pageable);

    Page<ApprovalRequest> findByRequesterIdAndStatus(
            Long requesterId, RequestStatus status, Pageable pageable);

    boolean existsByRequestNumber(String requestNumber);

    @Query("SELECT r FROM ApprovalRequest r WHERE r.status = 'IN_PROGRESS' ORDER BY r.submittedAt DESC")
    Page<ApprovalRequest> findAllPending(Pageable pageable);

    // BUG 8 FIX: Hỗ trợ query có phân trang để getPending() không load toàn bộ vào RAM
    Page<ApprovalRequest> findByStatus(RequestStatus status, Pageable pageable);

    java.util.List<ApprovalRequest> findByStatusOrderBySubmittedAtDesc(RequestStatus status);

    // Scheduler dùng: chỉ lấy ID để tránh LazyInitializationException khi load Workflow/Steps ngoài session
    @Query("SELECT r.id FROM ApprovalRequest r WHERE r.status = :status")
    java.util.List<Long> findIdsByStatus(RequestStatus status);

    java.util.List<ApprovalRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(RequestStatus status);

    long countByRequesterId(Long requesterId);

    long countByRequesterIdAndStatus(Long requesterId, RequestStatus status);
}