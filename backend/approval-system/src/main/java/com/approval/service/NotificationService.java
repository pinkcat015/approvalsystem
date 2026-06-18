package com.approval.service;

import com.approval.dto.NotificationDto;
import com.approval.entity.ApprovalRequest;
import com.approval.entity.Notification;
import com.approval.entity.User;
import com.approval.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void sendNotification(User recipient, ApprovalRequest request, String type, String title, String content) {
        // 1. Lưu DB
        Notification notif = Notification.builder()
                .user(recipient)
                .request(request)
                .type(type)
                .title(title)
                .content(content)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notif);

        // 2. Map sang DTO
        NotificationDto dto = NotificationDto.builder()
                .id(saved.getId())
                .requestId(request != null ? request.getId() : null)
                .requestNumber(request != null ? request.getRequestNumber() : null)
                .type(type)
                .title(title)
                .content(content)
                .read(false)
                .createdAt(saved.getCreatedAt() != null ? saved.getCreatedAt() : LocalDateTime.now())
                .build();

        // 3. Gửi WebSocket thời gian thực cho user cụ thể
        try {
            messagingTemplate.convertAndSendToUser(recipient.getUsername(), "/queue/notifications", dto);
            System.out.println("Đã gửi WebSocket thông báo tới user: " + recipient.getUsername());
        } catch (Exception e) {
            System.err.println("Không thể gửi WebSocket: " + e.getMessage());
        }

        // 4. Mô phỏng gửi Email (in log ra console)
        simulateEmailSend(recipient.getEmail(), title, content);
    }

    private void simulateEmailSend(String email, String subject, String body) {
        System.out.println("==================================================");
        System.out.println("[EMAIL SIMULATOR] Gửi email tới: " + email);
        System.out.println("Tiêu đề: " + subject);
        System.out.println("Nội dung:\n" + body);
        System.out.println("==================================================");
    }
}
