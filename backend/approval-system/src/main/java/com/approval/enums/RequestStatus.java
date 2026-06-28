package com.approval.enums;

public enum RequestStatus {
    DRAFT,               // Vừa tạo, chưa nộp
    IN_PROGRESS,         // Đang chờ duyệt
    ON_HOLD,             // Chờ bổ sung thông tin
    APPROVED,            // Đã duyệt xong
    REJECTED,            // Bị từ chối
    CANCELLED,           // Đã hủy
    EXPIRED,             // Hết hạn xử lý (quá timeout_hours mà chưa duyệt)
    PARTIALLY_APPROVED,  // Một phần đã duyệt (dùng cho luồng song song)
    RETURNED             // Trả về bước trước / trả lại người tạo để chỉnh sửa
}