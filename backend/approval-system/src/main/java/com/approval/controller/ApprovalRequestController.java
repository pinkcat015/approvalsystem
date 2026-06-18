package com.approval.controller;

import com.approval.dto.ApprovalRequestDto;
import com.approval.enums.RequestStatus;
import com.approval.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/requests")
@RequiredArgsConstructor
public class ApprovalRequestController {

    private final ApprovalService approvalService;

    @PostMapping
    public ResponseEntity<ApprovalRequestDto.Response> create(
            @RequestBody ApprovalRequestDto.CreateRequest dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApprovalRequestDto.Response> update(
            @PathVariable Long id,
            @RequestBody ApprovalRequestDto.CreateRequest dto,
            Authentication auth) {
        return ResponseEntity.ok(approvalService.update(id, dto, auth.getName()));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApprovalRequestDto.Response> submit(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(approvalService.submit(id, auth.getName()));
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<ApprovalRequestDto.Response> processAction(
            @PathVariable Long id,
            @RequestBody ApprovalRequestDto.ActionRequest dto,
            Authentication auth) {
        return ResponseEntity.ok(approvalService.processAction(id, dto, auth.getName()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApprovalRequestDto.Response> cancel(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            Authentication auth) {
        return ResponseEntity.ok(approvalService.cancel(id, reason, auth.getName()));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ApprovalRequestDto.Response>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) RequestStatus status,
            Authentication auth) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(approvalService.getMyRequests(auth.getName(), status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApprovalRequestDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.getById(id));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) RequestStatus status) throws java.io.IOException {
        byte[] data = approvalService.exportToExcel(status);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"approval_requests.xlsx\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/pending")
    public ResponseEntity<Page<ApprovalRequestDto.Response>> getPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(approvalService.getPending(auth.getName(), pageable));
    }
}