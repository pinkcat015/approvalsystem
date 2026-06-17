package com.approval.service;

import com.approval.dto.ApprovalRequestDto;
import com.approval.entity.*;
import com.approval.enums.RequestStatus;
import com.approval.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalActionRepository actionRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final RequestTypeRepository requestTypeRepository;

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1);

    // ─── TẠO YÊU CẦU MỚI (DRAFT) ─────────────────────────────
    @Transactional
    public ApprovalRequestDto.Response create(
            ApprovalRequestDto.CreateRequest dto, String username) {

        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        RequestType requestType = requestTypeRepository.findById(dto.getRequestTypeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu"));

        // Tìm workflow phù hợp với loại yêu cầu này
        Workflow workflow = workflowRepository
                .findFirstByRequestTypeIdAndActiveTrueOrderByVersionDesc(dto.getRequestTypeId())
                .orElse(null);

        ApprovalRequest request = ApprovalRequest.builder()
                .requestNumber(generateRequestNumber())
                .title(dto.getTitle())
                .requestType(requestType)
                .workflow(workflow)
                .requester(requester)
                .department(requester.getDepartment())
                .formData(dto.getFormData())
                .amount(dto.getAmount())
                .priority(dto.getPriority())
                .note(dto.getNote())
                .status(RequestStatus.DRAFT)
                .currentStep(0)
                .build();

        return toResponse(requestRepository.save(request));
    }

    // ─── NỘP YÊU CẦU (DRAFT → IN_PROGRESS) ───────────────────
    @Transactional
    public ApprovalRequestDto.Response submit(Long requestId, String username) {
        ApprovalRequest request = getRequestOrThrow(requestId);
        validateOwnership(request, username);

        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể nộp yêu cầu ở trạng thái Nháp");
        }

        if (request.getWorkflow() == null) {
            throw new RuntimeException("Loại yêu cầu này chưa có quy trình duyệt");
        }

        request.setStatus(RequestStatus.IN_PROGRESS);
        request.setCurrentStep(1);   // Chuyển sang bước 1
        request.setSubmittedAt(LocalDateTime.now());

        return toResponse(requestRepository.save(request));
    }

    // ─── XỬ LÝ DUYỆT / TỪ CHỐI / YÊU CẦU BỔ SUNG ─────────────
    @Transactional
    public ApprovalRequestDto.Response processAction(
            Long requestId, ApprovalRequestDto.ActionRequest dto, String username) {

        ApprovalRequest request = getRequestOrThrow(requestId);
        User approver = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (request.getStatus() != RequestStatus.IN_PROGRESS) {
            throw new RuntimeException("Yêu cầu không ở trạng thái chờ duyệt");
        }

        // Tìm bước hiện tại trong workflow
        WorkflowStep currentStep = request.getWorkflow().getSteps().stream()
                .filter(s -> s.getStepOrder().equals(request.getCurrentStep()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt hiện tại"));

        // Ghi lại lịch sử hành động
        ApprovalAction action = ApprovalAction.builder()
                .request(request)
                .stepOrder(request.getCurrentStep())
                .stepName(currentStep.getStepName())
                .approver(approver)
                .action(dto.getAction())
                .comment(dto.getComment())
                .actionAt(LocalDateTime.now())
                .build();

        actionRepository.save(action);

        // Cập nhật trạng thái yêu cầu dựa trên hành động
        switch (dto.getAction()) {
            case "APPROVE" -> handleApprove(request);
            case "REJECT"  -> handleReject(request, dto.getComment());
            case "REQUEST_INFO" -> request.setStatus(RequestStatus.ON_HOLD);
            default -> throw new RuntimeException("Hành động không hợp lệ: " + dto.getAction());
        }

        return toResponse(requestRepository.save(request));
    }

    // Logic khi DUYỆT — chuyển bước tiếp theo hoặc kết thúc
    private void handleApprove(ApprovalRequest request) {
        int totalSteps = request.getWorkflow().getSteps().size();
        int nextStep = request.getCurrentStep() + 1;

        if (nextStep > totalSteps) {
            // Đã duyệt hết các bước → hoàn thành
            request.setStatus(RequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
        } else {
            // Còn bước tiếp theo → chuyển sang bước đó
            request.setCurrentStep(nextStep);
        }
    }

    // Logic khi TỪ CHỐI — kết thúc luôn
    private void handleReject(ApprovalRequest request, String reason) {
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setCompletedAt(LocalDateTime.now());
    }

    // ─── HỦY YÊU CẦU ──────────────────────────────────────────
    @Transactional
    public ApprovalRequestDto.Response cancel(Long requestId, String reason, String username) {
        ApprovalRequest request = getRequestOrThrow(requestId);
        validateOwnership(request, username);

        if (request.getStatus() == RequestStatus.APPROVED
                || request.getStatus() == RequestStatus.REJECTED) {
            throw new RuntimeException("Không thể hủy yêu cầu đã hoàn thành");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request.setCancelledReason(reason);
        request.setCompletedAt(LocalDateTime.now());

        return toResponse(requestRepository.save(request));
    }

    // ─── LẤY DANH SÁCH YÊU CẦU CỦA TÔI ────────────────────────
    public Page<ApprovalRequestDto.Response> getMyRequests(
            String username, RequestStatus status, Pageable pageable) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Page<ApprovalRequest> page = (status != null)
                ? requestRepository.findByRequesterIdAndStatus(user.getId(), status, pageable)
                : requestRepository.findByRequesterId(user.getId(), pageable);

        return page.map(this::toResponse);
    }

    // ─── LẤY CHI TIẾT 1 YÊU CẦU ────────────────────────────────
    public ApprovalRequestDto.Response getById(Long id) {
        return toResponse(getRequestOrThrow(id));
    }

    // ─── HÀM HỖ TRỢ ─────────────────────────────────────────────
    private ApprovalRequest getRequestOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + id));
    }

    private void validateOwnership(ApprovalRequest request, String username) {
        if (!request.getRequester().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
    }

    private String generateRequestNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%04d", SEQUENCE.getAndIncrement());
        return "REQ-" + date + "-" + seq;
    }

    // Convert Entity → DTO
    private ApprovalRequestDto.Response toResponse(ApprovalRequest req) {
        ApprovalRequestDto.Response res = new ApprovalRequestDto.Response();
        res.setId(req.getId());
        res.setRequestNumber(req.getRequestNumber());
        res.setTitle(req.getTitle());
        res.setRequestTypeName(req.getRequestType().getName());
        res.setRequesterName(req.getRequester().getFullName());
        res.setFormData(req.getFormData());
        res.setAmount(req.getAmount());
        res.setPriority(req.getPriority());
        res.setStatus(req.getStatus().name());
        res.setCurrentStep(req.getCurrentStep());
        res.setNote(req.getNote());
        res.setRejectionReason(req.getRejectionReason());
        res.setSubmittedAt(req.getSubmittedAt());
        res.setCompletedAt(req.getCompletedAt());
        res.setCreatedAt(req.getCreatedAt());

        if (req.getWorkflow() != null) {
            res.setTotalSteps(req.getWorkflow().getSteps().size());
            req.getWorkflow().getSteps().stream()
                    .filter(s -> s.getStepOrder().equals(req.getCurrentStep()))
                    .findFirst()
                    .ifPresent(s -> res.setCurrentStepName(s.getStepName()));
        }

        res.setActions(req.getActions().stream().map(a -> {
            ApprovalRequestDto.ActionDetail d = new ApprovalRequestDto.ActionDetail();
            d.setId(a.getId());
            d.setStepOrder(a.getStepOrder());
            d.setStepName(a.getStepName());
            d.setApproverName(a.getApprover().getFullName());
            d.setAction(a.getAction());
            d.setComment(a.getComment());
            d.setActionAt(a.getActionAt());
            return d;
        }).toList());

        return res;
    }
}