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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}