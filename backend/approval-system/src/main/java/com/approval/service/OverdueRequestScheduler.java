package com.approval.service;

import com.approval.enums.RequestStatus;
import com.approval.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueRequestScheduler {

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalTimeoutProcessor timeoutProcessor;

    /**
     * Chạy định kỳ mỗi 60 giây để kiểm tra các tờ trình quá hạn.
     *
     * THIẾT KẾ: Scheduler KHÔNG có @Transactional.
     * - Bước 1: Lấy List<Long> ID qua timeoutProcessor.fetchInProgressIds() → transaction READ ngắn độc lập.
     * - Bước 2: Gọi timeoutProcessor.processOne(id) cho từng ID → mỗi lần là 1 transaction WRITE độc lập.
     * → Lỗi của 1 request KHÔNG lây sang request khác. Không còn UnexpectedRollbackException.
     */
    @Scheduled(fixedDelay = 60000)
    public void checkOverdueRequests() {
        log.debug("[SCHEDULER] Bắt đầu quét các yêu cầu chờ duyệt quá hạn...");

        List<Long> ids = timeoutProcessor.fetchInProgressIds();
        if (ids.isEmpty()) {
            return;
        }

        log.debug("[SCHEDULER] Tìm thấy {} yêu cầu IN_PROGRESS, bắt đầu kiểm tra...", ids.size());

        for (Long requestId : ids) {
            try {
                timeoutProcessor.processOne(requestId);
            } catch (Exception e) {
                log.error("[SCHEDULER] Lỗi khi xử lý quá hạn cho yêu cầu ID {}: {}", requestId, e.getMessage());
            }
        }
    }
}
