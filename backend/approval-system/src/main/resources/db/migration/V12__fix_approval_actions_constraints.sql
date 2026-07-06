-- ============================================================
-- FILE: V12__fix_approval_actions_constraints.sql
-- DESCRIPTION: Sửa 2 ràng buộc DB để hỗ trợ Scheduler timeout
--   1. approver_id: cho phép NULL (khi hệ thống tự động duyệt, không có người duyệt thật)
--   2. chk_action:  thêm các giá trị action hệ thống (ESCALATE, AUTO_APPROVE, REJECT_ALL, SKIP)
-- ============================================================

-- 1. Cho phép approver_id là NULL (system actions không có approver)
ALTER TABLE approval_actions ALTER COLUMN approver_id DROP NOT NULL;

-- 2. Mở rộng constraint chk_action để bao gồm cả system actions từ Scheduler
ALTER TABLE approval_actions DROP CONSTRAINT IF EXISTS chk_action;
ALTER TABLE approval_actions ADD CONSTRAINT chk_action CHECK (
    action IN (
        'APPROVE',       -- Phê duyệt bởi người dùng
        'REJECT',        -- Từ chối bởi người dùng
        'REQUEST_INFO',  -- Yêu cầu bổ sung thông tin
        'DELEGATE',      -- Ủy quyền
        'RECALL',        -- Thu hồi ủy quyền
        'ESCALATE',      -- Hệ thống leo thang (timeout auto-approve)
        'AUTO_APPROVE',  -- Hệ thống tự động duyệt khi timeout
        'REJECT_ALL',    -- Hệ thống tự động từ chối khi timeout
        'SKIP'           -- Hệ thống bỏ qua bước (không thỏa điều kiện SpEL)
    )
);
