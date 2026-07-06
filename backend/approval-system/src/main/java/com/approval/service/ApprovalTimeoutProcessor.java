package com.approval.service;

import com.approval.enums.RequestStatus;
import com.approval.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Tách logic xử lý timeout thành bean riêng để Spring AOP có thể áp dụng
 * @Transactional đúng cách (self-invocation trong cùng class sẽ không có tác dụng).
 *
 * - fetchInProgressIds(): transaction READ ngắn, chỉ lấy danh sách ID.
 * - processOne(id): transaction WRITE độc lập cho từng request.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApprovalTimeoutProcessor {

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalService approvalService;

    /**
     * Transaction READ-ONLY để lấy danh sách ID request đang IN_PROGRESS.
     * Không load entity đầy đủ, tránh LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public List<Long> fetchInProgressIds() {
        return requestRepository.findIdsByStatus(RequestStatus.IN_PROGRESS);
    }

    /**
     * Transaction WRITE độc lập cho từng request.
     * Nếu lỗi xảy ra, chỉ rollback transaction của request này,
     * không ảnh hưởng đến các request khác trong vòng lặp.
     */
    @Transactional
    public void processOne(Long requestId) {
        approvalService.handleStepTimeout(requestId);
    }
}
