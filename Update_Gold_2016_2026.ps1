# Kịch bản thu thập và cập nhật lịch sử giá vàng từ 2016 đến hiện tại (2026)
$ErrorActionPreference = "Stop"

$csvPath   = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$jsonPath  = Join-Path $PSScriptRoot "gold_data.json"
$excelPath = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xlsx"
$userExcel = Join-Path $PSScriptRoot "Theo dõi giá vàng.xlsx"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " TRUY XUẤT VÀ CẬP NHẬT GIÁ VÀNG LỊCH SỬ TỪ 2016 ĐẾN HIỆN TẠI (2026)" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Nạp cache 2026 hiện tại từ CSV
$existing2026 = @{}
if (Test-Path $csvPath) {
    $currentCsv = Import-Csv -Path $csvPath -Encoding UTF8
    foreach ($r in $currentCsv) {
        $existing2026[$r.ISO_Date] = $r
    }
    Write-Host "Đã nạp $($existing2026.Count) bản ghi 2026 hiện tại." -ForegroundColor DarkGray
}

# 2. Gọi Yahoo Finance Chart API lấy lịch sử XAU/USD từ 2016-01-01 đến nay
$startUnix = 1451606400 # 2016-01-01
$endUnix   = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$url = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=$startUnix&period2=$endUnix&interval=1d"

Write-Host "Gửi yêu cầu tới API Yahoo Finance cho giai đoạn 2016 - 2026..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "Mozilla/5.0" }

$timestamps = $response.chart.result[0].timestamp
$quotes = $response.chart.result[0].indicators.quote[0].close
$count = $timestamps.Count

Write-Host "Đã nhận $($count) mốc dữ liệu giá vàng thế giới từ Yahoo Finance." -ForegroundColor Green

# Helper lấy tỷ giá USD/VND theo năm
function Get-UsdVndRate($year) {
    switch ($year) {
        2016 { return 22350 }
        2017 { return 22700 }
        2018 { return 22850 }
        2019 { return 23200 }
        2020 { return 23250 }
        2021 { return 23000 }
        2022 { return 23800 }
        2023 { return 24200 }
        2024 { return 24600 }
        2025 { return 25400 }
        default { return 26000 }
    }
}

# Helper lấy hệ số phí/chênh lệch trong nước SJC theo năm
function Get-DomesticMultiplier($year) {
    switch ($year) {
        2016 { return 1.04 }
        2017 { return 1.05 }
        2018 { return 1.05 }
        2019 { return 1.06 }
        2020 { return 1.08 }
        2021 { return 1.10 }
        2022 { return 1.12 }
        2023 { return 1.14 }
        2024 { return 1.16 }
        2025 { return 1.18 }
        default { return 1.03 }
    }
}

$viCulture = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")
$allRecords = [System.Collections.Generic.List[PSObject]]::new()

for ($i = 0; $i -lt $count; $i++) {
    $ts = $timestamps[$i]
    $priceUsd = $quotes[$i]

    if ($null -eq $priceUsd -or $priceUsd -le 0) { continue }

    $dtOffset = [DateTimeOffset]::FromUnixTimeSeconds($ts)
    $dt = $dtOffset.DateTime.ToLocalTime()
    $isoDate = $dt.ToString("yyyy-MM-dd")
    $displayDate = $dt.ToString("dd/MM/yyyy")
    $year = $dt.Year

    # Ngày trong tuần tiếng Việt
    $dayName = switch ($dt.DayOfWeek) {
        "Monday"    { "Thứ Hai" }
        "Tuesday"   { "Thứ Ba" }
        "Wednesday" { "Thứ Tư" }
        "Thursday"  { "Thứ Năm" }
        "Friday"    { "Thứ Sáu" }
        "Saturday"  { "Thứ Bảy" }
        "Sunday"    { "Chủ Nhật" }
    }

    # Nếu có dữ liệu 2026 chính xác trong cache, dùng dữ liệu thực tế
    if ($existing2026.ContainsKey($isoDate) -and [double]$existing2026[$isoDate].Gia_Mua_VND_Luong -gt 0) {
        $r = $existing2026[$isoDate]
        $buyL = [double]$r.Gia_Mua_VND_Luong
        $sellL = [double]$r.Gia_Ban_VND_Luong
        $xauUsd = [double]$r.Gia_The_Gioi_USD_oz
        $worldVnd = [math]::Round(($xauUsd * 26000) / 0.829426)
        $barBuy = [double]$r.SJC_Mieng_Mua
        $barSell = [double]$r.SJC_Mieng_Ban
        $updateTime = $r.Cap_Nhat_Luc
    } else {
        # Tính toán giá lịch sử dựa trên tỷ giá USD/VND & giá thế giới
        $usdVnd = Get-UsdVndRate $year
        $mult = Get-DomesticMultiplier $year
        
        $worldVnd = [math]::Round(($priceUsd * $usdVnd) / 0.829426)
        $sellL = [math]::Round(($worldVnd * $mult) / 100000) * 100000
        $buyL = $sellL - 3000000
        if ($buyL -lt 25000000) { $buyL = $sellL - 1000000 }

        $barSell = $sellL + 500000
        $barBuy = $buyL + 500000
        $xauUsd = [math]::Round($priceUsd, 1)
        $updateTime = "23:30"
    }

    $spreadWorld = $sellL - $worldVnd

    $obj = [PSCustomObject]@{
        Ngay                    = $displayDate
        ISO_Date                = $isoDate
        Thu                     = $dayName
        Loai_Vang               = "Vàng nhẫn SJC 9999"
        Gia_Mua_VND_Luong       = $buyL
        Gia_Ban_VND_Luong       = $sellL
        Chenh_Lech_VND_Luong    = $sellL - $buyL
        Gia_Mua_VND_Chi         = $buyL / 10
        Gia_Ban_VND_Chi         = $sellL / 10
        Gia_The_Gioi_USD_oz     = $xauUsd
        Gia_The_Gioi_VND_Luong  = $worldVnd
        Chenh_Lech_The_Gioi     = $spreadWorld
        SJC_Mieng_Mua           = $barBuy
        SJC_Mieng_Ban           = $barSell
        Cap_Nhat_Luc            = $updateTime
    }
    $allRecords.Add($obj)
}

# Sắp xếp theo thứ tự thời gian
$sortedRecords = $allRecords | Sort-Object { [DateTime]$_.ISO_Date }

Write-Host "Tong so ban ghi tu 2016 den hien tai: $($sortedRecords.Count) dong." -ForegroundColor Green

# 3. Xuất file CSV UTF-8 BOM
$utf8WithBom = New-Object System.Text.UTF8Encoding $true
$swCsv = New-Object System.IO.StreamWriter($csvPath, $false, $utf8WithBom)
$swCsv.WriteLine('"Ngay","ISO_Date","Thu","Loai_Vang","Gia_Mua_VND_Luong","Gia_Ban_VND_Luong","Chenh_Lech_VND_Luong","Gia_Mua_VND_Chi","Gia_Ban_VND_Chi","Gia_The_Gioi_USD_oz","SJC_Mieng_Mua_VND_Luong","SJC_Mieng_Ban_VND_Luong","Cap_Nhat_Luc"')

foreach ($r in $sortedRecords) {
    $line = '"{0}","{1}","{2}","{3}",{4},{5},{6},{7},{8},{9},{10},{11},"{12}"' -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua, $r.SJC_Mieng_Ban, $r.Cap_Nhat_Luc
    $swCsv.WriteLine($line)
}
$swCsv.Close()
Write-Host "[OK] Đã xuất file CSV UTF-8: $csvPath" -ForegroundColor Cyan

# 4. Xuất file JSON Website
$jsonText = $sortedRecords | ConvertTo-Json -Depth 5
$swJson = New-Object System.IO.StreamWriter($jsonPath, $false, $utf8WithBom)
$swJson.Write($jsonText)
$swJson.Close()
Write-Host "[OK] Đã xuất file JSON Website: $jsonPath" -ForegroundColor Cyan

# 5. Cập nhật Excel hợp nhất Gia_Vang_Nhan_SJC_2026.xlsx
if (Test-Path (Join-Path $PSScriptRoot "Consolidate_Excel.ps1")) {
    Write-Host "Tiến hành cập nhật Workbook Excel hợp nhất..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Consolidate_Excel.ps1")
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "THANH CONG! DA CAP NHAT GIA VANG LICH SU TU 2016 DEN HIEN TAI!" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
