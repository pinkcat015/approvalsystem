-- Mật khẩu: Admin@123 (đã hash BCrypt)
INSERT INTO users (username, email, password, full_name, employee_code, position, role)
VALUES (
    'admin',
    'admin@company.com',
    '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a',
    'System Administrator',
    'EMP001',
    'Admin',
    'ADMIN'
);

INSERT INTO users (username, email, password, full_name, employee_code, position, role)
VALUES (
    'employee1',
    'employee1@company.com',
    '$2a$10$bhHno0YRvzXVkknBYtgRkeXis/8GA/Wu33uPsIkOe7fKUwNiLyi8a',
    'Nguyễn Văn A',
    'EMP002',
    'Nhân viên',
    'EMPLOYEE'
); 


-- Phòng ban mẫu
INSERT INTO departments (code, name, description) VALUES
('CEO', 'Ban Giám Đốc', 'Ban lãnh đạo công ty'),
('HR', 'Phòng Nhân Sự', 'Quản lý nhân sự và tuyển dụng'),
('FIN', 'Phòng Tài Chính', 'Quản lý tài chính kế toán'),
('IT', 'Phòng Công Nghệ', 'Hạ tầng và phát triển hệ thống'),
('SALE', 'Phòng Kinh Doanh', 'Bán hàng và phát triển thị trường');