package com.approval.dto;

import lombok.Data;

import java.time.LocalDateTime;

public class DelegationDto {

    @Data
    public static class CreateRequest {
        private Long toUserId;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
    }

    @Data
    public static class Response {
        private Long id;
        private Long fromUserId;
        private String fromUserName;
        private Long toUserId;
        private String toUserName;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
