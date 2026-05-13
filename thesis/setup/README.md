# HƯỚNG DẪN CHẠY CHƯƠNG TRÌNH

    - Tải 2 thư mục fontend và backend về
    - mở chương trình bằng vscode chọn file/ open folder chọn 2 thư mục mới tải. Nên bỏ 2 folder vào thư mục chung vd: d:/code/quan-ly-cong-van

    -bấm chọn terminal chọn command prompt ( hay lệnh cmd )
    - dùng lệnh cd ./ để đưa về thư mục backend sẽ được như đường dẫn bên dưới
    - vd: D:\Code\quan-ly-cong-van\thesis\setup\backend>
    - bấm npm run dev
    - nếu connected database lỗi thì chưa cài database hoặc kiểm tra kết nối database
    - vào thư mục Backend /.env
            kiểm tra :
            PORT=4000
            DB_HOST=localhost
            DB_PORT=3306
            DB_USER=root
            DB_PASSWORD=123456
            DB_NAME=qlcv
            JWT_SECRET=qlcv_super_secret_change_me
            JWT_EXPIRES_IN=1d
            UPLOAD_DIR=uploads
    - làm tương tự như fontend sẽ có link local trên máy

    - vd: http://localhost:5173/
    - sau đó đăng nhập vào hẹ thống quản lý văn bản: tài khoản: admin  mật khẩu: admi123
