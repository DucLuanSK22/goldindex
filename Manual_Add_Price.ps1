<#
.SYNOPSIS
    Kịch bản nhập giá vàng thủ công vào các tệp CSV và JSON của dự án.
.DESCRIPTION
    Tự động tính toán thứ, ISO_Date, giá theo chỉ, độ chênh lệch và ghi đồng bộ
    vào Gia_Vang_Nhan_SJC_2026.csv (UTF-8 BOM), Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv (UTF-16LE)
    và gold_data.json.
#>

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$invCulture = [System.Globalization.CultureInfo]::InvariantCulture
$viCulture  = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")

$csvPath    = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$utf16Path  = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv"
$jsonPath   = Join-Path $PSScriptRoot "gold_data.json"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "         NHẬP DỮ LIỆU GIÁ VÀNG THỦ CÔNG VÀO FILE CSV & HỆ THỐNG          " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Nhập ngày
$todayStr = (Get-Date).ToString("dd/MM/yyyy")
$inputDateStr = Read-Host "1. Nhập ngày (định dạng dd/MM/yyyy, nhấn Enter để lấy ngày hôm nay [$todayStr])"
if ([string]::IsNullOrWhiteSpace($inputDateStr)) {
    $inputDateStr = $todayStr
}

$parsedDate = $null
$dateFormats = @("dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd")
foreach ($fmt in $dateFormats) {
    try {
        $parsedDate = [DateTime]::ParseExact($inputDateStr.Trim(), $fmt, $invCulture)
        break
    } catch {}
}

if ($null -eq $parsedDate) {
    Write-Host "[LỖI] Ngày '$inputDateStr' không đúng định dạng dd/MM/yyyy!" -ForegroundColor Red
    exit 1
}

$displayDate = $parsedDate.ToString("dd/MM/yyyy")
$isoDate     = $parsedDate.ToString("yyyy-MM-dd")

$dayOfWeek = switch ($parsedDate.DayOfWeek) {
    "Monday"    { "Thứ Hai" }
    "Tuesday"   { "Thứ Ba" }
    "Wednesday" { "Thứ Tư" }
    "Thursday"  { "Thứ Năm" }
    "Friday"    { "Thứ Sáu" }
    "Saturday"  { "Thứ Bảy" }
    "Sunday"    { "Chủ Nhật" }
}

Write-Host "-> Ngày đã chọn: $displayDate ($dayOfWeek | ISO: $isoDate)" -ForegroundColor DarkGreen
Write-Host ""

# 2. Nhập giá mua/bán nhẫn SJC
$buyInput = Read-Host "2. Nhập GIÁ MUA Vàng Nhẫn SJC (VNĐ/lượng, VD: 143500000 hoặc 143.5)"
$buyInput = $buyInput.Replace(",", "").Replace(".", "").Trim()
if ($buyInput -match '^\d+$' -and [double]$buyInput -lt 10000) {
    $buyLuong = [double]$buyInput * 1000000
} else {
    $buyLuong = [double]$buyInput
}

$sellInput = Read-Host "3. Nhập GIÁ BÁN Vàng Nhẫn SJC (VNĐ/lượng, VD: 146500000 hoặc 146.5)"
$sellInput = $sellInput.Replace(",", "").Replace(".", "").Trim()
if ($sellInput -match '^\d+$' -and [double]$sellInput -lt 10000) {
    $sellLuong = [double]$sellInput * 1000000
} else {
    $sellLuong = [double]$sellInput
}

if ($buyLuong -le 0 -or $sellLuong -le 0) {
    Write-Host "[LỖI] Giá mua/bán không hợp lệ!" -ForegroundColor Red
    exit 1
}

# 3. Giá thế giới USD/oz
$worldInput = Read-Host "4. Nhập GIÁ VÀNG THẾ GIỚI XAU/USD (USD/oz, VD: 4613.5, Enter nếu chưa có)"
$worldGoldUSD = 0
if (-not [string]::IsNullOrWhiteSpace($worldInput)) {
    [double]::TryParse($worldInput.Trim().Replace(",", "."), [System.Globalization.NumberStyles]::Any, $invCulture, [ref]$worldGoldUSD) | Out-Null
}

# 4. Vàng miếng SJC (Tùy chọn)
$barBuyInput = Read-Host "5. Nhập GIÁ MUA Vàng Miếng SJC (VNĐ/lượng, tùy chọn, Enter để bỏ qua)"
$barBuyLuong = 0
if (-not [string]::IsNullOrWhiteSpace($barBuyInput)) {
    $barBuyInput = $barBuyInput.Replace(",", "").Replace(".", "").Trim()
    if ($barBuyInput -match '^\d+$' -and [double]$barBuyInput -lt 10000) {
        $barBuyLuong = [double]$barBuyInput * 1000000
    } else {
        $barBuyLuong = [double]$barBuyInput
    }
}

$barSellInput = Read-Host "6. Nhập GIÁ BÁN Vàng Miếng SJC (VNĐ/lượng, tùy chọn, Enter để bỏ qua)"
$barSellLuong = 0
if (-not [string]::IsNullOrWhiteSpace($barSellInput)) {
    $barSellInput = $barSellInput.Replace(",", "").Replace(".", "").Trim()
    if ($barSellInput -match '^\d+$' -and [double]$barSellInput -lt 10000) {
        $barSellLuong = [double]$barSellInput * 1000000
    } else {
        $barSellLuong = [double]$barSellInput
    }
}

$capNhatLuc = (Get-Date).ToString("HH:mm")

# Tính toán các chỉ số
$spreadLuong  = $sellLuong - $buyLuong
$buyChi       = $buyLuong / 10
$sellChi      = $sellLuong / 10
$worldVnd     = if ($worldGoldUSD -gt 0) { [math]::Round(($worldGoldUSD * 26000) / 0.829426) } else { 0 }
$spreadWorld  = if ($worldVnd -gt 0) { $sellLuong - $worldVnd } else { 0 }

Write-Host ""
Write-Host "================== THÔNG TIN TỔNG HỢP ==================" -ForegroundColor Yellow
Write-Host "Ngày        : $displayDate ($dayOfWeek)"
Write-Host "Vàng Nhẫn   : Mua $('{0:N0}' -f $buyLuong) đ/lượng | Bán $('{0:N0}' -f $sellLuong) đ/lượng"
Write-Host "Chênh lệch  : $('{0:N0}' -f $spreadLuong) đ/lượng"
Write-Host "Thế giới    : $worldGoldUSD USD/oz (~ $('{0:N0}' -f $worldVnd) đ/lượng)"
if ($barBuyLuong -gt 0 -or $barSellLuong -gt 0) {
    Write-Host "SJC Miếng   : Mua $('{0:N0}' -f $barBuyLuong) đ/lượng | Bán $('{0:N0}' -f $barSellLuong) đ/lượng"
}
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# Đọc dữ liệu hiện có từ CSV để chèn hoặc cập nhật
$records = @{}
$orderList = [System.Collections.Generic.List[string]]::new()

if (Test-Path $csvPath) {
    $existing = Import-Csv -Path $csvPath -Encoding UTF8
    foreach ($r in $existing) {
        if ($r.ISO_Date) {
            $key = $r.ISO_Date.Trim()
            $records[$key] = [PSCustomObject]@{
                Ngay                    = $r.Ngay
                ISO_Date                = $key
                Thu                     = $r.Thu
                Loai_Vang               = $r.Loai_Vang
                Gia_Mua_VND_Luong       = [double]$r.Gia_Mua_VND_Luong
                Gia_Ban_VND_Luong       = [double]$r.Gia_Ban_VND_Luong
                Chenh_Lech_VND_Luong    = [double]$r.Chenh_Lech_VND_Luong
                Gia_Mua_VND_Chi         = [double]$r.Gia_Mua_VND_Chi
                Gia_Ban_VND_Chi         = [double]$r.Gia_Ban_VND_Chi
                Gia_The_Gioi_USD_oz     = [double]$r.Gia_The_Gioi_USD_oz
                SJC_Mieng_Mua_VND_Luong = [double]$r.SJC_Mieng_Mua_VND_Luong
                SJC_Mieng_Ban_VND_Luong = [double]$r.SJC_Mieng_Ban_VND_Luong
                Cap_Nhat_Luc            = $r.Cap_Nhat_Luc
            }
            if (-not $orderList.Contains($key)) {
                $orderList.Add($key)
            }
        }
    }
}

# Cập nhật hoặc thêm bản ghi mới
$newObj = [PSCustomObject]@{
    Ngay                    = $displayDate
    ISO_Date                = $isoDate
    Thu                     = $dayOfWeek
    Loai_Vang               = "Vàng nhẫn SJC 9999"
    Gia_Mua_VND_Luong       = $buyLuong
    Gia_Ban_VND_Luong       = $sellLuong
    Chenh_Lech_VND_Luong    = $spreadLuong
    Gia_Mua_VND_Chi         = $buyChi
    Gia_Ban_VND_Chi         = $sellChi
    Gia_The_Gioi_USD_oz     = $worldGoldUSD
    SJC_Mieng_Mua_VND_Luong = $barBuyLuong
    SJC_Mieng_Ban_VND_Luong = $barSellLuong
    Cap_Nhat_Luc            = $capNhatLuc
}

$records[$isoDate] = $newObj
if (-not $orderList.Contains($isoDate)) {
    $orderList.Add($isoDate)
}

# Sắp xếp lại danh sách theo thứ tự ngày tăng dần
$sortedKeys = $orderList | Sort-Object { [DateTime]::ParseExact($_, "yyyy-MM-dd", $invCulture) }

# 1. Ghi file Gia_Vang_Nhan_SJC_2026.csv (UTF-8 BOM)
$Utf8WithBom = New-Object System.Text.UTF8Encoding $true
$sw = New-Object System.IO.StreamWriter($csvPath, $false, $Utf8WithBom)
$sw.WriteLine('"Ngay","ISO_Date","Thu","Loai_Vang","Gia_Mua_VND_Luong","Gia_Ban_VND_Luong","Chenh_Lech_VND_Luong","Gia_Mua_VND_Chi","Gia_Ban_VND_Chi","Gia_The_Gioi_USD_oz","SJC_Mieng_Mua_VND_Luong","SJC_Mieng_Ban_VND_Luong","Cap_Nhat_Luc"')

foreach ($k in $sortedKeys) {
    $r = $records[$k]
    $line = '"{0}","{1}","{2}","{3}",{4},{5},{6},{7},{8},{9},{10},{11},"{12}"' -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw.WriteLine($line)
}
$sw.Close()
Write-Host "[OK] Đã ghi thành công: $csvPath" -ForegroundColor Cyan

# 2. Ghi file Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv (UTF-16LE Tab-delimited)
$utf16Encoding = New-Object System.Text.UnicodeEncoding $false, $true
$sw16 = New-Object System.IO.StreamWriter($utf16Path, $false, $utf16Encoding)
$sw16.WriteLine("Ngày`tISO Date`tThứ`tLoại vàng`tGiá Mua (VNĐ/lượng)`tGiá Bán (VNĐ/lượng)`tChênh lệch (VNĐ/lượng)`tGiá Mua (VNĐ/chỉ)`tGiá Bán (VNĐ/chỉ)`tGiá Thế Giới (USD/oz)`tSJC Miếng Mua`tSJC Miếng Bán`tCập nhật lúc")

foreach ($k in $sortedKeys) {
    $r = $records[$k]
    $line = "{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}`t{10}`t{11}`t{12}" -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw16.WriteLine($line)
}
$sw16.Close()
Write-Host "[OK] Đã ghi thành công: $utf16Path" -ForegroundColor Cyan

# 3. Ghi file gold_data.json
$jsonList = [System.Collections.Generic.List[PSObject]]::new()
foreach ($k in $sortedKeys) {
    $r = $records[$k]
    $xau = [double]$r.Gia_The_Gioi_USD_oz
    $wVnd = if ($xau -gt 0) { [math]::Round(($xau * 26000) / 0.829426) } else { 0 }
    $jsonObj = [PSCustomObject]@{
        Ngay                    = $r.Ngay
        ISO_Date                = $r.ISO_Date
        Thu                     = $r.Thu
        Loai_Vang               = "Vàng nhẫn SJC 9999"
        Gia_Mua_VND_Luong       = $r.Gia_Mua_VND_Luong
        Gia_Ban_VND_Luong       = $r.Gia_Ban_VND_Luong
        Chenh_Lech_VND_Luong    = $r.Chenh_Lech_VND_Luong
        Gia_Mua_VND_Chi         = $r.Gia_Mua_VND_Chi
        Gia_Ban_VND_Chi         = $r.Gia_Ban_VND_Chi
        Gia_The_Gioi_USD_oz     = $xau
        Gia_The_Gioi_VND_Luong  = $wVnd
        Chenh_Lech_The_Gioi     = ($r.Gia_Ban_VND_Luong - $wVnd)
        SJC_Mieng_Mua           = $r.SJC_Mieng_Mua_VND_Luong
        SJC_Mieng_Ban           = $r.SJC_Mieng_Ban_VND_Luong
        Cap_Nhat_Luc            = $r.Cap_Nhat_Luc
    }
    $jsonList.Add($jsonObj)
}
$jsonSw = New-Object System.IO.StreamWriter($jsonPath, $false, $Utf8WithBom)
$jsonSw.Write(($jsonList | ConvertTo-Json -Depth 5))
$jsonSw.Close()
Write-Host "[OK] Đã cập nhật Web JSON: $jsonPath" -ForegroundColor Cyan

Write-Host ""
Write-Host ">>> CẬP NHẬT HOÀN TẤT CHO TẤT CẢ FILE CSV & JSON! <<<" -ForegroundColor Green
