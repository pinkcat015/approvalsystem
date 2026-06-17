package com.approval.controller;

import com.approval.dto.DepartmentDto;
import com.approval.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<DepartmentDto.Response>> getAll() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DepartmentDto.Response> create(
            @RequestBody DepartmentDto.CreateRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departmentService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentDto.Response> update(
            @PathVariable Long id,
            @RequestBody DepartmentDto.UpdateRequest dto) {
        return ResponseEntity.ok(departmentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}