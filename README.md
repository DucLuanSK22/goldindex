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

Chạy kịch bản PowerShell để tự động thu thập từ API và đồng bộ toàn bộ file:
```powershell
powershell -ExecutionPolicy Bypass -File Update_World_Gold.ps1
```

---

## 📂 Cấu Trúc Dự Án

```
Gold/
├── index.html                           # Giao diện Web Dashboard
├── styles.css                           # Styling Dark Metallic & Glassmorphic
├── app.js                               # Logic xử lý chỉ số, Chart.js & Table
├── gold_data.json                       # Bộ dữ liệu JSON nạp cho trang Web
├── server.js                            # Static HTTP Server Node.js
├── Update_World_Gold.ps1                # Script PowerShell tự động cập nhật API & Excel/CSV
├── Collect_SJC_Gold.ps1                 # Script thu thập giá vàng SJC
├── Fix_Encoding.ps1                     # Script chuẩn hóa mã hóa Unicode UTF-8
├── Theo dõi giá vàng.xlsx               # File Excel theo dõi chính của người dùng
├── Gia_Vang_Nhan_SJC_2026.csv           # File CSV mã hóa UTF-8 BOM
├── Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv# File CSV UTF-16LE dành cho MS Excel
└── Gia_Vang_Nhan_SJC_2026.xls           # File Excel HTML Spreadsheet
```

---
© 2026 DucLuanSK22 | Gold Index Project
