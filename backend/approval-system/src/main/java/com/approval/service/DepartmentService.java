package com.approval.service;

import com.approval.dto.DepartmentDto;
import com.approval.entity.Department;
import com.approval.entity.User;
import com.approval.repository.DepartmentRepository;
import com.approval.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    // Lấy tất cả phòng ban
    public List<DepartmentDto.Response> getAll() {
        return departmentRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Lấy 1 phòng ban
    public DepartmentDto.Response getById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban ID: " + id));
        return toResponse(dept);
    }

    // Tạo phòng ban mới
    @Transactional
    public DepartmentDto.Response create(DepartmentDto.CreateRequest dto) {
        if (departmentRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Mã phòng ban đã tồn tại: " + dto.getCode());
        }

        Department dept = Department.builder()
                .code(dto.getCode().toUpperCase())
                .name(dto.getName())
                .description(dto.getDescription())
                .active(true)
                .build();

        // Set phòng ban cha nếu có
        if (dto.getParentId() != null) {
            Department parent = departmentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban cha"));
            dept.setParent(parent);
        }

        // Set trưởng phòng nếu có
        if (dto.getManagerId() != null) {
            User manager = userRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
            dept.setManager(manager);
        }

        return toResponse(departmentRepository.save(dept));
    }

    // Cập nhật phòng ban
    @Transactional
    public DepartmentDto.Response update(Long id, DepartmentDto.UpdateRequest dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));

        if (dto.getName() != null) dept.setName(dto.getName());
        if (dto.getDescription() != null) dept.setDescription(dto.getDescription());
        if (dto.getActive() != null) dept.setActive(dto.getActive());

        if (dto.getParentId() != null) {
            Department parent = departmentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban cha"));
            dept.setParent(parent);
        }

        if (dto.getManagerId() != null) {
            User manager = userRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
            dept.setManager(manager);
        }

        return toResponse(departmentRepository.save(dept));
    }

    // Xóa mềm phòng ban
    @Transactional
    public void delete(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
        dept.setActive(false);
        departmentRepository.save(dept);
    }

    // Convert Entity → DTO
    private DepartmentDto.Response toResponse(Department dept) {
        DepartmentDto.Response res = new DepartmentDto.Response();
        res.setId(dept.getId());
        res.setCode(dept.getCode());
        res.setName(dept.getName());
        res.setDescription(dept.getDescription());
        res.setActive(dept.isActive());
        res.setCreatedAt(dept.getCreatedAt());

        if (dept.getParent() != null) {
            res.setParentId(dept.getParent().getId());
            res.setParentName(dept.getParent().getName());
        }

        if (dept.getManager() != null) {
            res.setManagerId(dept.getManager().getId());
            res.setManagerName(dept.getManager().getFullName());
        }

        return res;
    }
}