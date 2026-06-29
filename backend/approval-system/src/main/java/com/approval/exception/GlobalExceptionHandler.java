package com.approval.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Xử lý tập trung các ngoại lệ của ứng dụng.
 * Trả về HTTP response có cấu trúc thay vì stack trace thô.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * BUG IMPROVEMENT: Xử lý khi 2 người duyệt cùng một tờ trình đồng thời.
     * @Version trên ApprovalRequest sẽ ném exception này, trả về 409 Conflict
     * để frontend biết cần tải lại và thử lại.
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 409,
                "error", "Conflict",
                "message", "Yêu cầu vừa được cập nhật bởi người khác. Vui lòng tải lại trang và thử lại."
        ));
    }

    /**
     * Xử lý RuntimeException chung — trả về 400 Bad Request thay vì 500.
     * Giúp frontend nhận được thông báo lỗi nghiệp vụ rõ ràng.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", 400,
                        "error", "Bad Request",
                        "message", ex.getMessage() != null ? ex.getMessage() : "Lỗi xử lý yêu cầu"
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", 500,
                        "error", "Internal Server Error",
                        "message", "Đã xảy ra lỗi hệ thống: " + ex.getMessage()
                ));
    }
}
