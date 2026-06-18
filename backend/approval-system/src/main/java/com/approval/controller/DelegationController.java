package com.approval.controller;

import com.approval.dto.DelegationDto;
import com.approval.entity.Delegation;
import com.approval.entity.User;
import com.approval.repository.DelegationRepository;
import com.approval.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/delegations")
@RequiredArgsConstructor
public class DelegationController {

    private final DelegationRepository delegationRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody DelegationDto.CreateRequest dto,
            Authentication auth) {

        User fromUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        User toUser = userRepository.findById(dto.getToUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận ủy quyền"));

        if (fromUser.getId().equals(toUser.getId())) {
            throw new RuntimeException("Không thể tự ủy quyền cho chính mình");
        }

        Delegation delegation = Delegation.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .active(true)
                .build();

        Delegation saved = delegationRepository.save(delegation);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping("/my")
    public ResponseEntity<List<DelegationDto.Response>> getMyDelegations(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        List<Delegation> list = delegationRepository.findByFromUserIdOrderByIdDesc(user.getId());
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<DelegationDto.Response>> getIncomingDelegations(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        List<Delegation> list = delegationRepository.findByToUserIdOrderByIdDesc(user.getId());
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Authentication auth) {
        Delegation delegation = delegationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi ủy quyền"));

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Chỉ cho phép người ủy quyền hủy
        if (!delegation.getFromUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }

        delegation.setActive(false);
        delegationRepository.save(delegation);
        return ResponseEntity.noContent().build();
    }

    private DelegationDto.Response toResponse(Delegation d) {
        DelegationDto.Response res = new DelegationDto.Response();
        res.setId(d.getId());
        res.setFromUserId(d.getFromUser().getId());
        res.setFromUserName(d.getFromUser().getFullName());
        res.setToUserId(d.getToUser().getId());
        res.setToUserName(d.getToUser().getFullName());
        res.setStartDate(d.getStartDate());
        res.setEndDate(d.getEndDate());
        res.setActive(d.isActive());
        res.setCreatedAt(d.getCreatedAt());
        return res;
    }
}
