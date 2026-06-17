package com.approval.controller;

import com.approval.dto.WorkflowDto;
import com.approval.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<WorkflowDto.Response>> getAll() {
        return ResponseEntity.ok(workflowService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.getById(id));
    }

    @GetMapping("/by-request-type/{requestTypeId}")
    public ResponseEntity<List<WorkflowDto.Response>> getByRequestType(
            @PathVariable Long requestTypeId) {
        return ResponseEntity.ok(workflowService.getByRequestType(requestTypeId));
    }

    @PostMapping
    public ResponseEntity<WorkflowDto.Response> create(
            @RequestBody WorkflowDto.CreateRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowDto.Response> update(
            @PathVariable Long id,
            @RequestBody WorkflowDto.UpdateRequest dto) {
        return ResponseEntity.ok(workflowService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workflowService.delete(id);
        return ResponseEntity.noContent().build();
    }
}