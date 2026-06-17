package com.approval.controller;

import com.approval.dto.RequestTypeDto;
import com.approval.service.RequestTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/request-types")
@RequiredArgsConstructor
public class RequestTypeController {

    private final RequestTypeService requestTypeService;

    @GetMapping
    public ResponseEntity<List<RequestTypeDto.Response>> getAll() {
        return ResponseEntity.ok(requestTypeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestTypeDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(requestTypeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<RequestTypeDto.Response> create(
            @RequestBody RequestTypeDto.CreateRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requestTypeService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequestTypeDto.Response> update(
            @PathVariable Long id,
            @RequestBody RequestTypeDto.UpdateRequest dto) {
        return ResponseEntity.ok(requestTypeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        requestTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}