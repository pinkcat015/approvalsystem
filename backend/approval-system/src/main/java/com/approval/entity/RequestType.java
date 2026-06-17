package com.approval.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Tên icon Ant Design, ví dụ: CalendarOutlined
    @Column(length = 100)
    private String icon;

    // Màu hiển thị, ví dụ: #4CAF50
    @Column(length = 20)
    private String color;

    // Có bắt buộc đính kèm file không
    @Column(name = "requires_attachment")
    private boolean requiresAttachment = false;

    // Tự động duyệt nếu số tiền nhỏ hơn mức này
    @Column(name = "auto_approve_below_amount", precision = 18, scale = 2)
    private BigDecimal autoApproveBelowAmount;

    @Column(name = "is_active")
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}