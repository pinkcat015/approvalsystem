# Viettel Internal Approval System

Hệ thống Phê duyệt Nội bộ doanh nghiệp phục vụ ký duyệt tờ trình đề xuất hành chính và tài chính. Dự án được triển khai trên nền tảng Spring Boot & React, hỗ trợ các quy trình phê duyệt đa cấp linh hoạt và hệ thống lưu trữ chuẩn S3.

---

## Các Tính Năng Nổi Bật (Enterprise Features)

1.  **Biểu thức điều kiện động (Advanced Condition Expression)**: Bỏ qua (skip) các bước duyệt tự động dựa trên biểu thức logic của yêu cầu (sử dụng Spring SpEL) ví dụ: `amount > 5000000`.
2.  **Snapshot Workflow**: Tự động sao chụp cấu hình workflow tại thời điểm gửi tờ trình, đảm bảo tính toàn vẹn của luồng phê duyệt ngay cả khi quy trình gốc bị thay đổi sau này.
3.  **Quản lý Tài liệu đính kèm (S3 Object Storage)**: Hỗ trợ upload hóa đơn, hợp đồng chứng từ phục vụ thanh toán. Lưu trữ an toàn, độc lập (Stateless) theo kiến trúc Cloud-Native thông qua **MinIO** (chuẩn S3 API).
4.  **Hành vi và Trạng thái động (Advanced State Machine)**: Cấu hình linh hoạt hành động khi từ chối (Reject All, Return to Requester, Return to Previous) và luồng xử lý tương tác qua lại (Yêu cầu bổ sung thông tin - Provide Info).
5.  **Tự động xử lý quá hạn (Timeout Scheduler)**: Quét và xử lý tự động các bước duyệt bị tồn đọng quá thời hạn theo cấu hình của từng bước (Tự động duyệt, Từ chối, hoặc Chuyển cấp báo cáo).
6.  **Ủy quyền phê duyệt (Approval Delegation)**: Thiết lập ủy quyền phê duyệt tạm thời cho đồng nghiệp trong khoảng thời gian đi vắng, ghi nhận chi tiết lịch sử ký duyệt thay trong Audit Trail.
7.  **Thông báo thời gian thực (Real-time Notifications)**: Sử dụng WebSocket STOMP đẩy cập nhật tức thời trạng thái phê duyệt lên giao diện web và ghi nhận log gửi email giả lập (SMTP).
8.  **Split Dashboard Insight**: Bảng điều khiển nâng cao hỗ trợ phân tách trực quan số liệu thống kê giữa "Toàn hệ thống" và "Cá nhân" dựa trên vai trò phân quyền (RBAC).
9.  **Xuất báo cáo Excel (Apache POI Report)**: Xuất báo cáo danh sách yêu cầu ra định dạng file Excel `.xlsx` kết hợp các bộ lọc thông minh.
10. **Ràng buộc tài khoản có điều kiện (Active-Only Uniqueness)**: Cho phép tái sử dụng Username/Email/Mã nhân viên khi tài khoản cũ đã bị vô hiệu hóa (soft-delete).
11. **Bảo vệ tài khoản quản trị**: Chặn hoàn toàn việc chỉnh sửa hoặc xóa tài khoản `admin` mặc định từ cả backend lẫn giao diện.

---

## Công Nghệ Sử Dụng (Tech Stack)

*   **Backend**: Java 17, Spring Boot 3.5, Spring Security, JPA Hibernate, AWS SDK S3, WebSocket.
*   **Database**: PostgreSQL 15, Flyway (Migration V1-V11).
*   **Storage**: MinIO (S3 API Compatible).
*   **Frontend**: React 18 (Vite), Ant Design 5 (UI Framework), Axios, `@stomp/stompjs`.
*   **DevOps**: Docker, Docker Compose, Nginx.

---

## Hướng dẫn cài đặt nhanh (Getting Started)

Dự án đã được đóng gói Docker Compose giúp triển khai toàn bộ các dịch vụ (PostgreSQL, MinIO, Backend, Frontend Nginx) chỉ với các bước sau:

### 1. Khởi động các container:
```bash
docker compose up -d --build
```

### 2. Kiểm tra trạng thái hoạt động:
```bash
docker compose ps
```
Nếu thành công, các dịch vụ sẽ ở trạng thái chạy (`Up` / `healthy`):
*   **Frontend**: `http://localhost:80`
*   **Backend API**: `http://localhost:8080/api`
*   **MinIO Console (S3 Storage UI)**: `http://localhost:9001`
*   **Database**: Cổng `5432`

### 3. Đăng nhập thử nghiệm:
Truy cập giao diện `http://localhost` và đăng nhập bằng tài khoản quản trị mặc định:
*   **Username**: `admin`
*   **Password**: `admin123`

Truy cập MinIO Console (`http://localhost:9001`) để quản trị file đính kèm:
*   **Username**: `approval_admin`
*   **Password**: `approval_secret_123`

---

## Báo Cáo Chi Tiết Dự Án
Để xem phân tích kiến trúc chi tiết, sơ đồ thiết kế cơ sở dữ liệu và sơ đồ máy trạng thái (State Machine) của hệ thống, vui lòng tham khảo file báo cáo:
[system_report.md](system_report.md)