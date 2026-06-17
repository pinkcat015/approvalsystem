package com.approval.controller;

import com.approval.dto.UserDto;
import com.approval.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto.Response>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PostMapping
    public ResponseEntity<UserDto.Response> create(
            @RequestBody UserDto.CreateRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto.Response> update(
            @PathVariable Long id,
            @RequestBody UserDto.UpdateRequest dto) {
        return ResponseEntity.ok(userService.update(id, dto));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @RequestBody UserDto.ChangePasswordRequest dto) {
        userService.resetPassword(id, dto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}