package com.approval.repository;

import com.approval.entity.ApprovalRequestStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRequestStepRepository extends JpaRepository<ApprovalRequestStep, Long> {

    // Lấy toàn bộ snapshot bước của một yêu cầu, sắp xếp theo thứ tự bước
    List<ApprovalRequestStep> findByRequestIdOrderByStepOrderAsc(Long requestId);

    // Lấy snapshot bước theo thứ tự cụ thể trong một yêu cầu
    java.util.Optional<ApprovalRequestStep> findByRequestIdAndStepOrder(Long requestId, Integer stepOrder);

    // Xóa toàn bộ snapshot khi yêu cầu bị xóa (cascade đã xử lý qua FK, nhưng giữ lại để tiện dùng)
    void deleteByRequestId(Long requestId);
}
