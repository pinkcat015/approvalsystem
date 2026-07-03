package com.approval.controller;

import com.approval.entity.User;
import com.approval.enums.RequestStatus;
import com.approval.enums.UserRole;
import com.approval.repository.*;
import com.approval.service.ApprovalService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final WorkflowRepository workflowRepository;
    private final ApprovalRequestRepository requestRepository;
    private final ApprovalService approvalService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        DashboardStats.DashboardStatsBuilder builder = DashboardStats.builder()
                .admin(isAdmin);

        if (isAdmin) {
            builder.totalUsers(userRepository.countByActiveTrue())
                   .totalDepartments(departmentRepository.count())
                   .totalWorkflows(workflowRepository.countByActiveTrue())
                   .totalRequests(requestRepository.count())
                   .draftRequests(requestRepository.countByStatus(RequestStatus.DRAFT))
                   .pendingRequests(requestRepository.countByStatus(RequestStatus.IN_PROGRESS))
                   .personalPendingRequests(approvalService.getPendingCount(username))
                   .approvedRequests(requestRepository.countByStatus(RequestStatus.APPROVED))
                   .rejectedRequests(requestRepository.countByStatus(RequestStatus.REJECTED))
                   .personalDraftRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.DRAFT))
                   .personalApprovedRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.APPROVED))
                   .personalRejectedRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.REJECTED));
        } else {
            builder.totalRequests(requestRepository.countByRequesterId(user.getId()))
                   .draftRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.DRAFT))
                   .pendingRequests(approvalService.getPendingCount(username))
                   .approvedRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.APPROVED))
                   .rejectedRequests(requestRepository.countByRequesterIdAndStatus(user.getId(), RequestStatus.REJECTED));
        }

        return ResponseEntity.ok(builder.build());
    }

    @Data
    @Builder
    public static class DashboardStats {
        private boolean admin;
        private Long totalUsers;
        private Long totalDepartments;
        private Long totalWorkflows;
        private Long totalRequests;
        private Long draftRequests;
        private Long pendingRequests;
        private Long personalPendingRequests;
        private Long approvedRequests;
        private Long rejectedRequests;
        private Long personalDraftRequests;
        private Long personalApprovedRequests;
        private Long personalRejectedRequests;
    }
}
