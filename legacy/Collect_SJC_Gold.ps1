<#
.SYNOPSIS
    Thu thập lịch sử giá vàng nhẫn SJC (9999) từ 01/01/2026 đến ngày hiện tại.
.REMARK
    [KHÔNG BẮT BUỘC] Kịch bản này chỉ lấy dữ liệu vàng nhẫn SJC.
    Vui lòng dùng Update_World_Gold.ps1 (kịch bản chính) để lấy đầy đủ cả Vàng SJC và Vàng Thế Giới.
.DESCRIPTION
    Kịch bản tự động truy xuất dữ liệu lịch sử giá vàng nhẫn SJC theo từng ngày,
    tính toán các chỉ số chênh lệch mua/bán và xuất ra tệp CSV & Excel.
#>

$startDate = Get-Date "2026-01-01"
$endDate   = (Get-Date).Date

$results = [System.Collections.Generic.List[PSObject]]::new()
$currentDate = $startDate

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " BAT DAU THU THAP GIA VANG NHAN SJC (01/01/2026 - $($endDate.ToString('dd/MM/yyyy')))" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan

$totalDays = ($endDate - $startDate).Days + 1
$count = 0
$viCulture = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")

while ($currentDate -le $endDate) {
    $count++
    $dateStr = $currentDate.ToString("yyyy-MM-dd")
    $dateDisplay = $currentDate.ToString("dd/MM/yyyy")
    $dayOfWeek = $currentDate.ToString("dddd", $viCulture)
    
    $url = "https://www.vang.today/api/prices?date=$dateStr"
    
    $success = $false
    $retry = 0
    
    while (-not $success -and $retry -lt 3) {
        try {
            $response = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "Mozilla/5.0" } -TimeoutSec 10
            if ($response.success -and $response.prices) {
                $sjRing = $response.prices.SJ9999
                $sjcBar  = $response.prices.SJL1L10
                
                if ($sjRing) {
                    $buyLuong  = [double]$sjRing.buy
                    $sellLuong = [double]$sjRing.sell
                    $spread    = $sellLuong - $buyLuong
                    
                    $buyChi    = $buyLuong / 10
                    $sellChi   = $sellLuong / 10
                    
                    $barBuyLuong  = if ($sjcBar) { [double]$sjcBar.buy } else { $null }
                    $barSellLuong = if ($sjcBar) { [double]$sjcBar.sell } else { $null }
                    
                    $obj = [PSCustomObject]@{
                        'Ngay'                    = $dateDisplay
                        'ISO_Date'                = $dateStr
                        'Thu'                     = $dayOfWeek
                        'Loai_Vang'               = 'Vang nhan SJC 9999'
                        'Gia_Mua_VND_Luong'       = $buyLuong
                        'Gia_Ban_VND_Luong'       = $sellLuong
                        'Chenh_Lech_VND_Luong'    = $spread
                        'Gia_Mua_VND_Chi'         = $buyChi
                        'Gia_Ban_VND_Chi'         = $sellChi
                        'SJC_Mieng_Mua_VND_Luong' = $barBuyLuong
                        'SJC_Mieng_Ban_VND_Luong' = $barSellLuong
                        'Cap_Nhat_Luc'            = $response.time
                    }
                    $results.Add($obj)
                    $success = $true
                }
            }
        } catch {
            $retry++
            Start-Sleep -Milliseconds 300
        }
    }
    
    $currentDate = $currentDate.AddDays(1)
    Start-Sleep -Milliseconds 15
}

Write-Host "Thu thap hoan tat: $($results.Count) ban ghi." -ForegroundColor Green

# Xuat file CSV va Excel
$csvPath = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$results | Export-Csv -Path $csvPath -Encoding UTF8 -NoTypeInformation
Write-Host "Da xuat file CSV: $csvPath" -ForegroundColor Cyan
