package com.approval.dto;

import lombok.Data;

import java.time.LocalDateTime;

public class UserDto {

    @Data
    public static class CreateRequest {
        private String username;
        private String email;
        private String password;
        private String fullName;
        private String employeeCode;
        private String phone;
        private Long departmentId;
        private String position;
        private String role;   // ADMIN | DIRECTOR | MANAGER | HR_STAFF | ACCOUNTANT | EMPLOYEE
    }

    @Data
    public static class UpdateRequest {
        private String fullName;
        private String phone;
        private Long departmentId;
        private String position;
        private String role;
        private Boolean active;
    }

    @Data
    public static class ChangePasswordRequest {
        private String newPassword;
    }

    @Data
    public static class Response {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String employeeCode;
        private String phone;
        private String position;
        private String role;
        private Long departmentId;
        private String departmentName;
        private boolean active;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
    }
}