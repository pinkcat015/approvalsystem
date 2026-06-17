INSERT INTO request_types (code, name, category, description, icon, color, requires_attachment) VALUES
('LEAVE',       'Đơn Xin Nghỉ Phép',       'HR',          'Nghỉ phép năm, phép bệnh, phép đặc biệt',  'CalendarOutlined',   '#52c41a', false),
('ADVANCE',     'Tạm Ứng',                  'FINANCE',     'Tạm ứng tiền công tác, chi phí dự án',     'DollarOutlined',     '#fa8c16', true),
('PAYMENT',     'Thanh Toán',               'FINANCE',     'Thanh toán hóa đơn, chi phí phát sinh',    'CreditCardOutlined', '#f5222d', true),
('PURCHASE',    'Mua Sắm',                  'PROCUREMENT', 'Mua sắm thiết bị, vật tư văn phòng',       'ShoppingCartOutlined','#1890ff', true),
('RECRUITMENT', 'Đề Xuất Tuyển Dụng',       'HR',          'Đề xuất tuyển dụng nhân sự mới',           'TeamOutlined',       '#722ed1', false),
('OVERTIME',    'Làm Thêm Giờ',             'HR',          'Đề xuất làm thêm giờ',                     'ClockCircleOutlined','#13c2c2', false),
('BUSINESS_TRIP','Công Tác',               'HR',          'Đề xuất công tác trong nước, nước ngoài',  'CarOutlined',        '#eb2f96', true);