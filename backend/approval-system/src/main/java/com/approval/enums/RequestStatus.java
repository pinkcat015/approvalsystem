package com.approval.enums;

public enum RequestStatus {
    DRAFT,         // Vừa tạo, chưa nộp
    IN_PROGRESS,   // Đang chờ duyệt
    ON_HOLD,       // Chờ bổ sung thông tin
    APPROVED,      // Đã duyệt xong
    REJECTED,      // Bị từ chối
    CANCELLED      // Đã hủy
}