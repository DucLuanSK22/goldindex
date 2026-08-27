# PowerShell Menu Quản lý & Cập nhật giá vàng
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Show-Menu {
    Clear-Host
    Write-Host "==========================================================================" -ForegroundColor Cyan
    Write-Host "         🪙 HỆ THỐNG CẬP NHẬT & QUẢN LÝ GIÁ VÀNG VIỆT NAM 2026           " -ForegroundColor Yellow
    Write-Host "==========================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] TỰ ĐỘNG cập nhật giá vàng hôm nay từ API (Khuyên dùng)" -ForegroundColor Green
    Write-Host "  [2] NHẬP TAY giá vàng thủ công vào file CSV & JSON" -ForegroundColor Cyan
    Write-Host "  [3] TẠO / CẬP NHẬT file Excel 3 Sheet (Theo tuần, Theo tháng, Chi tiết)" -ForegroundColor White
    Write-Host "  [4] KHỞI ĐỘNG Web Dashboard (Localhost:8080)" -ForegroundColor Magenta
    Write-Host "  [5] SỬA LỖI phông chữ tiếng Việt (Fix Encoding)" -ForegroundColor Yellow
    Write-Host "  [0] Thoát chương trình" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "==========================================================================" -ForegroundColor Cyan
}

$running = $true
while ($running) {
    Show-Menu
    $choice = Read-Host "Nhập lựa chọn của bạn [0-5]"
    
    switch ($choice.Trim()) {
        "1" {
            Clear-Host
            Write-Host ">>> ĐANG TỰ ĐỘNG CẬP NHẬT DỮ LIỆU TỪ API..." -ForegroundColor Cyan
            & "$PSScriptRoot\Update_World_Gold.ps1"
            Write-Host "`nNhấn phím bất kỳ để quay lại menu..." -ForegroundColor DarkGray
            [Console]::ReadKey($true) | Out-Null
        }
        "2" {
            Clear-Host
            & "$PSScriptRoot\Manual_Add_Price.ps1"
            Write-Host "`nNhấn phím bất kỳ để quay lại menu..." -ForegroundColor DarkGray
            [Console]::ReadKey($true) | Out-Null
        }
        "3" {
            Clear-Host
            Write-Host ">>> ĐANG HỢP NHẤT DỮ LIỆU THÀNH FILE EXCEL..." -ForegroundColor Cyan
            & "$PSScriptRoot\Consolidate_Excel.ps1"
            Write-Host "`nNhấn phím bất kỳ để quay lại menu..." -ForegroundColor DarkGray
            [Console]::ReadKey($true) | Out-Null
        }
        "4" {
            Clear-Host
            Write-Host ">>> ĐANG MỞ WEB DASHBOARD..." -ForegroundColor Green
            Start-Process "http://localhost:8080"
            node "$PSScriptRoot\server.js"
            Write-Host "`nNhấn phím bất kỳ để quay lại menu..." -ForegroundColor DarkGray
            [Console]::ReadKey($true) | Out-Null
        }
        "5" {
            Clear-Host
            Write-Host ">>> ĐANG CHUẨN HÓA BẢNG MÃ UTF-8..." -ForegroundColor Yellow
            & "$PSScriptRoot\Fix_Encoding.ps1"
            Write-Host "`nNhấn phím bất kỳ để quay lại menu..." -ForegroundColor DarkGray
            [Console]::ReadKey($true) | Out-Null
        }
        "0" {
            $running = $false
            Write-Host "`nTạm biệt! Cảm ơn bạn đã sử dụng." -ForegroundColor Green
        }
        default {
            Write-Host "`nLựa chọn không hợp lệ. Vui lòng chọn từ 0 đến 5." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
