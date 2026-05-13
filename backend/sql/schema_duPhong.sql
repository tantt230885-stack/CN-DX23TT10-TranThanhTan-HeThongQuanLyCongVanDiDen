-- ============================================================
-- HỆ THỐNG QUẢN LÝ CÔNG VĂN — schema chính
-- ============================================================
DROP DATABASE IF EXISTS qlcv;
CREATE DATABASE qlcv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qlcv;

-- Bảng phòng ban
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_phong_ban VARCHAR(150) NOT NULL,
  mo_ta VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng người dùng — 4 vai trò: admin, van_thu, truong_phong, phong_ban
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  role ENUM('admin','van_thu','truong_phong','phong_ban') NOT NULL DEFAULT 'phong_ban',
  department_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL
);
CREATE INDEX idx_users_role ON users(role);

-- Danh mục loại công văn (quyết định, thông báo, công văn, ...)
CREATE TABLE cong_van_loai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_loai VARCHAR(100) NOT NULL,
  mo_ta VARCHAR(255)
);

-- Bảng công văn (cả đến và đi)
CREATE TABLE cong_van (
  id INT AUTO_INCREMENT PRIMARY KEY,
  so_cong_van VARCHAR(50) NOT NULL,                 -- số hiệu công văn
  trich_yeu TEXT NOT NULL,                          -- nội dung trích yếu
  loai_id INT NOT NULL,                             -- FK tới cong_van_loai
  loai_cong_van ENUM('den','di') NOT NULL,          -- công văn đến / đi
  ngay_ban_hanh DATE,
  ngay_tiep_nhan DATE,
  noi_gui VARCHAR(255),                             -- với "đến": tên cơ quan gửi
  noi_nhan VARCHAR(255),                            -- với "đi": cơ quan nhận
  do_khan ENUM('thuong','khan','hoa_toc') NOT NULL DEFAULT 'thuong',
  current_department_id INT NULL,                   -- phòng ban đang giữ/xử lý
  status ENUM('moi','dang_xu_ly','da_xu_ly','luu_tru') NOT NULL DEFAULT 'moi',
  created_by INT NOT NULL,                          -- văn thư tạo bản ghi
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cv_loai FOREIGN KEY (loai_id) REFERENCES cong_van_loai(id),
  CONSTRAINT fk_cv_dept FOREIGN KEY (current_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_cv_user FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE INDEX idx_cv_status ON cong_van(status);
CREATE INDEX idx_cv_loai_cv ON cong_van(loai_cong_van);
CREATE INDEX idx_cv_current_dept ON cong_van(current_department_id);
CREATE INDEX idx_cv_created_at ON cong_van(created_at);

-- File PDF đính kèm (1-n: một công văn có thể có nhiều file)
CREATE TABLE cong_van_file (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cong_van_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,                  -- đường dẫn tương đối từ uploads/
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_file_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van(id) ON DELETE CASCADE
);

-- Lịch sử chuyển tiếp công văn giữa các phòng ban
CREATE TABLE cong_van_chuyen_tiep (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cong_van_id INT NOT NULL,
  from_department_id INT NULL,                      -- NULL = từ văn thư
  to_department_id INT NOT NULL,
  forwarded_by INT NOT NULL,                        -- user thực hiện chuyển
  ghi_chu TEXT,
  status_at_forward VARCHAR(30),                    -- snapshot trạng thái lúc chuyển
  forwarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ct_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_from FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_ct_to FOREIGN KEY (to_department_id) REFERENCES departments(id),
  CONSTRAINT fk_ct_user FOREIGN KEY (forwarded_by) REFERENCES users(id)
);
CREATE INDEX idx_ct_cv ON cong_van_chuyen_tiep(cong_van_id);

-- Lịch sử xác nhận thực hiện công văn của nhân viên phòng ban
CREATE TABLE cong_van_xac_nhan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cong_van_id INT NOT NULL,
  confirmed_by INT NOT NULL,               -- user thực hiện xác nhận
  noi_dung TEXT,                           -- nội dung thực hiện (tùy chọn)
  confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_xn_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van(id) ON DELETE CASCADE,
  CONSTRAINT fk_xn_user FOREIGN KEY (confirmed_by) REFERENCES users(id),
  UNIQUE KEY uq_xn_user_cv (cong_van_id, confirmed_by)  -- mỗi nhân viên chỉ xác nhận 1 lần/công văn
);
CREATE INDEX idx_xn_cv ON cong_van_xac_nhan(cong_van_id);

-- ============================================================
-- DỮ LIỆU MẪU (SEED)  
mật khẩu admin: 123
mật khẩu các tài khoản: 1
-- ============================================================


----table Cong_Van---
INSERT INTO cong_van VALUES (1,'QĐ 679','Hướng dẫn bảng kê',2,'den','2026-05-08',NULL,'Bộ Y Tế',NULL,'thuong',1,'da_xu_ly',1,'2026-05-08 14:08:12','2026-05-09 12:30:51'),(3,'3636','Rà xoát chuyển đối danh mục',1,'den','2026-03-20',NULL,'Sở Y tế',NULL,'khan',5,'da_xu_ly',2,'2026-05-11 11:00:02','2026-05-11 11:09:58'),(4,'123','Hướng dẫn sử dụng HS thay thế',3,'den','2026-05-07',NULL,'BHYT',NULL,'thuong',NULL,'moi',12,'2026-05-11 14:20:51','2026-05-11 14:20:51'),(5,'456','Giấy mời họp',5,'den','2026-05-09','2026-05-11','BYT',NULL,'thuong',NULL,'moi',12,'2026-05-11 14:22:24','2026-05-11 14:24:02');

---cong_van_file----

INSERT INTO cong_van_file VALUES (1,1,'2026_QÄ 697-BYT-HD ghi báº£ng kÃª chi phÃ­ KCB.pdf','2026-05/1778224092363-2026_Q_697-BYT-HD_ghi_b_ng_k_chi_ph_KCB.pdf',972643,'application/pdf','2026-05-08 14:08:12'),
(3,3,'47060_CVDEN(2026321151014339)_3636-SYT-NVY.pdf','2026-05/1778472001993-47060_CVDEN_2026321151014339__3636-SYT-NVY.pdf',1001506,'application/pdf','2026-05-11 11:00:02'),
(4,4,'HSTT_HÆ°á»ng dáº«n sá»­ dá»¥ng há» sÆ¡ thay tháº¿ (2).pdf','2026-05/1778484051905-HSTT_H_ng_d_n_s_d_ng_h_s_thay_th_2_.pdf',697120,'application/pdf','2026-05-11 14:20:51'),
(5,5,'03 GM-BYT.pdf','2026-05/1778484144185-03_GM-BYT.pdf',2921302,'application/pdf','2026-05-11 14:22:24');


----TABLES cong_van_loai---

INSERT INTO cong_van_loai VALUES (1,'Công văn','Công văn hành chính thông thường'),
(2,'Quyết định','Văn bản quyết định'),
(3,'Thông báo','Thông báo nội bộ / liên cơ quan'),
(4,'BYT','Bộ Y Tế'),
(5,'Giấy Mời','Giấy mời'),
(6,'Kế Hoạch','Kế Hoạch');

----TABLES departments----
INSERT INTO departments VALUES (1,'Phòng Hành chính','Quản lý hành chính tổng hợp','2026-05-08 14:00:34'),
(2,'Phòng Kế toán','Tài chính - kế toán','2026-05-08 14:00:34'),
(3,'Phòng Kỹ thuật','Hỗ trợ kỹ thuật và CNTT','2026-05-08 14:00:34'),
(4,'Phòng KHTH','Phòng Kế Hoạch Tổng Hợp','2026-05-11 10:56:02'),
(5,'Khoa Khám Bệnh','Khoa Khánh Bệnh','2026-05-11 10:56:44');

-----TABLES users----
NSERT INTO users VALUES (1,'admin','$2b$10$nddKHTujUsRCRK/L8QhfZOZ47IoVrn/exYEUJvyX5lYse0sKSQ4fm','Quản trị hệ thống','admin@qlcv.local','admin',NULL,1,'2026-05-08 14:00:34'),
(2,'vanthu1','$2b$10$SNd5Av287VeRsYn4V3BijO/EOfW5gjB.h0XIIPN97ID.JEzemfrlS','Nguyễn Văn Thư','vt@qlcv.local','van_thu',1,1,'2026-05-08 14:00:34'),
(7,'lienthi','$2b$10$jGSjpax8BLLOxHexw0KCgeM2R5acV9WieyrfnW6iRS3mSe9ZFoD9K','Trần Thị Liên KT',NULL,'truong_phong',2,1,'2026-05-11 11:01:59'),
(8,'mainguyen','$2b$10$JVQ6IBJ2O0Pr5ZCjoagCJ.CGT8TSBsGo8EQl7Nn6DFEJEmS1r99Sm','Nguyễn Thị Mai','','phong_ban',2,1,'2026-05-11 11:02:19'),
(9,'trungnguyen','$2b$10$HFECw9r586ngBzcis423GOcJnvfCpudDF6okiuSgzFyWVMb5sTpIW','Nguyễn Văn Trung',NULL,'truong_phong',1,1,'2026-05-11 11:03:59'),
(10,'lethi','$2b$10$8gNkzQsdDnoQ5zgnsQNSM.gCjQ1QuaMUDxg/1P6oPztSWHV2hh7dO','Nguyễn Thị Lê',NULL,'phong_ban',1,1,'2026-05-11 11:04:22'),
(11,'phuocbui','$2b$10$w/8L.BsK3a4u6ROfEN54WuJ8LDnE9WwzZ0nK2Rm5Q/e1/Zz45jFXu','Bùi Phước',NULL,'truong_phong',4,1,'2026-05-11 11:04:51'),
(12,'tuyennguyen','$2b$10$JpN3vSMOJgVsdj3aO3jd2edRPlM7yrkAua/a.QytOEHtVN0tVsq9u','Nguyễn Thị Tuyến','','van_thu',4,1,'2026-05-11 11:05:26');


