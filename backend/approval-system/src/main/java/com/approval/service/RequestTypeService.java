package com.approval.service;

import com.approval.dto.RequestTypeDto;
import com.approval.entity.RequestType;
import com.approval.repository.RequestTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RequestTypeService {

    private final RequestTypeRepository requestTypeRepository;

    public List<RequestTypeDto.Response> getAll() {
        return requestTypeRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RequestTypeDto.Response getById(Long id) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu ID: " + id));
        return toResponse(requestType);
    }

    @Transactional
    public RequestTypeDto.Response create(RequestTypeDto.CreateRequest dto) {
        if (requestTypeRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Mã loại yêu cầu đã tồn tại: " + dto.getCode());
        }

        RequestType requestType = RequestType.builder()
                .code(dto.getCode().toUpperCase())
                .name(dto.getName())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .icon(dto.getIcon())
                .color(dto.getColor())
                .requiresAttachment(dto.isRequiresAttachment())
                .autoApproveBelowAmount(dto.getAutoApproveBelowAmount())
                .active(true)
                .build();

        return toResponse(requestTypeRepository.save(requestType));
    }

    @Transactional
    public RequestTypeDto.Response update(Long id, RequestTypeDto.UpdateRequest dto) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu"));

        if (dto.getName() != null) requestType.setName(dto.getName());
        if (dto.getCategory() != null) requestType.setCategory(dto.getCategory());
        if (dto.getDescription() != null) requestType.setDescription(dto.getDescription());
        if (dto.getIcon() != null) requestType.setIcon(dto.getIcon());
        if (dto.getColor() != null) requestType.setColor(dto.getColor());
        if (dto.getRequiresAttachment() != null) requestType.setRequiresAttachment(dto.getRequiresAttachment());
        if (dto.getAutoApproveBelowAmount() != null) requestType.setAutoApproveBelowAmount(dto.getAutoApproveBelowAmount());
        if (dto.getActive() != null) requestType.setActive(dto.getActive());

        return toResponse(requestTypeRepository.save(requestType));
    }

    @Transactional
    public void delete(Long id) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu"));
        requestType.setActive(false);
        requestTypeRepository.save(requestType);
    }

    private RequestTypeDto.Response toResponse(RequestType rt) {
        RequestTypeDto.Response res = new RequestTypeDto.Response();
        res.setId(rt.getId());
        res.setCode(rt.getCode());
        res.setName(rt.getName());
        res.setCategory(rt.getCategory());
        res.setDescription(rt.getDescription());
        res.setIcon(rt.getIcon());
        res.setColor(rt.getColor());
        res.setRequiresAttachment(rt.isRequiresAttachment());
        res.setAutoApproveBelowAmount(rt.getAutoApproveBelowAmount());
        res.setActive(rt.isActive());
        res.setCreatedAt(rt.getCreatedAt());
        return res;
    }
}