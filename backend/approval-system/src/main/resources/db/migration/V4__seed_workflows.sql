-- Workflow cho nghỉ phép
INSERT INTO workflows (request_type_id, name, description, is_active, version)
VALUES (
    (SELECT id FROM request_types WHERE code = 'LEAVE'),
    'Quy trình nghỉ phép tiêu chuẩn',
    'Trưởng phòng duyệt → HR xác nhận',
    true, 1
);

INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours)
VALUES
(
    (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn'),
    1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48
),
(
    (SELECT id FROM workflows WHERE name = 'Quy trình nghỉ phép tiêu chuẩn'),
    2, 'HR xác nhận', 'ROLE', 'HR_STAFF', 24
);

-- Workflow cho tạm ứng
INSERT INTO workflows (request_type_id, name, description, is_active, version)
VALUES (
    (SELECT id FROM request_types WHERE code = 'ADVANCE'),
    'Quy trình tạm ứng',
    'Trưởng phòng → Kế toán → Giám đốc',
    true, 1
);

INSERT INTO workflow_steps (workflow_id, step_order, step_name, approver_type, approver_role, timeout_hours)
VALUES
(
    (SELECT id FROM workflows WHERE name = 'Quy trình tạm ứng'),
    1, 'Trưởng phòng phê duyệt', 'ROLE', 'MANAGER', 48
),
(
    (SELECT id FROM workflows WHERE name = 'Quy trình tạm ứng'),
    2, 'Kế toán xác nhận', 'ROLE', 'ACCOUNTANT', 24
),
(
    (SELECT id FROM workflows WHERE name = 'Quy trình tạm ứng'),
    3, 'Giám đốc phê duyệt', 'ROLE', 'DIRECTOR', 72
);