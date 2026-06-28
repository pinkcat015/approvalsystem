-- ============================================================
-- FILE: V8__additional_seed_data.sql
-- DESCRIPTION: Seed mock accounts, workflows, and test requests
-- ============================================================

-- 1. Gán phòng IT cho tài khoản employee1
UPDATE users SET department_id = (SELECT id FROM departments WHERE code = 'IT') WHERE username = 'employee1';

-- 2. Thêm các tài khoản test đại diện các vai trò phê duyệt khác nhau (Mật khẩu: Admin@123)
INSERT INTO users (username, email, password, full_name, employee_code, position, role, department_id) VALUES
('manager', 'manager@company.com', '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a', 'Trần Văn Quản Lý', 'EMP003', 'Trưởng phòng IT', 'MANAGER', (SELECT id FROM departments WHERE code = 'IT')),
('hr', 'hr@company.com', '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a', 'Lê Thị Nhân Sự', 'EMP004', 'Chuyên viên Nhân sự', 'HR_STAFF', (SELECT id FROM departments WHERE code = 'HR')),
('accountant', 'accountant@company.com', '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a', 'Phạm Minh Kế Toán', 'EMP005', 'Kế toán tổng hợp', 'ACCOUNTANT', (SELECT id FROM departments WHERE code = 'FIN')),
('director', 'director@company.com', '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a', 'Nguyễn Thế Giám Đốc', 'EMP006', 'Giám đốc Điều hành', 'DIRECTOR', (SELECT id FROM departments WHERE code = 'CEO')),
('employee2', 'employee2@company.com', '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a', 'Nguyễn Thị B', 'EMP007', 'Nhân viên Phát triển IT', 'EMPLOYEE', (SELECT id FROM departments WHERE code = 'IT'));

-- 3. Cập nhật trưởng bộ phận cho các phòng ban (Chỉ chọn các user đang hoạt động)
UPDATE departments SET manager_id = (SELECT id FROM users WHERE username = 'manager' AND is_active = TRUE) WHERE code = 'IT';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE username = 'hr' AND is_active = TRUE) WHERE code = 'HR';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE username = 'accountant' AND is_active = TRUE) WHERE code = 'FIN';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE username = 'director' AND is_active = TRUE) WHERE code = 'CEO';

-- 4. Thêm các luồng quy trình (workflow) mẫu cho các loại yêu cầu còn lại
INSERT INTO workflows (request_type_id, name, description, is_active, version) VALUES 
((SELECT id FROM request_types WHERE code = 'PAYMENT'), 'Quy trình thanh toán chi phí', 'Trưởng phòng -> Kế toán -> Giám đốc', true, 1),
((SELECT id FROM request_types WHERE code = 'PURCHASE'), 'Quy trình mua sắm trang thiết bị', 'Trưởng phòng -> Kế toán -> Giám đốc', true, 1),
((SELECT id FROM request_types WHERE code = 'RECRUITMENT'), 'Quy trình đề xuất tuyển dụng', 'Trưởng phòng -> HR -> Giám đốc', true, 1),
((SELECT id FROM request_types WHERE code = 'OVERTIME'), 'Quy trình làm thêm giờ', 'Trưởng phòng -> HR', true, 1),
((SELECT id FROM request_types WHERE code = 'BUSINESS_TRIP'), 'Quy trình đi công tác', 'Trưởng phòng -> Kế toán -> HR', true, 1);

-- Thiết lập bước duyệt cho Quy trình thanh toán chi phí
INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours) VALUES
((SELECT id FROM workflows WHERE name = 'Quy trình thanh toán chi phí' AND version = 1), 1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48),
((SELECT id FROM workflows WHERE name = 'Quy trình thanh toán chi phí' AND version = 1), 2, 'Kế toán kiểm tra', 'ROLE', 'ACCOUNTANT', 24),
((SELECT id FROM workflows WHERE name = 'Quy trình thanh toán chi phí' AND version = 1), 3, 'Giám đốc duyệt', 'ROLE', 'DIRECTOR', 72);

-- Thiết lập bước duyệt cho Quy trình mua sắm trang thiết bị
INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours) VALUES
((SELECT id FROM workflows WHERE name = 'Quy trình mua sắm trang thiết bị' AND version = 1), 1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48),
((SELECT id FROM workflows WHERE name = 'Quy trình mua sắm trang thiết bị' AND version = 1), 2, 'Kế toán kiểm tra', 'ROLE', 'ACCOUNTANT', 24),
((SELECT id FROM workflows WHERE name = 'Quy trình mua sắm trang thiết bị' AND version = 1), 3, 'Giám đốc duyệt', 'ROLE', 'DIRECTOR', 72);

-- Thiết lập bước duyệt cho Quy trình đề xuất tuyển dụng
INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours) VALUES
((SELECT id FROM workflows WHERE name = 'Quy trình đề xuất tuyển dụng' AND version = 1), 1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48),
((SELECT id FROM workflows WHERE name = 'Quy trình đề xuất tuyển dụng' AND version = 1), 2, 'HR duyệt & tổng hợp', 'ROLE', 'HR_STAFF', 24),
((SELECT id FROM workflows WHERE name = 'Quy trình đề xuất tuyển dụng' AND version = 1), 3, 'Giám đốc phê duyệt', 'ROLE', 'DIRECTOR', 72);

-- Thiết lập bước duyệt cho Quy trình làm thêm giờ
INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours) VALUES
((SELECT id FROM workflows WHERE name = 'Quy trình làm thêm giờ' AND version = 1), 1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48),
((SELECT id FROM workflows WHERE name = 'Quy trình làm thêm giờ' AND version = 1), 2, 'HR xác nhận', 'ROLE', 'HR_STAFF', 24);

-- Thiết lập bước duyệt cho Quy trình đi công tác
INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours) VALUES
((SELECT id FROM workflows WHERE name = 'Quy trình đi công tác' AND version = 1), 1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48),
((SELECT id FROM workflows WHERE name = 'Quy trình đi công tác' AND version = 1), 2, 'Kế toán tạm ứng', 'ROLE', 'ACCOUNTANT', 24),
((SELECT id FROM workflows WHERE name = 'Quy trình đi công tác' AND version = 1), 3, 'HR lưu hồ sơ', 'ROLE', 'HR_STAFF', 24);

-- 5. Seed các Yêu cầu phê duyệt thử nghiệm (Approval Requests)
-- Yêu cầu 1: Nghỉ phép năm - ĐÃ PHÊ DUYỆT (Nguyễn Văn A)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, submitted_at, completed_at, created_at, updated_at
) VALUES (
    'REQ-20260610-0001',
    'Đơn xin nghỉ phép năm - Nguyễn Văn A',
    (SELECT id FROM request_types WHERE code = 'LEAVE'),
    (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee1' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Nghỉ phép năm đi du lịch cùng gia đình", "fromDate": "2026-06-10", "toDate": "2026-06-14", "totalDays": 5}',
    0.0,
    'NORMAL',
    'APPROVED',
    2,
    '2026-06-10 08:45:00',
    '2026-06-11 15:00:00',
    '2026-06-10 08:30:00',
    '2026-06-11 15:00:00'
);

-- Actions cho Yêu cầu 1
INSERT INTO approval_actions (request_id, workflow_step_id, step_order, step_name, approver_id, action, comment, action_at)
VALUES (
    (SELECT id FROM approval_requests WHERE request_number = 'REQ-20260610-0001'),
    (SELECT id FROM workflow_steps WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn') AND step_order = 1),
    1, 'Trưởng phòng phê duyệt',
    (SELECT id FROM users WHERE username = 'manager' AND is_active = TRUE),
    'APPROVE', 'Đồng ý cho nhân viên nghỉ phép, công việc đã bàn giao cho đồng nghiệp.',
    '2026-06-10 14:20:00'
), (
    (SELECT id FROM approval_requests WHERE request_number = 'REQ-20260610-0001'),
    (SELECT id FROM workflow_steps WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn') AND step_order = 2),
    2, 'HR xác nhận',
    (SELECT id FROM users WHERE username = 'hr' AND is_active = TRUE),
    'APPROVE', 'Đã duyệt ghi nhận ngày nghỉ phép năm theo quy định.',
    '2026-06-11 15:00:00'
);

-- Yêu cầu 2: Nghỉ phép bệnh - ĐANG CHỜ DUYỆT BƯỚC 1 (Nguyễn Văn A)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, submitted_at, created_at, updated_at
) VALUES (
    'REQ-20260620-0001',
    'Đơn xin nghỉ phép bệnh - Nguyễn Văn A',
    (SELECT id FROM request_types WHERE code = 'LEAVE'),
    (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee1' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Nghỉ ốm đi khám bệnh sốt xuất huyết tại bệnh viện", "fromDate": "2026-06-20", "toDate": "2026-06-21", "totalDays": 2}',
    0.0,
    'HIGH',
    'IN_PROGRESS',
    1,
    '2026-06-20 08:15:00',
    '2026-06-20 08:00:00',
    '2026-06-20 08:15:00'
);

-- Yêu cầu 3: Tạm ứng - ĐANG CHỜ DUYỆT BƯỚC 2 (Đã duyệt bước 1 bởi Manager, chờ Kế toán)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, submitted_at, created_at, updated_at
) VALUES (
    'REQ-20260618-0002',
    'Tạm ứng chi phí đi công tác TP.HCM - Nguyễn Văn A',
    (SELECT id FROM request_types WHERE code = 'ADVANCE'),
    (SELECT id FROM workflows WHERE name = 'Quy trình tạm ứng' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee1' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Tạm ứng chi phí máy bay và khách sạn hội nghị đối tác", "amount": 5000000}',
    5000000.0,
    'NORMAL',
    'IN_PROGRESS',
    2,
    '2026-06-18 09:10:00',
    '2026-06-18 09:00:00',
    '2026-06-18 11:30:00'
);

-- Actions cho Yêu cầu 3
INSERT INTO approval_actions (request_id, workflow_step_id, step_order, step_name, approver_id, action, comment, action_at)
VALUES (
    (SELECT id FROM approval_requests WHERE request_number = 'REQ-20260618-0002'),
    (SELECT id FROM workflow_steps WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'Quy trình tạm ứng') AND step_order = 1),
    1, 'Trưởng phòng phê duyệt',
    (SELECT id FROM users WHERE username = 'manager' AND is_active = TRUE),
    'APPROVE', 'Đồng ý phê duyệt cử nhân sự tham gia hội thảo đối tác tại TP.HCM.',
    '2026-06-18 11:30:00'
);

-- Yêu cầu 4: Thanh toán - BẢN NHÁP (Nguyễn Văn A)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, created_at, updated_at
) VALUES (
    'REQ-20260620-0002',
    'Thanh toán hóa đơn tiếp khách đối tác dự án Cloud',
    (SELECT id FROM request_types WHERE code = 'PAYMENT'),
    (SELECT id FROM workflows WHERE name = 'Quy trình thanh toán chi phí' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee1' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Chi phí tiếp khách đối tác phát triển", "amount": 2500000}',
    2500000.0,
    'NORMAL',
    'DRAFT',
    0,
    '2026-06-20 10:00:00',
    '2026-06-20 10:00:00'
);

-- Yêu cầu 5: Mua sắm - BỊ TỪ CHỐI (Bởi Manager)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, submitted_at, completed_at, rejection_reason, created_at, updated_at
) VALUES (
    'REQ-20260615-0001',
    'Đề xuất mua sắm bàn phím cơ Logitech MX Mechanical',
    (SELECT id FROM request_types WHERE code = 'PURCHASE'),
    (SELECT id FROM workflows WHERE name = 'Quy trình mua sắm trang thiết bị' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee1' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Bàn phím làm việc chống mỏi tay cho nhân sự lập trình", "amount": 4200000}',
    4200000.0,
    'LOW',
    'REJECTED',
    1,
    '2026-06-15 14:30:00',
    '2026-06-16 10:00:00',
    'Vượt định mức mua sắm công cụ dụng cụ cá nhân hàng năm cho nhân sự cấp này.',
    '2026-06-15 14:00:00',
    '2026-06-16 10:00:00'
);

-- Actions cho Yêu cầu 5
INSERT INTO approval_actions (request_id, workflow_step_id, step_order, step_name, approver_id, action, comment, action_at)
VALUES (
    (SELECT id FROM approval_requests WHERE request_number = 'REQ-20260615-0001'),
    (SELECT id FROM workflow_steps WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'Quy trình mua sắm trang thiết bị') AND step_order = 1),
    1, 'Trưởng phòng phê duyệt',
    (SELECT id FROM users WHERE username = 'manager' AND is_active = TRUE),
    'REJECT', 'Vượt định mức mua sắm công cụ dụng cụ cá nhân hàng năm cho nhân sự cấp này.',
    '2026-06-16 10:00:00'
);

-- Yêu cầu 6: Làm thêm giờ - ĐANG CHỜ DUYỆT BƯỚC 1 (Nguyễn Thị B, chờ Trưởng phòng IT duyệt)
INSERT INTO approval_requests (
    request_number, title, request_type_id, workflow_id, requester_id, department_id,
    form_data, amount, priority, status, current_step, submitted_at, created_at, updated_at
) VALUES (
    'REQ-20260620-0003',
    'Đề xuất làm thêm giờ hỗ trợ golive hệ thống - Nguyễn Thị B',
    (SELECT id FROM request_types WHERE code = 'OVERTIME'),
    (SELECT id FROM workflows WHERE name = 'Quy trình làm thêm giờ' AND version = 1),
    (SELECT id FROM users WHERE username = 'employee2' AND is_active = TRUE),
    (SELECT id FROM departments WHERE code = 'IT'),
    '{"reason": "Hỗ trợ golive và monitor hệ thống lúc nửa đêm", "overtimeHours": 4}',
    0.0,
    'URGENT',
    'IN_PROGRESS',
    1,
    '2026-06-20 11:00:00',
    '2026-06-20 10:30:00',
    '2026-06-20 11:00:00'
);
