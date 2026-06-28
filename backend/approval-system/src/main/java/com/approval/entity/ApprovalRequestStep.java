package com.approval.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lưu snapshot cấu hình các bước duyệt của từng yêu cầu tại thời điểm Submit.
 * Mục đích: Ngăn tờ trình đang chạy bị ảnh hưởng khi Admin thay đổi Workflow.
 * Mỗi khi một ApprovalRequest được Submit, hệ thống sao chép toàn bộ WorkflowSteps
 * vào bảng này. Luồng duyệt sau đó đi theo snapshot này, không phải cấu hình hiện tại.
 */
@Entity
@Table(name = "approval_request_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequestStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ApprovalRequest request;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "step_name", nullable = false, length = 200)
    private String stepName;

    // SPECIFIC_USER | DEPARTMENT_HEAD | ROLE | DYNAMIC
    @Column(name = "approver_type", nullable = false, length = 50)
    private String approverType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_user_id")
    private User approverUser;

    @Column(name = "approver_role", length = 50)
    private String approverRole;

    @Column(name = "condition_expression", columnDefinition = "TEXT")
    private String conditionExpression;

    // Hành vi khi bước này bị từ chối: REJECT_ALL | RETURN_TO_REQUESTER | RETURN_TO_PREVIOUS
    @Column(name = "on_reject_action", length = 50)
    private String onRejectAction = "REJECT_ALL";

    // Trạng thái của bước này trong quá trình xử lý thực tế
    // PENDING | IN_PROGRESS | APPROVED | REJECTED | SKIPPED | RETURNED
    @Column(nullable = false, length = 50)
    private String status = "PENDING";

    // Thời điểm bước được xử lý (duyệt, từ chối, hoặc bỏ qua)
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // Người thực hiện xử lý bước này
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;
}
