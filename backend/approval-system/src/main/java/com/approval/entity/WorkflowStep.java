package com.approval.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_department_id")
    private Department approverDepartment;

    @Column(name = "condition_expression", columnDefinition = "TEXT")
    private String conditionExpression;

    // Số giờ tối đa chờ duyệt
    @Column(name = "timeout_hours")
    private Integer timeoutHours = 72;

    @Column(name = "is_parallel")
    private boolean parallel = false;

    @Column(name = "allow_delegate")
    private boolean allowDelegate = true;

    // ─── CẤU HÌNH ĐỘNG THEO TỪNG BƯỚC ────────────────────────────
    // Hành vi khi bước này bị từ chối:
    //   REJECT_ALL         = từ chối toàn bộ yêu cầu (mặc định)
    //   RETURN_TO_REQUESTER = trả về cho người tạo để chỉnh sửa, yêu cầu → RETURNED
    //   RETURN_TO_PREVIOUS  = trả về bước ngay trước đó
    @Column(name = "on_reject_action", length = 50)
    private String onRejectAction = "REJECT_ALL";

    // Hành vi khi bước này hết thời gian chờ:
    //   ESCALATE    = leo thang lên cấp trên (mặc định)
    //   AUTO_APPROVE = tự động duyệt bước này qua
    //   REJECT_ALL   = từ chối toàn bộ yêu cầu
    @Column(name = "on_timeout_action", length = 50)
    private String onTimeoutAction = "ESCALATE";

    // Số người tối thiểu phải duyệt trong luồng song song (is_parallel = true)
    // Mặc định = 1 (chỉ cần 1 người duyệt là đủ)
    @Column(name = "required_approvals")
    private Integer requiredApprovals = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}