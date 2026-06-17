package com.approval.controller;

import com.approval.dto.LoginRequest;
import com.approval.dto.LoginResponse;
import com.approval.entity.User;
import com.approval.repository.UserRepository;
import com.approval.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getUsername(),
                    request.getPassword()
                )
            );

            User user = userRepository
                .findByUsername(request.getUsername())
                .orElseThrow();

            String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getRole().name()
            );

            return ResponseEntity.ok(new LoginResponse(
                token,
                user.getUsername(),
                user.getFullName(),
                user.getRole().name()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                .body("Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("Không tìm thấy user")
            );

        return ResponseEntity.ok(new LoginResponse(
            null,
            user.getUsername(),
            user.getFullName(),
            user.getRole().name()
        ));
    }
}