package com.approval.service;

import com.approval.dto.ApprovalRequestDto;
import com.approval.entity.*;
import com.approval.enums.RequestStatus;
import com.approval.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalActionRepository actionRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final DelegationRepository delegationRepository;
    private final NotificationService notificationService;
    private final ApprovalRequestStepRepository requestStepRepository;

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

        if (request.getRequestType().isRequiresAttachment()) {
            if (request.getAttachments() == null || request.getAttachments().isEmpty()) {
                throw new RuntimeException("Loại yêu cầu này bắt buộc phải đính kèm tài liệu trước khi nộp");
            }
        }

        request.setStatus(RequestStatus.IN_PROGRESS);
        request.setSubmittedAt(LocalDateTime.now());

        // ── SNAPSHOT WORKFLOW TẠI THỜI ĐIỂM NỘP ─────────────────
        // Lưu lại cấu hình từng bước vào bảng approval_request_steps.
        // Mục đích: kể cả khi Admin thay đổi Workflow sau đó,
        // tờ trình này vẫn chạy theo cấu hình đã chốt tại thời điểm Submit.
        ApprovalRequest savedForSnapshot = requestRepository.save(request);
        List<WorkflowStep> workflowSteps = savedForSnapshot.getWorkflow().getSteps();
        for (WorkflowStep wfStep : workflowSteps) {
            ApprovalRequestStep snapshot = ApprovalRequestStep.builder()
                    .request(savedForSnapshot)
                    .stepOrder(wfStep.getStepOrder())
                    .stepName(wfStep.getStepName())
                    .approverType(wfStep.getApproverType())
                    .approverUser(wfStep.getApproverUser())
                    .approverRole(wfStep.getApproverRole())
                    .conditionExpression(wfStep.getConditionExpression())
                    .onRejectAction(wfStep.getOnRejectAction() != null ? wfStep.getOnRejectAction() : "REJECT_ALL")
                    .status("PENDING")
                    .build();
            requestStepRepository.save(snapshot);
        }
        request = savedForSnapshot;
        // ─────────────────────────────────────────────────────────

        int totalSteps = request.getWorkflow().getSteps().size();
        int nextStep = 1;

        while (nextStep <= totalSteps) {
            int finalNextStep = nextStep;
            WorkflowStep step = request.getWorkflow().getSteps().stream()
                    .filter(s -> s.getStepOrder().equals(finalNextStep))
                    .findFirst()
                    .orElse(null);

            if (step != null && shouldSkipStep(request, step)) {
                recordSystemSkipAction(request, step);
                // Cập nhật trạng thái snapshot tương ứng
                requestStepRepository.findByRequestIdAndStepOrder(request.getId(), step.getStepOrder())
                        .ifPresent(ss -> { ss.setStatus("SKIPPED"); ss.setProcessedAt(LocalDateTime.now()); requestStepRepository.save(ss); });
                nextStep++;
            } else {
                break;
            }
        }

        if (nextStep > totalSteps) {
            request.setStatus(RequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
            request.setCurrentStep(totalSteps);
        } else {
            request.setCurrentStep(nextStep);
            // Đánh dấu bước hiện tại là IN_PROGRESS trong snapshot
            requestStepRepository.findByRequestIdAndStepOrder(request.getId(), nextStep)
                    .ifPresent(ss -> { ss.setStatus("IN_PROGRESS"); requestStepRepository.save(ss); });
        }

        ApprovalRequest savedRequest = requestRepository.save(request);
        if (savedRequest.getStatus() == RequestStatus.APPROVED) {
            notificationService.sendNotification(
                    savedRequest.getRequester(),
                    savedRequest,
                    "APPROVED",
                    "Yêu cầu được phê duyệt: " + savedRequest.getRequestNumber(),
                    "Yêu cầu '" + savedRequest.getTitle() + "' của bạn đã được phê duyệt hoàn toàn."
            );
        } else {
            notifyEligibleApprovers(savedRequest);
        }

        return toResponse(savedRequest);
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

        if (!isUserEligibleToApprove(approver, request)) {
            throw new RuntimeException("Bạn không có quyền duyệt yêu cầu này ở bước hiện tại");
        }

        // Tìm bước hiện tại trong workflow
        WorkflowStep currentStep = request.getWorkflow().getSteps().stream()
                .filter(s -> s.getStepOrder().equals(request.getCurrentStep()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt hiện tại"));

        // Xác định xem có phải duyệt thay (ủy quyền) không
        User delegator = null;
        if ("SPECIFIC_USER".equals(currentStep.getApproverType())) {
            if (currentStep.getApproverUser() != null && !currentStep.getApproverUser().getId().equals(approver.getId())) {
                delegator = currentStep.getApproverUser();
            }
        } else if ("DEPARTMENT_HEAD".equals(currentStep.getApproverType())) {
            User manager = null;
            if (currentStep.getApproverDepartment() != null) {
                manager = currentStep.getApproverDepartment().getManager();
            } else if (request.getRequester().getDepartment() != null) {
                manager = request.getRequester().getDepartment().getManager();
            }
            if (manager != null && !manager.getId().equals(approver.getId())) {
                delegator = manager;
            }
        } else if ("ROLE".equals(currentStep.getApproverType())) {
            if (currentStep.getApproverRole() != null && !approver.getRole().name().equals(currentStep.getApproverRole())) {
                List<Delegation> activeIncoming = delegationRepository.findByToUserIdOrderByIdDesc(approver.getId()).stream()
                        .filter(d -> d.isActive() && 
                                     LocalDateTime.now().isAfter(d.getStartDate()) && 
                                     LocalDateTime.now().isBefore(d.getEndDate()))
                        .toList();
                delegator = activeIncoming.stream()
                        .filter(d -> d.getFromUser().getRole().name().equals(currentStep.getApproverRole()))
                        .map(Delegation::getFromUser)
                        .findFirst()
                        .orElse(null);
            }
        }

        String comment = dto.getComment();
        if (delegator != null) {
            String suffix = " (Duyệt thay cho " + delegator.getFullName() + ")";
            if (comment == null || comment.isEmpty()) {
                comment = suffix.trim();
            } else {
                comment = comment + suffix;
            }
        }

        // Ghi lại lịch sử hành động
        ApprovalAction action = ApprovalAction.builder()
                .request(request)
                .stepOrder(request.getCurrentStep())
                .stepName(currentStep.getStepName())
                .approver(approver)
                .action(dto.getAction())
                .comment(comment)
                .actionAt(LocalDateTime.now())
                .build();

        actionRepository.save(action);

        // Cập nhật snapshot bước hiện tại
        final int currentStepNum = request.getCurrentStep();
        requestStepRepository.findByRequestIdAndStepOrder(request.getId(), currentStepNum)
                .ifPresent(ss -> {
                    ss.setStatus(dto.getAction().equals("APPROVE") ? "APPROVED" :
                                 dto.getAction().equals("REJECT") ? "REJECTED" : "IN_PROGRESS");
                    ss.setProcessedAt(LocalDateTime.now());
                    ss.setProcessedBy(approver);
                    requestStepRepository.save(ss);
                });

        // Cập nhật trạng thái yêu cầu dựa trên hành động
        switch (dto.getAction()) {
            case "APPROVE" -> handleApprove(request);
            case "REJECT"  -> handleReject(request, dto.getComment(), currentStep);
            case "REQUEST_INFO" -> request.setStatus(RequestStatus.ON_HOLD);
            default -> throw new RuntimeException("Hành động không hợp lệ: " + dto.getAction());
        }

        ApprovalRequest savedRequest = requestRepository.save(request);

        if (savedRequest.getStatus() == RequestStatus.APPROVED) {
            notificationService.sendNotification(
                    savedRequest.getRequester(),
                    savedRequest,
                    "APPROVED",
                    "Yêu cầu được phê duyệt: " + savedRequest.getRequestNumber(),
                    "Yêu cầu '" + savedRequest.getTitle() + "' của bạn đã được phê duyệt hoàn toàn."
            );
        } else if (savedRequest.getStatus() == RequestStatus.REJECTED) {
            notificationService.sendNotification(
                    savedRequest.getRequester(),
                    savedRequest,
                    "REJECTED",
                    "Yêu cầu bị từ chối: " + savedRequest.getRequestNumber(),
                    "Yêu cầu '" + savedRequest.getTitle() + "' của bạn đã bị từ chối. Lý do: " + savedRequest.getRejectionReason()
            );
        } else if (savedRequest.getStatus() == RequestStatus.RETURNED) {
            notificationService.sendNotification(
                    savedRequest.getRequester(),
                    savedRequest,
                    "REJECTED",
                    "Yêu cầu được trả về để chỉnh sửa: " + savedRequest.getRequestNumber(),
                    "Yêu cầu '" + savedRequest.getTitle() + "' đã được trả về. Vui lòng xem lý do và chỉnh sửa lại."
            );
        } else if (savedRequest.getStatus() == RequestStatus.ON_HOLD) {
            notificationService.sendNotification(
                    savedRequest.getRequester(),
                    savedRequest,
                    "INFO_REQUESTED",
                    "Yêu cầu cần bổ sung thông tin: " + savedRequest.getRequestNumber(),
                    "Người duyệt yêu cầu bạn bổ sung thông tin cho yêu cầu '" + savedRequest.getTitle() + "'."
            );
        } else if (savedRequest.getStatus() == RequestStatus.IN_PROGRESS) {
            // Đánh dấu bước mới là IN_PROGRESS trong snapshot
            requestStepRepository.findByRequestIdAndStepOrder(savedRequest.getId(), savedRequest.getCurrentStep())
                    .ifPresent(ss -> { ss.setStatus("IN_PROGRESS"); requestStepRepository.save(ss); });
            notifyEligibleApprovers(savedRequest);
        }

        return toResponse(savedRequest);
    }

    // Logic khi DUYỆT — chuyển bước tiếp theo hoặc kết thúc
    private void handleApprove(ApprovalRequest request) {
        int totalSteps = request.getWorkflow().getSteps().size();
        int nextStep = request.getCurrentStep() + 1;

        while (nextStep <= totalSteps) {
            int finalNextStep = nextStep;
            WorkflowStep step = request.getWorkflow().getSteps().stream()
                    .filter(s -> s.getStepOrder().equals(finalNextStep))
                    .findFirst()
                    .orElse(null);

            if (step != null && shouldSkipStep(request, step)) {
                recordSystemSkipAction(request, step);
                nextStep++;
            } else {
                break;
            }
        }

        if (nextStep > totalSteps) {
            request.setStatus(RequestStatus.APPROVED);
            request.setCompletedAt(LocalDateTime.now());
            request.setCurrentStep(totalSteps);
        } else {
            request.setCurrentStep(nextStep);
        }
    }

    // Logic khi TỪ CHỐI — hành vi phụ thuộc vào on_reject_action của bước
    private void handleReject(ApprovalRequest request, String reason, WorkflowStep currentStep) {
        String rejectAction = (currentStep.getOnRejectAction() != null)
                ? currentStep.getOnRejectAction() : "REJECT_ALL";

        switch (rejectAction) {
            case "RETURN_TO_REQUESTER" -> {
                // Trả về cho người tạo để chỉnh sửa lại, không đóng hẳn yêu cầu
                request.setStatus(RequestStatus.RETURNED);
                request.setRejectionReason("[Trả về để chỉnh sửa] " + (reason != null ? reason : ""));
                request.setCurrentStep(0);
            }
            case "RETURN_TO_PREVIOUS" -> {
                // Trả về bước ngay trước đó (nếu đang ở bước 1 thì trả về requester)
                int prevStep = request.getCurrentStep() - 1;
                if (prevStep <= 0) {
                    request.setStatus(RequestStatus.RETURNED);
                    request.setCurrentStep(0);
                } else {
                    request.setStatus(RequestStatus.IN_PROGRESS);
                    request.setCurrentStep(prevStep);
                    // Reset snapshot bước trước về PENDING để có thể duyệt lại
                    requestStepRepository.findByRequestIdAndStepOrder(request.getId(), prevStep)
                            .ifPresent(ss -> { ss.setStatus("IN_PROGRESS"); ss.setProcessedAt(null); ss.setProcessedBy(null); requestStepRepository.save(ss); });
                }
                request.setRejectionReason(reason);
            }
            default -> {
                // REJECT_ALL: từ chối toàn bộ (hành vi gốc)
                request.setStatus(RequestStatus.REJECTED);
                request.setRejectionReason(reason);
                request.setCompletedAt(LocalDateTime.now());
            }
        }
    }

    private boolean shouldSkipStep(ApprovalRequest request, WorkflowStep step) {
        if (step.getConditionExpression() == null || step.getConditionExpression().trim().isEmpty()) {
            return false;
        }
        try {
            org.springframework.expression.ExpressionParser parser = new org.springframework.expression.spel.standard.SpelExpressionParser();
            org.springframework.expression.EvaluationContext context = new org.springframework.expression.spel.support.StandardEvaluationContext(request);
            Boolean result = parser.parseExpression(step.getConditionExpression().trim()).getValue(context, Boolean.class);
            return result != null && !result;
        } catch (Exception e) {
            System.err.println("Lỗi evaluate SpEL: " + e.getMessage());
            return false;
        }
    }

    private void recordSystemSkipAction(ApprovalRequest request, WorkflowStep step) {
        User systemUser = userRepository.findByUsername("admin").orElse(null);
        ApprovalAction action = ApprovalAction.builder()
                .request(request)
                .stepOrder(step.getStepOrder())
                .stepName(step.getStepName())
                .approver(systemUser)
                .action("APPROVE")
                .comment("Hệ thống tự động bỏ qua bước này (Không thỏa mãn điều kiện: " + step.getConditionExpression() + ")")
                .actionAt(LocalDateTime.now())
                .build();
        actionRepository.save(action);
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
        res.setRequestTypeId(req.getRequestType().getId());
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

        if (req.getAttachments() != null) {
            res.setAttachments(req.getAttachments().stream().map(att -> {
                ApprovalRequestDto.AttachmentDetail d = new ApprovalRequestDto.AttachmentDetail();
                d.setId(att.getId());
                d.setOriginalName(att.getOriginalName());
                d.setFileName(att.getFileName());
                d.setFileSize(att.getFileSize());
                d.setContentType(att.getContentType());
                d.setUploadedBy(att.getUploadedBy() != null ? att.getUploadedBy().getFullName() : null);
                d.setUploadedAt(att.getUploadedAt());
                return d;
            }).toList());
        }

        return res;
    }

    @Transactional
    public ApprovalRequestDto.Response update(
            Long requestId, ApprovalRequestDto.CreateRequest dto, String username) {
        ApprovalRequest request = getRequestOrThrow(requestId);
        validateOwnership(request, username);

        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể cập nhật yêu cầu ở trạng thái Nháp");
        }

        RequestType requestType = requestTypeRepository.findById(dto.getRequestTypeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu"));

        Workflow workflow = workflowRepository
                .findFirstByRequestTypeIdAndActiveTrueOrderByVersionDesc(dto.getRequestTypeId())
                .orElse(null);

        request.setTitle(dto.getTitle());
        request.setRequestType(requestType);
        request.setWorkflow(workflow);
        request.setFormData(dto.getFormData());
        request.setAmount(dto.getAmount());
        request.setPriority(dto.getPriority());
        request.setNote(dto.getNote());

        return toResponse(requestRepository.save(request));
    }

    public boolean isUserEligibleToApprove(User user, ApprovalRequest request) {
        if (request.getStatus() != RequestStatus.IN_PROGRESS || request.getWorkflow() == null) {
            return false;
        }

        WorkflowStep currentStep = request.getWorkflow().getSteps().stream()
                .filter(s -> s.getStepOrder().equals(request.getCurrentStep()))
                .findFirst()
                .orElse(null);

        if (currentStep == null) {
            return false;
        }

        switch (currentStep.getApproverType()) {
            case "SPECIFIC_USER":
                return isUserOrDelegated(user, currentStep.getApproverUser());
            case "ROLE":
                return isUserOrDelegatedByRole(user, currentStep.getApproverRole());
            case "DEPARTMENT_HEAD":
                User manager = null;
                if (currentStep.getApproverDepartment() != null) {
                    manager = currentStep.getApproverDepartment().getManager();
                } else if (request.getRequester().getDepartment() != null) {
                    manager = request.getRequester().getDepartment().getManager();
                }
                return isUserOrDelegated(user, manager);
            default:
                return true;
        }
    }

    private boolean isUserOrDelegated(User loggedInUser, User targetApprover) {
        if (targetApprover == null) return false;
        if (loggedInUser.getId().equals(targetApprover.getId())) {
            return true;
        }
        List<Delegation> activeIncoming = delegationRepository.findByToUserIdOrderByIdDesc(loggedInUser.getId()).stream()
                .filter(d -> d.isActive() && 
                             LocalDateTime.now().isAfter(d.getStartDate()) && 
                             LocalDateTime.now().isBefore(d.getEndDate()))
                .toList();
        return activeIncoming.stream().anyMatch(d -> d.getFromUser().getId().equals(targetApprover.getId()));
    }

    private boolean isUserOrDelegatedByRole(User loggedInUser, String requiredRole) {
        if (requiredRole == null) return false;
        if (loggedInUser.getRole().name().equals(requiredRole)) {
            return true;
        }
        List<Delegation> activeIncoming = delegationRepository.findByToUserIdOrderByIdDesc(loggedInUser.getId()).stream()
                .filter(d -> d.isActive() && 
                             LocalDateTime.now().isAfter(d.getStartDate()) && 
                             LocalDateTime.now().isBefore(d.getEndDate()))
                .toList();
        return activeIncoming.stream().anyMatch(d -> d.getFromUser().getRole().name().equals(requiredRole));
    }

    public Page<ApprovalRequestDto.Response> getPending(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        java.util.List<ApprovalRequest> allPending = requestRepository.findByStatusOrderBySubmittedAtDesc(RequestStatus.IN_PROGRESS);
        java.util.List<ApprovalRequestDto.Response> filtered = allPending.stream()
                .filter(req -> isUserEligibleToApprove(user, req))
                .map(this::toResponse)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());

        if (start > filtered.size()) {
            return new org.springframework.data.domain.PageImpl<>(java.util.Collections.emptyList(), pageable, filtered.size());
        }

        return new org.springframework.data.domain.PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    public byte[] exportToExcel(RequestStatus status) throws java.io.IOException {
        java.util.List<ApprovalRequest> requests;
        if (status != null) {
            requests = requestRepository.findByStatusOrderBySubmittedAtDesc(status);
        } else {
            requests = requestRepository.findAllByOrderByCreatedAtDesc();
        }

        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Yêu cầu phê duyệt");

            // Header Style
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Headers
            String[] headers = {"Mã yêu cầu", "Tiêu đề", "Loại yêu cầu", "Người tạo", "Số tiền", "Mức ưu tiên", "Trạng thái", "Ngày tạo"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (ApprovalRequest req : requests) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(req.getRequestNumber());
                row.createCell(1).setCellValue(req.getTitle());
                row.createCell(2).setCellValue(req.getRequestType().getName());
                row.createCell(3).setCellValue(req.getRequester().getFullName());
                if (req.getAmount() != null) {
                    row.createCell(4).setCellValue(req.getAmount().doubleValue());
                } else {
                    row.createCell(4).setCellValue("");
                }
                row.createCell(5).setCellValue(req.getPriority());
                row.createCell(6).setCellValue(req.getStatus().name());
                row.createCell(7).setCellValue(req.getCreatedAt().toString());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public void notifyEligibleApprovers(ApprovalRequest request) {
        if (request.getStatus() != RequestStatus.IN_PROGRESS) return;
        List<User> activeUsers = userRepository.findByActiveTrue();
        for (User user : activeUsers) {
            if (isUserEligibleToApprove(user, request)) {
                notificationService.sendNotification(
                        user,
                        request,
                        "NEW_REQUEST",
                        "Yêu cầu mới chờ duyệt: " + request.getRequestNumber(),
                        "Yêu cầu '" + request.getTitle() + "' được gửi bởi " + request.getRequester().getFullName() + " đang chờ bạn phê duyệt."
                );
            }
        }
    }
}