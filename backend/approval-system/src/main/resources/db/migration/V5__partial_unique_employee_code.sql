-- File: V5__partial_unique_employee_code.sql
-- Mô tả: Thay thế ràng buộc UNIQUE toàn cục trên employee_code bằng UNIQUE có điều kiện (chỉ áp dụng khi tài khoản hoạt động)

-- 1. Xóa ràng buộc UNIQUE cũ
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employee_code_key;

-- 2. Tạo UNIQUE INDEX có điều kiện (chỉ áp dụng đối với người dùng đang hoạt động is_active = true)
CREATE UNIQUE INDEX idx_unique_active_employee_code 
ON users (employee_code) 
WHERE is_active = true;
