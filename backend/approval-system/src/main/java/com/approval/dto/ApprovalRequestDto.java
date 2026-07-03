package com.approval.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ApprovalRequestDto {

    @Data
    public static class CreateRequest {
        private Long requestTypeId;
        private String title;
        private Map<String, Object> formData;
        private BigDecimal amount;
        private String priority = "NORMAL";
        private String note;
    }

    @Data
    public static class ActionRequest {
        private String action;     // APPROVE | REJECT | REQUEST_INFO
        private String comment;
    }

    @Data
    public static class ActionDetail {
        private Long id;
        private Integer stepOrder;
        private String stepName;
        private String approverName;
        private String action;
        private String comment;
        private LocalDateTime actionAt;
    }

    @Data
    public static class AttachmentDetail {
        private Long id;
        private String originalName;
        private String fileName;
        private Long fileSize;
        private String contentType;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
    }

    @Data
    public static class Response {
        private Long id;
        private String requestNumber;
        private String title;
        private Long requestTypeId;
        private String requestTypeName;
        private String requesterName;
        private String requesterUsername;
        private Map<String, Object> formData;
        private BigDecimal amount;
        private String priority;
        private String status;
        private Integer currentStep;
        private Integer totalSteps;
        private String currentStepName;
        private String note;
        private String rejectionReason;
        private LocalDateTime submittedAt;
        private LocalDateTime completedAt;
        private LocalDateTime createdAt;
        private boolean currentUserEligibleToApprove;
        private List<ActionDetail> actions;
        private List<AttachmentDetail> attachments;
    }
}