<#
.SYNOPSIS
    Cập nhật giá vàng tăng tiến (Incremental Update) từ ngày cuối cùng trong CSV đến ngày hiện tại.
.DESCRIPTION
    Tự động tìm ngày mới nhất đã có trong CSV, chỉ truy xuất các ngày còn thiếu đến hôm nay,
    sau đó ghi đồng bộ toàn bộ ra các tệp CSV (UTF-8, UTF-16LE), Excel (.xls, .xlsx) và gold_data.json cho Web.
#>

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$invCulture = [System.Globalization.CultureInfo]::InvariantCulture
$viCulture  = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")

$csvPath    = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$utf16Path  = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv"
$xlsPath    = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xls"
$xlsxPath   = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xlsx"
$jsonPath   = Join-Path $PSScriptRoot "gold_data.json"
$appJsPath  = Join-Path $PSScriptRoot "app.js"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " 🪙 CẬP NHẬT GIÁ VÀNG TĂNG TIẾN (TỪ NGÀY CUỐI ĐẾN HIỆN TẠI)               " -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Đọc toàn bộ dữ liệu hiện có trong CSV
$existingRecords = [System.Collections.Generic.Dictionary[string, PSObject]]::new()
$latestDateFound = $null

if (Test-Path $csvPath) {
    try {
        $csvData = Import-Csv -Path $csvPath -Encoding UTF8
        foreach ($row in $csvData) {
            if ($row.ISO_Date) {
                $isoKey = [string]$row.ISO_Date.Trim()
                
                # Chuẩn hóa tên thứ tiếng Việt
                $dayName = $row.Thu
                if ($dayName -match "Thá|VÃ|nhá" -or [string]::IsNullOrWhiteSpace($dayName)) {
                    try {
                        $dTmp = [DateTime]::ParseExact($isoKey, "yyyy-MM-dd", $invCulture)
                        $dayName = switch ($dTmp.DayOfWeek) {
                            "Monday"    { "Thứ Hai" }
                            "Tuesday"   { "Thứ Ba" }
                            "Wednesday" { "Thứ Tư" }
                            "Thursday"  { "Thứ Năm" }
                            "Friday"    { "Thứ Sáu" }
                            "Saturday"  { "Thứ Bảy" }
                            "Sunday"    { "Chủ Nhật" }
                        }
                    } catch {}
                }

                $existingRecords[$isoKey] = [PSCustomObject]@{
                    'Ngay'                    = $row.Ngay
                    'ISO_Date'                = $isoKey
                    'Thu'                     = $dayName
                    'Loai_Vang'               = "Vàng nhẫn SJC 9999"
                    'Gia_Mua_VND_Luong'       = [double]$row.Gia_Mua_VND_Luong
                    'Gia_Ban_VND_Luong'       = [double]$row.Gia_Ban_VND_Luong
                    'Chenh_Lech_VND_Luong'    = [double]$row.Chenh_Lech_VND_Luong
                    'Gia_Mua_VND_Chi'         = [double]$row.Gia_Mua_VND_Chi
                    'Gia_Ban_VND_Chi'         = [double]$row.Gia_Ban_VND_Chi
                    'Gia_The_Gioi_USD_oz'     = [double]$row.Gia_The_Gioi_USD_oz
                    'SJC_Mieng_Mua_VND_Luong' = [double]$row.SJC_Mieng_Mua_VND_Luong
                    'SJC_Mieng_Ban_VND_Luong' = [double]$row.SJC_Mieng_Ban_VND_Luong
                    'Cap_Nhat_Luc'            = $row.Cap_Nhat_Luc
                }

                try {
                    $dtObj = [DateTime]::ParseExact($isoKey, "yyyy-MM-dd", $invCulture)
                    if ($null -eq $latestDateFound -or $dtObj -gt $latestDateFound) {
                        $latestDateFound = $dtObj
                    }
                } catch {}
            }
        }
        Write-Host "-> Đã nạp $($existingRecords.Count) bản ghi lịch sử từ file CSV." -ForegroundColor DarkGray
    } catch {
        Write-Host "[CẢNH BÁO] Không thể đọc cache CSV, sẽ nạp lại từ đầu năm." -ForegroundColor Yellow
    }
}

$today = (Get-Date).Date

if ($null -ne $latestDateFound) {
    Write-Host "-> Ngày cuối cùng hiện có trong file: $($latestDateFound.ToString('dd/MM/yyyy'))" -ForegroundColor Cyan
    if ($latestDateFound -ge $today) {
        $startDate = $today
    } else {
        $startDate = $latestDateFound.AddDays(1)
    }
} else {
    $startDate = [DateTime]::ParseExact("2026-01-01", "yyyy-MM-dd", $invCulture)
}

$endDate = $today

Write-Host "-> Khoảng thời gian cần cập nhật API : $($startDate.ToString('dd/MM/yyyy')) -> $($endDate.ToString('dd/MM/yyyy'))" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray

$newCount = 0
$lastKnownRecord = if ($existingRecords.Count -gt 0 -and $latestDateFound) { $existingRecords[$latestDateFound.ToString("yyyy-MM-dd")] } else { $null }

if ($startDate -gt $endDate) {
    Write-Host "Dữ liệu đã mới nhất đến ngày hôm nay! Không có ngày nào cần lấy thêm." -ForegroundColor Green
} else {
    $curr = $startDate
    while ($curr -le $endDate) {
        $dateStr = $curr.ToString("yyyy-MM-dd")
        $dateDisplay = $curr.ToString("dd/MM/yyyy")
        $dayOfWeek = switch ($curr.DayOfWeek) {
            "Monday"    { "Thứ Hai" }
            "Tuesday"   { "Thứ Ba" }
            "Wednesday" { "Thứ Tư" }
            "Thursday"  { "Thứ Năm" }
            "Friday"    { "Thứ Sáu" }
            "Saturday"  { "Thứ Bảy" }
            "Sunday"    { "Chủ Nhật" }
        }

        Write-Host "Đang gọi API ngày: $dateDisplay ($dayOfWeek)... " -NoNewline -ForegroundColor White
        
        $url = "https://www.vang.today/api/prices?date=$dateStr"
        $fetched = $false
        $retry = 0

        while (-not $fetched -and $retry -lt 3) {
            try {
                $response = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "Mozilla/5.0" } -TimeoutSec 10
                if ($response.success -and $response.prices) {
                    $sjRing = $response.prices.SJ9999
                    $sjcBar = $response.prices.SJL1L10
                    $xau    = $response.prices.XAUUSD

                    $buyLuong  = 0
                    $sellLuong = 0
                    $worldUsd  = if ($xau -and $xau.buy) { [double]$xau.buy } else { 0 }
                    $barBuy    = if ($sjcBar -and $sjcBar.buy) { [double]$sjcBar.buy } else { 0 }
                    $barSell   = if ($sjcBar -and $sjcBar.sell) { [double]$sjcBar.sell } else { 0 }

                    if ($sjRing -and $sjRing.buy) {
                        $buyLuong  = [double]$sjRing.buy
                        $sellLuong = [double]$sjRing.sell
                    }

                    # Kế thừa giá đóng cửa phiên gần nhất nếu cuối tuần/lễ
                    if ($buyLuong -le 0 -and $null -ne $lastKnownRecord) {
                        $buyLuong  = $lastKnownRecord.Gia_Mua_VND_Luong
                        $sellLuong = $lastKnownRecord.Gia_Ban_VND_Luong
                        if ($barBuy -le 0) { $barBuy = $lastKnownRecord.SJC_Mieng_Mua_VND_Luong }
                        if ($barSell -le 0) { $barSell = $lastKnownRecord.SJC_Mieng_Ban_VND_Luong }
                        if ($worldUsd -le 0) { $worldUsd = $lastKnownRecord.Gia_The_Gioi_USD_oz }
                    }

                    if ($buyLuong -gt 0) {
                        $spread  = $sellLuong - $buyLuong
                        $buyChi  = $buyLuong / 10
                        $sellChi = $sellLuong / 10
                        $capNhat = if ($response.time) { $response.time } else { (Get-Date).ToString("HH:mm") }

                        $newRec = [PSCustomObject]@{
                            'Ngay'                    = $dateDisplay
                            'ISO_Date'                = $dateStr
                            'Thu'                     = $dayOfWeek
                            'Loai_Vang'               = "Vàng nhẫn SJC 9999"
                            'Gia_Mua_VND_Luong'       = $buyLuong
                            'Gia_Ban_VND_Luong'       = $sellLuong
                            'Chenh_Lech_VND_Luong'    = $spread
                            'Gia_Mua_VND_Chi'         = $buyChi
                            'Gia_Ban_VND_Chi'         = $sellChi
                            'Gia_The_Gioi_USD_oz'     = $worldUsd
                            'SJC_Mieng_Mua_VND_Luong' = $barBuy
                            'SJC_Mieng_Ban_VND_Luong' = $barSell
                            'Cap_Nhat_Luc'            = $capNhat
                        }

                        $existingRecords[$dateStr] = $newRec
                        $lastKnownRecord = $newRec
                        $newCount++
                        $fetched = $true

                        Write-Host "[OK] Mua: $('{0:N0}' -f $buyLuong) | Bán: $('{0:N0}' -f $sellLuong) | TG: $worldUsd USD" -ForegroundColor Green
                    } else {
                        Write-Host "[BỎ QUA - Không có dữ liệu]" -ForegroundColor DarkGray
                        $fetched = $true
                    }
                } else {
                    Write-Host "[KHÔNG CÓ DỮ LIỆU]" -ForegroundColor DarkGray
                    $fetched = $true
                }
            } catch {
                $retry++
                Start-Sleep -Milliseconds 200
                if ($retry -ge 3) {
                    Write-Host "[LỖI KẾT NỐI]" -ForegroundColor Red
                }
            }
        }

        $curr = $curr.AddDays(1)
    }
}

Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Đã cập nhật thêm $newCount bản ghi mới. Tổng cộng: $($existingRecords.Count) bản ghi." -ForegroundColor Green
Write-Host ""

# 2. Sắp xếp toàn bộ dữ liệu theo thứ tự ngày tăng dần
$sortedKeys = $existingRecords.Keys | Sort-Object { [DateTime]::ParseExact($_, "yyyy-MM-dd", $invCulture) }
$finalList = [System.Collections.Generic.List[PSObject]]::new()
foreach ($k in $sortedKeys) {
    $finalList.Add($existingRecords[$k])
}

# 3. Ghi file Gia_Vang_Nhan_SJC_2026.csv (UTF-8 BOM)
$Utf8WithBom = New-Object System.Text.UTF8Encoding $true
$sw = New-Object System.IO.StreamWriter($csvPath, $false, $Utf8WithBom)
$sw.WriteLine('"Ngay","ISO_Date","Thu","Loai_Vang","Gia_Mua_VND_Luong","Gia_Ban_VND_Luong","Chenh_Lech_VND_Luong","Gia_Mua_VND_Chi","Gia_Ban_VND_Chi","Gia_The_Gioi_USD_oz","SJC_Mieng_Mua_VND_Luong","SJC_Mieng_Ban_VND_Luong","Cap_Nhat_Luc"')

foreach ($r in $finalList) {
    $line = '"{0}","{1}","{2}","{3}",{4},{5},{6},{7},{8},{9},{10},{11},"{12}"' -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw.WriteLine($line)
}
$sw.Close()
Write-Host "[OK] Đã cập nhật file CSV UTF-8: $csvPath" -ForegroundColor Cyan

# 4. Ghi file Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv (UTF-16LE cho Excel)
$utf16Encoding = New-Object System.Text.UnicodeEncoding $false, $true
$sw16 = New-Object System.IO.StreamWriter($utf16Path, $false, $utf16Encoding)
$sw16.WriteLine("Ngày`tISO Date`tThứ`tLoại vàng`tGiá Mua (VNĐ/lượng)`tGiá Bán (VNĐ/lượng)`tChênh lệch (VNĐ/lượng)`tGiá Mua (VNĐ/chỉ)`tGiá Bán (VNĐ/chỉ)`tGiá Thế Giới (USD/oz)`tSJC Miếng Mua`tSJC Miếng Bán`tCập nhật lúc")

foreach ($r in $finalList) {
    $line = "{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}`t{10}`t{11}`t{12}" -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw16.WriteLine($line)
}
$sw16.Close()
Write-Host "[OK] Đã cập nhật file Excel UTF-16LE CSV: $utf16Path" -ForegroundColor Cyan

# 5. Ghi file gold_data.json cho Web Dashboard
$jsonList = [System.Collections.Generic.List[PSObject]]::new()
foreach ($r in $finalList) {
    $xau = [double]$r.Gia_The_Gioi_USD_oz
    $worldVnd = if ($xau -gt 0) { [math]::Round(($xau * 26000) / 0.829426) } else { 0 }
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
        Gia_The_Gioi_VND_Luong  = $worldVnd
        Chenh_Lech_The_Gioi     = ($r.Gia_Ban_VND_Luong - $worldVnd)
        SJC_Mieng_Mua           = $r.SJC_Mieng_Mua_VND_Luong
        SJC_Mieng_Ban           = $r.SJC_Mieng_Ban_VND_Luong
        Cap_Nhat_Luc            = $r.Cap_Nhat_Luc
    }
    $jsonList.Add($jsonObj)
}
$jsonSw = New-Object System.IO.StreamWriter($jsonPath, $false, $Utf8WithBom)
$jsonSw.Write(($jsonList | ConvertTo-Json -Depth 5))
$jsonSw.Close()
Write-Host "[OK] Đã cập nhật file Web JSON: $jsonPath" -ForegroundColor Cyan

# 6. Ghi file Gia_Vang_Nhan_SJC_2026.xls (Excel HTML)
$swXls = New-Object System.IO.StreamWriter($xlsPath, $false, $Utf8WithBom)
$latestDisplay = if ($finalList.Count -gt 0) { $finalList[$finalList.Count - 1].Ngay } else { "" }

$swXls.WriteLine('<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">')
$swXls.WriteLine('<head>')
$swXls.WriteLine('<meta http-equiv="Content-Type" content="text/html; charset=utf-8">')
$swXls.WriteLine('<style>')
$swXls.WriteLine('body { font-family: Segoe UI, sans-serif; font-size: 11pt; }')
$swXls.WriteLine('table { border-collapse: collapse; width: 100%; }')
$swXls.WriteLine('th { background-color: #1F497D; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #95B3D7; padding: 6px; }')
$swXls.WriteLine('td { border: 1px solid #D9D9D9; padding: 5px; }')
$swXls.WriteLine('.text { mso-number-format:"\@"; text-align: center; }')
$swXls.WriteLine('.number { mso-number-format:"\#\,\#\#0"; text-align: right; }')
$swXls.WriteLine('.decimal { mso-number-format:"\#\,\#\#0\.00"; text-align: right; font-weight: bold; color: #002060; }')
$swXls.WriteLine('.bold { font-weight: bold; }')
$swXls.WriteLine('tr:nth-child(even) { background-color: #F2F5F9; }')
$swXls.WriteLine('</style>')
$swXls.WriteLine('</head>')
$swXls.WriteLine('<body>')
$swXls.WriteLine("<h2>BẢNG GIÁ VÀNG NHẪN SJC 9999 VÀ GIÁ VÀNG THẾ GIỚI (CẬP NHẬT ĐẾN $latestDisplay)</h2>")
$swXls.WriteLine('<table>')
$swXls.WriteLine('<thead><tr><th>Ngày</th><th>ISO Date</th><th>Thứ</th><th>Loại Vàng</th><th>Giá Mua (VNĐ/lượng)</th><th>Giá Bán (VNĐ/lượng)</th><th>Chênh Lệch (VNĐ/lượng)</th><th>Giá Mua (VNĐ/chỉ)</th><th>Giá Bán (VNĐ/chỉ)</th><th>Giá Thế Giới (USD/oz)</th><th>SJC Miếng Mua</th><th>SJC Miếng Bán</th><th>Cập Nhật Lúc</th></tr></thead>')
$swXls.WriteLine('<tbody>')

foreach ($row in $finalList) {
    $swXls.WriteLine('<tr>')
    $swXls.WriteLine('<td class="text">' + $row.Ngay + '</td>')
    $swXls.WriteLine('<td class="text">' + $row.ISO_Date + '</td>')
    $swXls.WriteLine('<td class="text">' + $row.Thu + '</td>')
    $swXls.WriteLine('<td>' + $row.Loai_Vang + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.Gia_Mua_VND_Luong) + '</td>')
    $swXls.WriteLine('<td class="number bold" style="color:#C00000;">' + ('{0:N0}' -f $row.Gia_Ban_VND_Luong) + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.Chenh_Lech_VND_Luong) + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.Gia_Mua_VND_Chi) + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.Gia_Ban_VND_Chi) + '</td>')
    $swXls.WriteLine('<td class="decimal">' + $row.Gia_The_Gioi_USD_oz + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.SJC_Mieng_Mua_VND_Luong) + '</td>')
    $swXls.WriteLine('<td class="number">' + ('{0:N0}' -f $row.SJC_Mieng_Ban_VND_Luong) + '</td>')
    $swXls.WriteLine('<td class="text">' + $row.Cap_Nhat_Luc + '</td>')
    $swXls.WriteLine('</tr>')
}
$swXls.WriteLine('</tbody></table></body></html>')
$swXls.Close()
Write-Host "[OK] Đã cập nhật file Excel XLS: $xlsPath" -ForegroundColor Cyan

# 7. File Excel đa sheet có thể cập nhật qua menu [3] hoặc chạy ngầm
Write-Host "[OK] Đã xuất file Excel UTF-16LE và HTML XLS tương thích 100% Microsoft Excel." -ForegroundColor Green

Write-Host ""
$latestRec = $finalList[$finalList.Count - 1]
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host " DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG ĐẾN NGÀY: $($latestRec.Ngay) ($($latestRec.Thu))" -ForegroundColor Green
Write-Host " - Giá mua vàng nhẫn SJC: $('{0:N0}' -f $latestRec.Gia_Mua_VND_Luong) VNĐ/lượng" -ForegroundColor Yellow
Write-Host " - Giá bán vàng nhẫn SJC: $('{0:N0}' -f $latestRec.Gia_Ban_VND_Luong) VNĐ/lượng" -ForegroundColor Yellow
Write-Host " - Giá vàng thế giới     : $($latestRec.Gia_The_Gioi_USD_oz) USD/oz" -ForegroundColor Yellow
Write-Host " -> Web Dashboard và các file Excel/CSV đã sẵn sàng sử dụng dữ liệu mới nhất!" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Green
