-- ============================================================
-- V10: Sửa lỗi logic — thêm ràng buộc dữ liệu
-- ============================================================

-- BUG 1 FIX: Ngăn duplicate snapshot khi client retry submit()
-- Đảm bảo mỗi (request, step) chỉ có 1 bản snapshot duy nhất
ALTER TABLE approval_request_steps
    ADD CONSTRAINT uq_request_step_order UNIQUE (request_id, step_order);
