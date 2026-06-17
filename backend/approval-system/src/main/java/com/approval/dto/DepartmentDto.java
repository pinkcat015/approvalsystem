package com.approval.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class DepartmentDto {

    @Data
    public static class CreateRequest {
        private String code;
        private String name;
        private Long parentId;
        private Long managerId;
        private String description;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private Long parentId;
        private Long managerId;
        private String description;
        private Boolean active;
    }

    @Data
    public static class Response {
        private Long id;
        private String code;
        private String name;
        private String description;
        private boolean active;
        private Long parentId;
        private String parentName;
        private Long managerId;
        private String managerName;
        private LocalDateTime createdAt;
        private List<Response> children;
    }
}