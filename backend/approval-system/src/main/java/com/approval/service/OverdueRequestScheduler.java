package com.approval.service;

import com.approval.entity.ApprovalRequest;
import com.approval.entity.WorkflowStep;
import com.approval.enums.RequestStatus;
import com.approval.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueRequestScheduler {

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalService approvalService;

    /**
     * Chạy định kỳ mỗi 60 giây (1 phút) để kiểm tra các tờ trình bị quá hạn xử lý.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkOverdueRequests() {
        log.debug("[SCHEDULER] Bắt đầu quét các yêu cầu chờ duyệt quá hạn...");
        
        List<ApprovalRequest> inProgressRequests = requestRepository.findByStatusOrderBySubmittedAtDesc(RequestStatus.IN_PROGRESS);
        if (inProgressRequests.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        for (ApprovalRequest request : inProgressRequests) {
            try {
                if (request.getWorkflow() == null) {
                    continue;
                }

                // Tìm bước hiện tại trong workflow gốc để lấy cấu hình timeout
                WorkflowStep currentWorkflowStep = request.getWorkflow().getSteps().stream()
                        .filter(s -> s.getStepOrder().equals(request.getCurrentStep()))
                        .findFirst()
                        .orElse(null);

                if (currentWorkflowStep == null) {
                    continue;
                }

                Integer timeoutHours = currentWorkflowStep.getTimeoutHours();
                if (timeoutHours == null || timeoutHours <= 0) {
                    // Mặc định 72 giờ nếu không cấu hình
                    timeoutHours = 72; 
                }

                // Thời điểm bắt đầu vào bước hiện tại (lấy updatedAt làm mốc do nó được update khi duyệt bước trước)
                LocalDateTime entryTime = request.getUpdatedAt();
                if (entryTime == null) {
                    entryTime = request.getSubmittedAt() != null ? request.getSubmittedAt() : request.getCreatedAt();
                }

                // Kiểm tra xem thời gian chờ thực tế đã vượt quá timeout_hours chưa
                if (now.isAfter(entryTime.plusHours(timeoutHours))) {
                    log.info("[SCHEDULER] Phát hiện tờ trình {} quá hạn duyệt tại bước {} (Giờ quy định: {}h, Thời điểm vào bước: {})",
                            request.getRequestNumber(), request.getCurrentStep(), timeoutHours, entryTime);
                    
                    // Thực hiện xử lý tự động khi quá hạn
                    approvalService.handleStepTimeout(request.getId());
                }
            } catch (Exception e) {
                log.error("[SCHEDULER] Lỗi khi xử lý kiểm tra quá hạn cho yêu cầu ID {}: {}", request.getId(), e.getMessage(), e);
            }
        }
    }
}
