-- ============================================================
-- V9: Cải tiến hệ thống theo góp ý Mentor
-- ============================================================

-- ── 1. MỞ RỘNG CONSTRAINT TRẠNG THÁI ────────────────────────
-- Thêm 3 trạng thái mới: EXPIRED, PARTIALLY_APPROVED, RETURNED
ALTER TABLE approval_requests DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE approval_requests ADD CONSTRAINT chk_status CHECK (
    status IN (
        'DRAFT',
        'IN_PROGRESS',
        'ON_HOLD',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED',
        'PARTIALLY_APPROVED',
        'RETURNED'
    )
);

-- ── 2. CẤU HÌNH ĐỘNG CHO WORKFLOW_STEPS ─────────────────────
-- on_reject_action: hành vi khi bước này bị từ chối
--   REJECT_ALL        = từ chối toàn bộ yêu cầu (mặc định)
--   RETURN_TO_REQUESTER = trả về cho người tạo để chỉnh sửa
--   RETURN_TO_PREVIOUS  = trả về bước ngay trước đó
-- on_timeout_action: hành vi khi bước hết thời gian chờ
--   ESCALATE    = leo thang lên cấp trên (mặc định)
--   AUTO_APPROVE = tự động duyệt bước đó
--   REJECT_ALL   = từ chối toàn bộ yêu cầu
-- required_approvals: số người tối thiểu phải duyệt (luồng song song)
ALTER TABLE workflow_steps
    ADD COLUMN IF NOT EXISTS on_reject_action   VARCHAR(50) NOT NULL DEFAULT 'REJECT_ALL',
    ADD COLUMN IF NOT EXISTS on_timeout_action  VARCHAR(50) NOT NULL DEFAULT 'ESCALATE',
    ADD COLUMN IF NOT EXISTS required_approvals INTEGER     NOT NULL DEFAULT 1;

COMMENT ON COLUMN workflow_steps.on_reject_action   IS 'REJECT_ALL | RETURN_TO_REQUESTER | RETURN_TO_PREVIOUS';
COMMENT ON COLUMN workflow_steps.on_timeout_action  IS 'ESCALATE | AUTO_APPROVE | REJECT_ALL';
COMMENT ON COLUMN workflow_steps.required_approvals IS 'Số người tối thiểu phải duyệt trong bước song song';

-- ── 3. BẢNG SNAPSHOT CÁC BƯỚC KHI SUBMIT ────────────────────
-- Lưu cấu hình từng bước tại thời điểm nộp đơn,
-- tránh bị ảnh hưởng khi Admin thay đổi Workflow sau đó
CREATE TABLE IF NOT EXISTS approval_request_steps (
    id                   BIGSERIAL       PRIMARY KEY,
    request_id           BIGINT          NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_order           INTEGER         NOT NULL,
    step_name            VARCHAR(200)    NOT NULL,
    approver_type        VARCHAR(50)     NOT NULL,
    approver_user_id     BIGINT          REFERENCES users(id),
    approver_role        VARCHAR(50),
    condition_expression TEXT,
    on_reject_action     VARCHAR(50)     NOT NULL DEFAULT 'REJECT_ALL',
    status               VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    -- PENDING | IN_PROGRESS | APPROVED | REJECTED | SKIPPED | RETURNED
    processed_at         TIMESTAMP,
    processed_by         BIGINT          REFERENCES users(id)
);

COMMENT ON TABLE  approval_request_steps         IS 'Snapshot cấu hình các bước duyệt tại thời điểm Submit';
COMMENT ON COLUMN approval_request_steps.status  IS 'PENDING | IN_PROGRESS | APPROVED | REJECTED | SKIPPED | RETURNED';

CREATE INDEX IF NOT EXISTS idx_req_steps_request ON approval_request_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_req_steps_status  ON approval_request_steps(request_id, status);

-- ── 4. OPTIMISTIC LOCKING ────────────────────────────────────
-- Thêm cột version để Spring JPA tự động phát hiện xung đột
-- khi 2 người duyệt cùng một tờ trình cùng lúc
ALTER TABLE approval_requests
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN approval_requests.version IS 'Optimistic locking version, tự tăng mỗi lần update';
