package com.approval.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long requestId;
    private String requestNumber;
    private String type;
    private String title;
    private String content;
    private boolean read;
    private LocalDateTime createdAt;
}
