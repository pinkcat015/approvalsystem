# Viettel Internal Approval System

Hệ thống Phê duyệt Nội bộ doanh nghiệp phục vụ ký duyệt tờ trình đề xuất hành chính và tài chính. Dự án được triển khai trên nền tảng Spring Boot & React, hỗ trợ các quy trình phê duyệt đa cấp linh hoạt.

---

## Các Tính Năng Nổi Bật (Enterprise Features)

1.  **Biểu thức điều kiện động (Advanced Condition Expression)**: Bỏ qua (skip) các bước duyệt tự động dựa trên biểu thức logic của yêu cầu (sử dụng Spring SpEL) ví dụ: `amount > 5000000`.
2.  **Quản lý Tài liệu đính kèm (File Attachments)**: Hỗ trợ upload hóa đơn, hợp đồng chứng từ phục vụ thanh toán kèm theo xác thực ràng buộc động theo loại yêu cầu.
3.  **Ủy quyền phê duyệt (Approval Delegation)**: Thiết lập ủy quyền phê duyệt tạm thời cho đồng nghiệp trong khoảng thời gian đi vắng, ghi nhận chi tiết lịch sử ký duyệt thay.
4.  **Thông báo thời gian thực (Real-time Notifications)**: Sử dụng WebSocket STOMP đẩy cập nhật tức thời trạng thái phê duyệt lên giao diện web và ghi nhận log gửi email giả lập.
5.  **Xuất báo cáo Excel (Apache POI Report)**: Xuất báo cáo danh sách yêu cầu ra định dạng file Excel `.xlsx` kết hợp các bộ lọc thông minh.
6.  **Ràng buộc tài khoản có điều kiện (Active-Only Uniqueness)**: Cho phép tái sử dụng Username/Email/Mã nhân viên khi tài khoản cũ đã bị vô hiệu hóa (soft-delete).
7.  **Bảo vệ tài khoản quản trị**: Chặn hoàn toàn việc chỉnh sửa hoặc xóa tài khoản `admin` mặc định từ cả backend lẫn giao diện.

---

## Công Nghệ Sử Dụng (Tech Stack)

*   **Backend**: Spring Boot 3.5, Spring Security, JPA Hibernate, PostgreSQL, Flyway, Apache POI.
*   **Frontend**: React (Vite), Ant Design 5 (UI Framework), Axios, `@stomp/stompjs`.
*   **DevOps**: Docker, Docker Compose, Nginx.

---

## Hướng dẫn cài đặt nhanh (Getting Started)

Dự án đã được đóng gói Docker Compose giúp triển khai toàn bộ các dịch vụ (PostgreSQL, Backend, Frontend Nginx) chỉ với các bước sau:

### 1. Khởi động các container:
```bash
docker compose up -d --build
```

### 2. Kiểm tra trạng thái hoạt động:
```bash
docker compose ps
```
Nếu thành công, cả 3 dịch vụ sẽ ở trạng thái chạy (`Up` / `healthy`):
*   **Frontend**: `http://localhost:80`
*   **Backend API**: `http://localhost:8080/api`
*   **Database**: Cổng `5432`

### 3. Đăng nhập thử nghiệm:
Truy cập giao diện `http://localhost` và đăng nhập bằng tài khoản quản trị mặc định:
*   **Username**: `admin`
*   **Password**: `admin123`

---

## Báo Cáo Chi Tiết Dự Án
Để xem phân tích kiến trúc chi tiết, sơ đồ thiết kế cơ sở dữ liệu và sơ đồ máy trạng thái (State Machine) của hệ thống, vui lòng tham khảo file báo cáo:
[system_report.md](system_report.md)