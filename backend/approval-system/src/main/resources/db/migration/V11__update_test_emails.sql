-- Cập nhật email thật dùng Gmail plus addressing để tránh vi phạm unique constraint idx_unique_active_email
UPDATE users SET email = 'truongminhtrang012@gmail.com' WHERE username = 'employee1';
UPDATE users SET email = 'pinkcatt015@gmail.com' WHERE username = 'manager';
UPDATE users SET email = 'minhtrangmeomeo123+hr@gmail.com' WHERE username = 'hr';
UPDATE users SET email = 'minhtrangmeomeo123+accountant@gmail.com' WHERE username = 'accountant';
UPDATE users SET email = 'minhtrangmeomeo123+director@gmail.com' WHERE username = 'director';
UPDATE users SET email = 'minhtrangmeomeo123+admin@gmail.com' WHERE username = 'admin';
UPDATE users SET email = 'minhtrangmeomeo123+employee2@gmail.com' WHERE username = 'employee2';
