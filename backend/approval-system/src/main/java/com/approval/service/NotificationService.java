package com.approval.service;

import com.approval.dto.NotificationDto;
import com.approval.entity.ApprovalRequest;
import com.approval.entity.Notification;
import com.approval.entity.User;
import com.approval.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;

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

        // 4. Gửi Email thật qua SMTP (chạy bất đồng bộ tránh block thread chính)
        sendRealEmail(recipient.getEmail(), title, content);
    }

    private void sendRealEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.trim().isEmpty() || !toEmail.contains("@")) {
            System.out.println("[EMAIL] Bỏ qua gửi email do địa chỉ không hợp lệ: " + toEmail);
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                System.out.println("[EMAIL] Bắt đầu gửi mail tới: " + toEmail + "...");
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("truongminhtrang012@gmail.com");
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                
                mailSender.send(message);
                System.out.println("[EMAIL] Gửi email THÀNH CÔNG tới: " + toEmail);
            } catch (Exception e) {
                System.err.println("[EMAIL] THẤT BẠI khi gửi email tới " + toEmail + ": " + e.getMessage());
            }
        });
    }
}
