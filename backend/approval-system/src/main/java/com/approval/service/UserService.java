package com.approval.service;

import com.approval.dto.UserDto;
import com.approval.entity.Department;
import com.approval.entity.User;
import com.approval.enums.UserRole;
import com.approval.repository.DepartmentRepository;
import com.approval.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto.Response> getAll() {
        return userRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserDto.Response getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + id));
        return toResponse(user);
    }

    @Transactional
    public UserDto.Response create(UserDto.CreateRequest dto) {
        if (userRepository.existsByUsernameAndActiveTrue(dto.getUsername().trim())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại ở một tài khoản khác đang hoạt động: " + dto.getUsername().trim());
        }
        if (userRepository.existsByEmailAndActiveTrue(dto.getEmail().trim())) {
            throw new RuntimeException("Email đã tồn tại ở một tài khoản khác đang hoạt động: " + dto.getEmail().trim());
        }
        if (dto.getEmployeeCode() != null && !dto.getEmployeeCode().trim().isEmpty()) {
            if (userRepository.existsByEmployeeCodeAndActiveTrue(dto.getEmployeeCode().trim())) {
                throw new RuntimeException("Mã nhân viên đã tồn tại ở một nhân viên khác đang hoạt động: " + dto.getEmployeeCode().trim());
            }
        }

        User user = User.builder()
                .username(dto.getUsername().trim())
                .email(dto.getEmail().trim())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .employeeCode(dto.getEmployeeCode() != null ? dto.getEmployeeCode().trim() : null)
                .phone(dto.getPhone())
                .position(dto.getPosition())
                .role(UserRole.valueOf(dto.getRole()))
                .active(true)
                .build();

        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
            user.setDepartment(dept);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserDto.Response update(Long id, UserDto.UpdateRequest dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if ("admin".equals(user.getUsername())) {
            throw new RuntimeException("Không thể chỉnh sửa thông tin của tài khoản quản trị mặc định (admin).");
        }

        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getPosition() != null) user.setPosition(dto.getPosition());
        if (dto.getRole() != null) user.setRole(UserRole.valueOf(dto.getRole()));
        
        if (dto.getActive() != null) {
            if (dto.getActive() && !user.isActive()) {
                if (user.getEmployeeCode() != null && !user.getEmployeeCode().trim().isEmpty()) {
                    if (userRepository.existsByEmployeeCodeAndActiveTrueAndIdNot(user.getEmployeeCode().trim(), id)) {
                        throw new RuntimeException("Không thể kích hoạt tài khoản vì mã nhân viên " + user.getEmployeeCode() + " đã được sử dụng bởi một tài khoản đang hoạt động khác.");
                    }
                }
                if (userRepository.existsByUsernameAndActiveTrueAndIdNot(user.getUsername(), id)) {
                    throw new RuntimeException("Không thể kích hoạt tài khoản vì tên đăng nhập " + user.getUsername() + " đã được sử dụng bởi một tài khoản đang hoạt động khác.");
                }
                if (userRepository.existsByEmailAndActiveTrueAndIdNot(user.getEmail(), id)) {
                    throw new RuntimeException("Không thể kích hoạt tài khoản vì email " + user.getEmail() + " đã được sử dụng bởi một tài khoản đang hoạt động khác.");
                }
            }
            user.setActive(dto.getActive());
        }

        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
            user.setDepartment(dept);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long id, UserDto.ChangePasswordRequest dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if ("admin".equals(user.getUsername())) {
            throw new RuntimeException("Không thể xóa tài khoản quản trị mặc định (admin).");
        }
        user.setActive(false);
        userRepository.save(user);
    }

    private UserDto.Response toResponse(User user) {
        UserDto.Response res = new UserDto.Response();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setEmployeeCode(user.getEmployeeCode());
        res.setPhone(user.getPhone());
        res.setPosition(user.getPosition());
        res.setRole(user.getRole().name());
        res.setActive(user.isActive());
        res.setLastLogin(user.getLastLogin());
        res.setCreatedAt(user.getCreatedAt());

        if (user.getDepartment() != null) {
            res.setDepartmentId(user.getDepartment().getId());
            res.setDepartmentName(user.getDepartment().getName());
        }

        return res;
    }
}