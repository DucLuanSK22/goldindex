# 🪙 Gold Index 2026 Dashboard & Data Analytics

Hệ thống theo dõi, cập nhật và phân tích chỉ số **Giá Vàng Việt Nam (SJC Nhẫn 9999 & SJC Miếng)** và **Giá Vàng Thế Giới (XAU/USD)** với biểu đồ đồ họa tương tác cao cấp.

![Gold Index 2026](https://img.shields.io/badge/Status-Active-emerald?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-gold?style=for-the-badge&logo=javascript)
![Chart.js](https://img.shields.io/badge/Chart.js-v4.0-purple?style=for-the-badge)
![PowerShell](https://img.shields.io/badge/PowerShell-v7.0+-blue?style=for-the-badge&logo=powershell)

---

## 🌟 Tính Năng Nổi Bật

- **📊 Bảng Chỉ Số Real-time**:
  - **Vàng Nhẫn SJC 9999**: Giá mua, giá bán & mức tăng/giảm trong ngày.
  - **Vàng Miếng SJC (L1-L10)**: Giá mua, giá bán.
  - **Vàng Thế Giới (XAU/USD)**: Giá gốc USD/oz & giá quy đổi ra VNĐ/lượng.
  - **Chỉ Số Chênh Lệch Trong Nước vs Thế Giới**: Tự động tính khoảng chênh lệch và phần trăm cao hơn thị trường quốc tế.

- **📈 Biểu Đồ Đồ Họa Tương Tác**:
  - So sánh đường xu hướng 3 giá vàng (Nét liền tím độc đáo cho Vàng thế giới).
  - Tích chọn Checkbox bật/tắt linh hoạt từng đường giá vàng.
  - Rê chuột (Hover Tooltip) hiển thị trực tiếp độ chênh lệch giữa Vàng Nhẫn SJC và Vàng Thế Giới.

- **🔍 Bộ Lọc & Tra Cứu Thông Minh**:
  - Lọc theo khoảng ngày (7 Ngày, 30 Ngày, 3 Tháng, Tất cả 2026).
  - Lọc theo Tuần (`Tuần 1` - `Tuần 34`) hoặc Tháng (Tháng 1 - Tháng 8).
  - Tìm kiếm tức thì, phân trang và Xuất báo cáo CSV.

- **⚡ Tự Động Đồng Bộ Dữ Liệu**:
  - Kịch bản PowerShell `Update_World_Gold.ps1` tự động truy xuất API giá vàng và ghi đồng bộ ra 4 file Excel `.xlsx`, 3 file `.csv/.xls` và `gold_data.json`.

---

## 🚀 Hướng Dẫn Chạy Trên Localhost

1. **Khởi động Server Web**:
   ```bash
   node server.js
   ```
2. **Truy cập Trình Duyệt**:
   Mở trình duyệt và truy cập: `http://localhost:8080`

---

## 🔄 Hướng Dẫn Cập Nhật Dữ Liệu Giá Vàng Mới

### Cách 1: Sử dụng File Batch (Click đúp chuột để chạy ngay trên Windows)
- **`Cap_Nhat_Gia_Vang.bat`**: Bảng điều khiển menu tổng hợp (Tự động cập nhật, Nhập tay, Hợp nhất Excel, Mở Web Dashboard).
- **`Cap_Nhat_Tu_Dong.bat`**: 1-Click tự động lấy dữ liệu mới nhất từ API và cập nhật tất cả file.
- **`Nhap_Gia_Vang_Thu_Cong.bat`**: 1-Click để nhập giá vàng thủ công bằng tay.

### Cách 2: Chạy trực tiếp kịch bản PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File Update_World_Gold.ps1
```

---

## 📂 Cấu Trúc Thư Mục Tinh Gọn (Clean Architecture)

```
Gold/
├── ⚡ Nhóm File Batch 1-Click (Dễ dùng nhất)
│   ├── Cap_Nhat_Gia_Vang.bat           # Menu tổng hợp mọi tính năng
│   ├── Cap_Nhat_Tu_Dong.bat            # 1-Click tự động lấy giá mới từ API
│   └── Nhap_Gia_Vang_Thu_Cong.bat      # 1-Click nhập tay giá vàng tùy chỉnh
│
├── 🌐 Nhóm Web Application (Bắt buộc)
│   ├── index.html                      # Giao diện Web Dashboard chính
│   ├── styles.css                      # Styling Dark Gold Metallic & Glassmorphic
│   ├── app.js                          # Logic xử lý chỉ số, Chart.js & Table
│   ├── gold_data.json                  # Bộ dữ liệu JSON nạp cho trang Web
│   └── server.js                       # Static HTTP Server Node.js (Localhost 8080)
│
├── ⚙️ Nhóm Script Tự Động Hóa (Bắt buộc Backend)
│   ├── Update_World_Gold.ps1           # Kịch bản chính tự động thu thập API & đồng bộ
│   ├── Consolidate_Excel.ps1           # Script gộp Excel đa Sheet
│   └── Fix_Encoding.ps1                # Script phụ hỗ trợ chuẩn hóa UTF-8
│
├── 📊 Nhóm Tệp Dữ Liệu Chính (Bắt buộc Data)
│   ├── Theo dõi giá vàng.xlsx          # Tệp Excel theo dõi cá nhân của bạn
│   ├── Gia_Vang_Nhan_SJC_2026.xlsx      # Tệp Excel hợp nhất 3 Sheets (Theo tuần, Theo tháng, Raw)
│   └── Gia_Vang_Nhan_SJC_2026.csv      # Tệp CSV UTF-8 nhẹ dùng cho máy tính đọc/Cache
│
└── 📁 legacy/                          # Thư mục lưu trữ các file cũ/dư thừa (Không cần thiết)
    ├── Collect_SJC_Gold.ps1
    ├── Fix_Excel_Font.ps1
    ├── Gia_Vang_Nhan_SJC_2026.xls
    ├── Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv
    ├── Gia_Vang_Nhan_SJC_2026_xuly.xlsx
    ├── Copy of Gia_Vang_Nhan_SJC_2026_xuly.xlsx
    ├── collect_sjc_gold_ring.py
    └── test_world_gold.ps1
```

---
© 2026 DucLuanSK22 | Gold Index Project
