package com.approval.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class WorkflowDto {

    @Data
    public static class StepRequest {
        private Integer stepOrder;
        private String stepName;
        private String approverType;   // SPECIFIC_USER | DEPARTMENT_HEAD | ROLE | DYNAMIC
        private Long approverUserId;
        private String approverRole;
        private Long approverDepartmentId;
        private String conditionExpression;
        private Integer timeoutHours;
        private String onRejectAction;   // REJECT_ALL | RETURN_TO_REQUESTER | RETURN_TO_PREVIOUS
        private String onTimeoutAction;  // ESCALATE | AUTO_APPROVE | REJECT_ALL
        private Integer requiredApprovals;
        private boolean parallel;
        private boolean allowDelegate;
    }

    @Data
    public static class CreateRequest {
        private Long requestTypeId;
        private String name;
        private String description;
        private List<StepRequest> steps;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private String description;
        private Boolean active;
        private List<StepRequest> steps;
    }

    @Data
    public static class StepResponse {
        private Long id;
        private Integer stepOrder;
        private String stepName;
        private String approverType;
        private Long approverUserId;
        private String approverUserName;
        private String approverRole;
        private Long approverDepartmentId;
        private String approverDepartmentName;
        private String conditionExpression;
        private Integer timeoutHours;
        private boolean parallel;
        private boolean allowDelegate;
    }

    @Data
    public static class Response {
        private Long id;
        private Long requestTypeId;
        private String requestTypeName;
        private String name;
        private String description;
        private boolean active;
        private Integer version;
        private List<StepResponse> steps;
        private LocalDateTime createdAt;
    }
}