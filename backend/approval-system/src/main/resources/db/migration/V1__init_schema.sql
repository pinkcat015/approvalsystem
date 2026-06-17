-- ============================================================
-- HỆ THỐNG QUẢN LÝ QUY TRÌNH PHÊ DUYỆT NỘI BỘ
-- File: V1__init_schema.sql
-- Mô tả: Khởi tạo toàn bộ schema
-- ============================================================

-- ── BẢNG 1: PHÒNG BAN ────────────────────────────────────────
CREATE TABLE departments (
    id          BIGSERIAL       PRIMARY KEY,
    code        VARCHAR(50)     NOT NULL UNIQUE,
    name        VARCHAR(200)    NOT NULL,
    parent_id   BIGINT          REFERENCES departments(id),
    manager_id  BIGINT,                          -- FK đến users, thêm sau
    description TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  departments            IS 'Phòng ban / cơ cấu tổ chức';
COMMENT ON COLUMN departments.code       IS 'Mã phòng ban, ví dụ: HR, FIN, IT';
COMMENT ON COLUMN departments.parent_id  IS 'Phòng ban cấp cha (NULL nếu là cấp cao nhất)';
COMMENT ON COLUMN departments.manager_id IS 'Trưởng phòng ban';


-- ── BẢNG 2: NGƯỜI DÙNG ───────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(100)    NOT NULL UNIQUE,
    email           VARCHAR(200)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(200)    NOT NULL,
    employee_code   VARCHAR(50)     UNIQUE,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    department_id   BIGINT          REFERENCES departments(id),
    position        VARCHAR(100),
    role            VARCHAR(50)     NOT NULL DEFAULT 'EMPLOYEE',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_role CHECK (
        role IN ('ADMIN','DIRECTOR','MANAGER','HR_STAFF','ACCOUNTANT','EMPLOYEE')
    )
);

COMMENT ON TABLE  users               IS 'Tài khoản người dùng hệ thống';
COMMENT ON COLUMN users.password      IS 'Mật khẩu hash BCrypt, không lưu plain text';
COMMENT ON COLUMN users.role          IS 'Vai trò: ADMIN | DIRECTOR | MANAGER | HR_STAFF | ACCOUNTANT | EMPLOYEE';
COMMENT ON COLUMN users.is_active     IS 'FALSE = tài khoản bị khóa, không đăng nhập được';

-- Thêm FK manager_id vào departments (phải làm sau khi tạo bảng users)
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES users(id);


-- ── BẢNG 3: LOẠI YÊU CẦU ─────────────────────────────────────
CREATE TABLE request_types (
    id                          BIGSERIAL       PRIMARY KEY,
    code                        VARCHAR(50)     NOT NULL UNIQUE,
    name                        VARCHAR(200)    NOT NULL,
    category                    VARCHAR(100),
    description                 TEXT,
    icon                        VARCHAR(100),
    color                       VARCHAR(20),
    requires_attachment         BOOLEAN         NOT NULL DEFAULT FALSE,
    auto_approve_below_amount   DECIMAL(18,2),
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  request_types                        IS 'Danh mục loại yêu cầu phê duyệt';
COMMENT ON COLUMN request_types.code                   IS 'Mã loại: LEAVE, ADVANCE, PAYMENT, PURCHASE...';
COMMENT ON COLUMN request_types.category               IS 'Nhóm: HR, FINANCE, PROCUREMENT';
COMMENT ON COLUMN request_types.icon                   IS 'Tên icon Ant Design, ví dụ: CalendarOutlined';
COMMENT ON COLUMN request_types.color                  IS 'Màu hiển thị, ví dụ: #4CAF50';
COMMENT ON COLUMN request_types.requires_attachment    IS 'Bắt buộc đính kèm file không';
COMMENT ON COLUMN request_types.auto_approve_below_amount IS 'Tự động duyệt nếu số tiền nhỏ hơn mức này';


-- ── BẢNG 4: BIỂU MẪU ─────────────────────────────────────────
CREATE TABLE form_definitions (
    id              BIGSERIAL   PRIMARY KEY,
    request_type_id BIGINT      NOT NULL REFERENCES request_types(id),
    version         INTEGER     NOT NULL DEFAULT 1,
    is_current      BOOLEAN     NOT NULL DEFAULT TRUE,
    schema_json     JSONB       NOT NULL,
    created_by      BIGINT      REFERENCES users(id),
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  form_definitions             IS 'Cấu hình biểu mẫu theo loại yêu cầu';
COMMENT ON COLUMN form_definitions.schema_json IS 'JSON định nghĩa các trường: tên, kiểu, bắt buộc...';
COMMENT ON COLUMN form_definitions.is_current  IS 'Phiên bản đang dùng (chỉ 1 bản is_current=true mỗi loại)';


-- ── BẢNG 5: WORKFLOW ─────────────────────────────────────────
CREATE TABLE workflows (
    id              BIGSERIAL       PRIMARY KEY,
    request_type_id BIGINT          NOT NULL REFERENCES request_types(id),
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    version         INTEGER         NOT NULL DEFAULT 1,
    created_by      BIGINT          REFERENCES users(id),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workflows IS 'Quy trình phê duyệt theo loại yêu cầu';

-- ── BẢNG 6: CÁC BƯỚC TRONG WORKFLOW ──────────────────────────
CREATE TABLE workflow_steps (
    id                      BIGSERIAL       PRIMARY KEY,
    workflow_id             BIGINT          NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order              INTEGER         NOT NULL,
    step_name               VARCHAR(200)    NOT NULL,
    approver_type           VARCHAR(50)     NOT NULL,
    approver_user_id        BIGINT          REFERENCES users(id),
    approver_role           VARCHAR(50),
    approver_department_id  BIGINT          REFERENCES departments(id),
    condition_expression    TEXT,
    timeout_hours           INTEGER         NOT NULL DEFAULT 72,
    is_parallel             BOOLEAN         NOT NULL DEFAULT FALSE,
    allow_delegate          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_approver_type CHECK (
        approver_type IN ('SPECIFIC_USER','DEPARTMENT_HEAD','ROLE','DYNAMIC')
    ),
    CONSTRAINT uq_workflow_step UNIQUE (workflow_id, step_order)
);

COMMENT ON COLUMN workflow_steps.approver_type          IS 'SPECIFIC_USER: 1 người cụ thể | DEPARTMENT_HEAD: trưởng phòng | ROLE: theo vai trò | DYNAMIC: tính lúc runtime';
COMMENT ON COLUMN workflow_steps.timeout_hours          IS 'Số giờ tối đa chờ duyệt, quá hạn sẽ nhắc nhở';
COMMENT ON COLUMN workflow_steps.is_parallel            IS 'TRUE = nhiều người duyệt cùng lúc';
COMMENT ON COLUMN workflow_steps.condition_expression   IS 'Điều kiện để bước này có hiệu lực, ví dụ: amount > 5000000';


-- ── BẢNG 7: YÊU CẦU PHÊ DUYỆT ───────────────────────────────
CREATE TABLE approval_requests (
    id                  BIGSERIAL       PRIMARY KEY,
    request_number      VARCHAR(50)     NOT NULL UNIQUE,
    title               VARCHAR(500)    NOT NULL,
    request_type_id     BIGINT          NOT NULL REFERENCES request_types(id),
    workflow_id         BIGINT          REFERENCES workflows(id),
    requester_id        BIGINT          NOT NULL REFERENCES users(id),
    department_id       BIGINT          REFERENCES departments(id),
    form_data           JSONB           NOT NULL,
    amount              DECIMAL(18,2),
    priority            VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',
    status              VARCHAR(50)     NOT NULL DEFAULT 'DRAFT',
    current_step        INTEGER         NOT NULL DEFAULT 0,
    due_date            TIMESTAMP,
    note                TEXT,
    rejection_reason    TEXT,
    cancelled_reason    TEXT,
    submitted_at        TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_priority CHECK (
        priority IN ('LOW','NORMAL','HIGH','URGENT')
    ),
    CONSTRAINT chk_status CHECK (
        status IN ('DRAFT','IN_PROGRESS','ON_HOLD','APPROVED','REJECTED','CANCELLED')
    )
);

COMMENT ON COLUMN approval_requests.request_number  IS 'Mã yêu cầu tự sinh, ví dụ: REQ-20250601-0001';
COMMENT ON COLUMN approval_requests.form_data       IS 'Dữ liệu biểu mẫu dạng JSON, linh hoạt theo loại';
COMMENT ON COLUMN approval_requests.current_step    IS '0 = chưa nộp, 1 = đang ở bước 1, 2 = bước 2...';
COMMENT ON COLUMN approval_requests.amount          IS 'Số tiền (nếu có), dùng để điều kiện workflow';


-- ── BẢNG 8: LỊCH SỬ HÀNH ĐỘNG ───────────────────────────────
CREATE TABLE approval_actions (
    id                  BIGSERIAL       PRIMARY KEY,
    request_id          BIGINT          NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    workflow_step_id    BIGINT          REFERENCES workflow_steps(id),
    step_order          INTEGER,
    step_name           VARCHAR(200),
    approver_id         BIGINT          NOT NULL REFERENCES users(id),
    action              VARCHAR(50)     NOT NULL,
    comment             TEXT,
    delegate_to_id      BIGINT          REFERENCES users(id),
    action_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address          VARCHAR(50),
    device_info         VARCHAR(200),

    CONSTRAINT chk_action CHECK (
        action IN ('APPROVE','REJECT','REQUEST_INFO','DELEGATE','RECALL')
    )
);

COMMENT ON COLUMN approval_actions.action           IS 'APPROVE: duyệt | REJECT: từ chối | REQUEST_INFO: yêu cầu bổ sung | DELEGATE: ủy quyền | RECALL: thu hồi';
COMMENT ON COLUMN approval_actions.delegate_to_id   IS 'Người được ủy quyền (khi action = DELEGATE)';
COMMENT ON COLUMN approval_actions.ip_address       IS 'IP người thực hiện, dùng cho audit log';


-- ── BẢNG 9: FILE ĐÍNH KÈM ────────────────────────────────────
CREATE TABLE attachments (
    id              BIGSERIAL       PRIMARY KEY,
    request_id      BIGINT          NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    file_name       VARCHAR(255)    NOT NULL,
    original_name   VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    file_size       BIGINT,
    content_type    VARCHAR(100),
    uploaded_by     BIGINT          REFERENCES users(id),
    uploaded_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN attachments.file_name     IS 'Tên file trên server (UUID để tránh trùng)';
COMMENT ON COLUMN attachments.original_name IS 'Tên file gốc người dùng upload lên';
COMMENT ON COLUMN attachments.file_path     IS 'Đường dẫn tương đối trong thư mục uploads/';
COMMENT ON COLUMN attachments.file_size     IS 'Kích thước file tính bằng bytes';


-- ── BẢNG 10: THÔNG BÁO ───────────────────────────────────────
CREATE TABLE notifications (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id  BIGINT          REFERENCES approval_requests(id),
    type        VARCHAR(50)     NOT NULL,
    title       VARCHAR(300)    NOT NULL,
    content     TEXT,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_notif_type CHECK (
        type IN ('NEW_REQUEST','APPROVED','REJECTED','INFO_REQUESTED','REMINDER','DELEGATED')
    )
);

COMMENT ON TABLE  notifications      IS 'Thông báo gửi đến người dùng';
COMMENT ON COLUMN notifications.type IS 'Loại thông báo để frontend hiển thị icon/màu tương ứng';


-- ── INDEXES ──────────────────────────────────────────────────
-- Users
CREATE INDEX idx_users_username     ON users(username);
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_department   ON users(department_id);
CREATE INDEX idx_users_role         ON users(role);

-- Approval requests
CREATE INDEX idx_requests_requester     ON approval_requests(requester_id);
CREATE INDEX idx_requests_status        ON approval_requests(status);
CREATE INDEX idx_requests_type          ON approval_requests(request_type_id);
CREATE INDEX idx_requests_department    ON approval_requests(department_id);
CREATE INDEX idx_requests_submitted     ON approval_requests(submitted_at DESC);
CREATE INDEX idx_requests_number        ON approval_requests(request_number);

-- Approval actions
CREATE INDEX idx_actions_request    ON approval_actions(request_id);
CREATE INDEX idx_actions_approver   ON approval_actions(approver_id);

-- Notifications
CREATE INDEX idx_notif_user_unread  ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created      ON notifications(created_at DESC);

-- Attachments
CREATE INDEX idx_attach_request     ON attachments(request_id);

-- Workflow steps
CREATE INDEX idx_wf_steps_workflow  ON workflow_steps(workflow_id, step_order);