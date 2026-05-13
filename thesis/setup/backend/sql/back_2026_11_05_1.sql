-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: qlcv
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


/*mật khẩu đăng nhập web: admin mật khẩu: admin123
mật khẩu các tài khoản khác : 1 */

DROP DATABASE IF EXISTS qlcv;
CREATE DATABASE qlcv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qlcv;

DROP TABLE IF EXISTS cong_van;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;


---Bảng công văn (cả đến và đi)-----
CREATE TABLE cong_van (
  id int NOT NULL AUTO_INCREMENT,
  so_cong_van varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,   -- số hiệu công văn
  trich_yeu text COLLATE utf8mb4_unicode_ci NOT NULL,            -- nội dung trích yếu
  loai_id int NOT NULL,											-- FK tới cong_van_loai
  loai_cong_van enum('den','di') COLLATE utf8mb4_unicode_ci NOT NULL,	-- công văn đến / đi
  ngay_ban_hanh date DEFAULT NULL,
  ngay_tiep_nhan date DEFAULT NULL,
  noi_gui varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,		 -- với "đến": tên cơ quan gửi
  noi_nhan varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,	-- với "đi": cơ quan nhận	
  do_khan enum('thuong','khan','hoa_toc') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'thuong',
  current_department_id int DEFAULT NULL,							-- phòng ban đang giữ/xử lý
  `status` enum('moi','dang_xu_ly','da_xu_ly','luu_tru') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'moi',
  current_department_id int DEFAULT NULL,							-- văn thư tạo bản ghi
  created_by int NOT NULL,													
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_cv_loai (loai_id),
  KEY fk_cv_user (created_by),
  KEY idx_cv_status (`status`),
  KEY idx_cv_loai_cv (loai_cong_van),
  KEY idx_cv_current_dept (current_department_id),
  KEY idx_cv_created_at (created_at),
  CONSTRAINT fk_cv_dept FOREIGN KEY (current_department_id) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT fk_cv_loai FOREIGN KEY (loai_id) REFERENCES cong_van_loai (id),
  CONSTRAINT fk_cv_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cong_van`
--

LOCK TABLES cong_van WRITE;
/*!40000 ALTER TABLE cong_van DISABLE KEYS */;
INSERT INTO cong_van VALUES (1,'QĐ 679','Hướng dẫn bảng kê',2,'den','2026-05-08',NULL,'Bộ Y Tế',NULL,'thuong',1,'da_xu_ly',1,'2026-05-08 14:08:12','2026-05-09 12:30:51'),(3,'3636','Rà xoát chuyển đối danh mục',1,'den','2026-03-20',NULL,'Sở Y tế',NULL,'khan',5,'da_xu_ly',2,'2026-05-11 11:00:02','2026-05-11 11:09:58'),(4,'123','Hướng dẫn sử dụng HS thay thế',3,'den','2026-05-07',NULL,'BHYT',NULL,'thuong',NULL,'moi',12,'2026-05-11 14:20:51','2026-05-11 14:20:51'),(5,'456','Giấy mời họp',5,'den','2026-05-09','2026-05-11','BYT',NULL,'thuong',NULL,'moi',12,'2026-05-11 14:22:24','2026-05-11 14:24:02');
/*!40000 ALTER TABLE cong_van ENABLE KEYS */;
UNLOCK TABLES;

--
-- -- Lịch sử chuyển tiếp công văn giữa các phòng ban
--

DROP TABLE IF EXISTS cong_van_chuyen_tiep;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE cong_van_chuyen_tiep (
  id int NOT NULL AUTO_INCREMENT,
  cong_van_id int NOT NULL,
  from_department_id int DEFAULT NULL,				-- NULL = từ văn thư
  to_department_id int NOT NULL,
  forwarded_by int NOT NULL,						-- user thực hiện chuyển
  ghi_chu text COLLATE utf8mb4_unicode_ci,
  status_at_forward varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,		-- snapshot trạng thái lúc chuyển
  forwarded_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_ct_from (from_department_id),
  KEY fk_ct_to (to_department_id),
  KEY fk_ct_user (forwarded_by),
  KEY idx_ct_cv (cong_van_id),
  CONSTRAINT fk_ct_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van (id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_from FOREIGN KEY (from_department_id) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT fk_ct_to FOREIGN KEY (to_department_id) REFERENCES departments (id),
  CONSTRAINT fk_ct_user FOREIGN KEY (forwarded_by) REFERENCES users (id)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cong_van_chuyen_tiep`
--

LOCK TABLES cong_van_chuyen_tiep WRITE;
/*!40000 ALTER TABLE cong_van_chuyen_tiep DISABLE KEYS */;
INSERT INTO cong_van_chuyen_tiep VALUES (1,1,NULL,1,1,'ghi chú cho hành chính làm','moi','2026-05-08 14:08:39'),(3,3,NULL,5,2,NULL,'moi','2026-05-11 11:00:16');
/*!40000 ALTER TABLE cong_van_chuyen_tiep ENABLE KEYS */;
UNLOCK TABLES;

--
-- -- File PDF đính kèm (1-n: một công văn có thể có nhiều file)
--

DROP TABLE IF EXISTS cong_van_file;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE cong_van_file (
  id int NOT NULL AUTO_INCREMENT,
  cong_van_id int NOT NULL,
  file_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  file_path varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,			-- đường dẫn tương đối từ uploads/
  file_size int DEFAULT NULL,
  mime_type varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  uploaded_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_file_cv (cong_van_id),
  CONSTRAINT fk_file_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cong_van_file`
--

LOCK TABLES cong_van_file WRITE;
/*!40000 ALTER TABLE cong_van_file DISABLE KEYS */;
INSERT INTO cong_van_file VALUES (1,1,'2026_QÄ 697-BYT-HD ghi báº£ng kÃª chi phÃ­ KCB.pdf','2026-05/1778224092363-2026_Q_697-BYT-HD_ghi_b_ng_k_chi_ph_KCB.pdf',972643,'application/pdf','2026-05-08 14:08:12'),
(3,3,'47060_CVDEN(2026321151014339)_3636-SYT-NVY.pdf','2026-05/1778472001993-47060_CVDEN_2026321151014339__3636-SYT-NVY.pdf',1001506,'application/pdf','2026-05-11 11:00:02'),
(4,4,'HSTT_HÆ°á»ng dáº«n sá»­ dá»¥ng há» sÆ¡ thay tháº¿ (2).pdf','2026-05/1778484051905-HSTT_H_ng_d_n_s_d_ng_h_s_thay_th_2_.pdf',697120,'application/pdf','2026-05-11 14:20:51'),
(5,5,'03 GM-BYT.pdf','2026-05/1778484144185-03_GM-BYT.pdf',2921302,'application/pdf','2026-05-11 14:22:24');
/*!40000 ALTER TABLE cong_van_file ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cong_van_loai`
--

DROP TABLE IF EXISTS cong_van_loai;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE cong_van_loai (
  id int NOT NULL AUTO_INCREMENT,
  ten_loai varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  mo_ta varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cong_van_loai`
--

LOCK TABLES cong_van_loai WRITE;
/*!40000 ALTER TABLE cong_van_loai DISABLE KEYS */;
INSERT INTO cong_van_loai VALUES (1,'Công văn','Công văn hành chính thông thường'),
(2,'Quyết định','Văn bản quyết định'),
(3,'Thông báo','Thông báo nội bộ / liên cơ quan'),
(4,'BYT','Bộ Y Tế'),
(5,'Giấy Mời','Giấy mời'),
(6,'Kế Hoạch','Kế Hoạch');
/*!40000 ALTER TABLE cong_van_loai ENABLE KEYS */;
UNLOCK TABLES;

--
-- -- Lịch sử xác nhận thực hiện công văn của nhân viên phòng ban
--

DROP TABLE IF EXISTS cong_van_xac_nhan;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE cong_van_xac_nhan (
  id int NOT NULL AUTO_INCREMENT,
  cong_van_id int NOT NULL,
  confirmed_by int NOT NULL,					-- user thực hiện xác nhận
  noi_dung text COLLATE utf8mb4_unicode_ci,			-- nội dung thực hiện (tùy chọn)
  confirmed_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_xn_user_cv (cong_van_id,confirmed_by),
  KEY fk_xn_user (confirmed_by),
  KEY idx_xn_cv (cong_van_id),
  CONSTRAINT fk_xn_cv FOREIGN KEY (cong_van_id) REFERENCES cong_van (id) ON DELETE CASCADE,
  CONSTRAINT fk_xn_user FOREIGN KEY (confirmed_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cong_van_xac_nhan`
--

LOCK TABLES cong_van_xac_nhan WRITE;
/*!40000 ALTER TABLE cong_van_xac_nhan DISABLE KEYS */;
/*!40000 ALTER TABLE cong_van_xac_nhan ENABLE KEYS */;
UNLOCK TABLES;

--
-- -- Bảng phòng ban
--

DROP TABLE IF EXISTS departments;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE departments (
  id int NOT NULL AUTO_INCREMENT,
  ten_phong_ban varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  mo_ta varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES departments WRITE;
/*!40000 ALTER TABLE departments DISABLE KEYS */;
INSERT INTO departments VALUES (1,'Phòng Hành chính','Quản lý hành chính tổng hợp','2026-05-08 14:00:34'),
(2,'Phòng Kế toán','Tài chính - kế toán','2026-05-08 14:00:34'),
(3,'Phòng Kỹ thuật','Hỗ trợ kỹ thuật và CNTT','2026-05-08 14:00:34'),
(4,'Phòng KHTH','Phòng Kế Hoạch Tổng Hợp','2026-05-11 10:56:02'),
(5,'Khoa Khám Bệnh','Khoa Khánh Bệnh','2026-05-11 10:56:44');
/*!40000 ALTER TABLE departments ENABLE KEYS */;
UNLOCK TABLES;

--
-- Bảng người dùng — 4 vai trò: admin, van_thu, truong_phong, phong_ban
--

DROP TABLE IF EXISTS users;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE users (
  id int NOT NULL AUTO_INCREMENT,
  username varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  password_hash varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  ho_ten varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  email varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','van_thu','truong_phong','phong_ban') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phong_ban',
  department_id int DEFAULT NULL,
  is_active tinyint(1) NOT NULL DEFAULT '1',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY username (username),
  KEY fk_users_dept (department_id),
  KEY idx_users_role (`role`),
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES users WRITE;
/*!40000 ALTER TABLE users DISABLE KEYS */;
INSERT INTO users VALUES (1,'admin','$2b$10$nddKHTujUsRCRK/L8QhfZOZ47IoVrn/exYEUJvyX5lYse0sKSQ4fm','Quản trị hệ thống','admin@qlcv.local','admin',NULL,1,'2026-05-08 14:00:34'),
(2,'vanthu1','$2b$10$SNd5Av287VeRsYn4V3BijO/EOfW5gjB.h0XIIPN97ID.JEzemfrlS','Nguyễn Văn Thư','vt@qlcv.local','van_thu',1,1,'2026-05-08 14:00:34'),
(7,'lienthi','$2b$10$jGSjpax8BLLOxHexw0KCgeM2R5acV9WieyrfnW6iRS3mSe9ZFoD9K','Trần Thị Liên KT',NULL,'truong_phong',2,1,'2026-05-11 11:01:59'),
(8,'mainguyen','$2b$10$JVQ6IBJ2O0Pr5ZCjoagCJ.CGT8TSBsGo8EQl7Nn6DFEJEmS1r99Sm','Nguyễn Thị Mai','','phong_ban',2,1,'2026-05-11 11:02:19'),
(9,'trungnguyen','$2b$10$HFECw9r586ngBzcis423GOcJnvfCpudDF6okiuSgzFyWVMb5sTpIW','Nguyễn Văn Trung',NULL,'truong_phong',1,1,'2026-05-11 11:03:59'),
(10,'lethi','$2b$10$8gNkzQsdDnoQ5zgnsQNSM.gCjQ1QuaMUDxg/1P6oPztSWHV2hh7dO','Nguyễn Thị Lê',NULL,'phong_ban',1,1,'2026-05-11 11:04:22'),
(11,'phuocbui','$2b$10$w/8L.BsK3a4u6ROfEN54WuJ8LDnE9WwzZ0nK2Rm5Q/e1/Zz45jFXu','Bùi Phước',NULL,'truong_phong',4,1,'2026-05-11 11:04:51'),
(12,'tuyennguyen','$2b$10$JpN3vSMOJgVsdj3aO3jd2edRPlM7yrkAua/a.QytOEHtVN0tVsq9u','Nguyễn Thị Tuyến','','van_thu',4,1,'2026-05-11 11:05:26');
/*!40000 ALTER TABLE users ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-11 15:38:18
