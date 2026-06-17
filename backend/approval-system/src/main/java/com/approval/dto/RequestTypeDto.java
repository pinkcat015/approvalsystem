package com.approval.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RequestTypeDto {

    @Data
    public static class CreateRequest {
        private String code;
        private String name;
        private String category;
        private String description;
        private String icon;
        private String color;
        private boolean requiresAttachment;
        private BigDecimal autoApproveBelowAmount;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private String category;
        private String description;
        private String icon;
        private String color;
        private Boolean requiresAttachment;
        private BigDecimal autoApproveBelowAmount;
        private Boolean active;
    }

    @Data
    public static class Response {
        private Long id;
        private String code;
        private String name;
        private String category;
        private String description;
        private String icon;
        private String color;
        private boolean requiresAttachment;
        private BigDecimal autoApproveBelowAmount;
        private boolean active;
        private LocalDateTime createdAt;
    }
}