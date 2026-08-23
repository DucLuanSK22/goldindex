<#
.SYNOPSIS
    Cập nhật giá vàng nhẫn SJC và giá vàng thế giới trung bình (XAU/USD) từ 01/01/2026 đến ngày hiện tại.
.DESCRIPTION
    Kịch bản tự động truy xuất dữ liệu giá vàng từ vang.today,
    sau đó cập nhật đồng bộ các tệp CSV, UTF16-CSV, XLS và toàn bộ các tệp Excel .XLSX.
#>

$startDate = Get-Date "2026-01-01"
$endDate   = (Get-Date).Date
$invCulture = [System.Globalization.CultureInfo]::InvariantCulture

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " CAP NHAT GIA VANG NHAN SJC & GIA VANG THE GIOI TRUNG BINH (2026)" -ForegroundColor Green
Write-Host " Tu ngay: $($startDate.ToString('dd/MM/yyyy')) den ngay: $($endDate.ToString('dd/MM/yyyy'))" -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Nạp cache dữ liệu hiện có từ file CSV nếu có
$csvPath = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$existingCache = @{}

if (Test-Path $csvPath) {
    try {
        $csvData = Import-Csv -Path $csvPath -Encoding UTF8
        foreach ($row in $csvData) {
            if ($row.ISO_Date) {
                $isoKey = [string]$row.ISO_Date.Trim()
                $existingCache[$isoKey] = [PSCustomObject]@{
                    'Ngay'                    = $row.Ngay
                    'ISO_Date'                = $isoKey
                    'Thu'                     = $row.Thu
                    'Loai_Vang'               = $row.Loai_Vang
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
            }
        }
        Write-Host "Da nap $($existingCache.Count) ban ghi tu cache CSV." -ForegroundColor DarkGray
    } catch {
        Write-Host "Khong the doc cache CSV, se truy xuat lai tu API." -ForegroundColor Yellow
    }
}

$results = [System.Collections.Generic.List[PSObject]]::new()
$currentDate = $startDate
$viCulture = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")

while ($currentDate -le $endDate) {
    $dateStr = $currentDate.ToString("yyyy-MM-dd")
    $dateDisplay = $currentDate.ToString("dd/MM/yyyy")
    $dayOfWeek = $currentDate.ToString("dddd", $viCulture)

    if ($existingCache.ContainsKey($dateStr) -and $existingCache[$dateStr].Gia_The_Gioi_USD_oz -gt 0) {
        $results.Add($existingCache[$dateStr])
    } else {
        Write-Host "Truy xuat API cho ngay: $dateStr ..." -ForegroundColor Yellow
        $url = "https://www.vang.today/api/prices?date=$dateStr"
        $success = $false
        $retry = 0
        
        while (-not $success -and $retry -lt 3) {
            try {
                $response = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "Mozilla/5.0" } -TimeoutSec 10
                if ($response.success -and $response.prices) {
                    $sjRing = $response.prices.SJ9999
                    $sjcBar  = $response.prices.SJL1L10
                    $xau    = $response.prices.XAUUSD
                    
                    if ($sjRing) {
                        $buyLuong   = [double]$sjRing.buy
                        $sellLuong  = [double]$sjRing.sell
                        $spread     = $sellLuong - $buyLuong
                        $buyChi     = $buyLuong / 10
                        $sellChi    = $sellLuong / 10
                        
                        $worldGoldUSD = if ($xau -and $xau.buy) { [double]$xau.buy } else { 0 }
                        $barBuyLuong  = if ($sjcBar -and $sjcBar.buy) { [double]$sjcBar.buy } else { 0 }
                        $barSellLuong = if ($sjcBar -and $sjcBar.sell) { [double]$sjcBar.sell } else { 0 }
                        
                        $obj = [PSCustomObject]@{
                            'Ngay'                    = $dateDisplay
                            'ISO_Date'                = $dateStr
                            'Thu'                     = $dayOfWeek
                            'Loai_Vang'               = 'Vàng nhẫn SJC 9999'
                            'Gia_Mua_VND_Luong'       = $buyLuong
                            'Gia_Ban_VND_Luong'       = $sellLuong
                            'Chenh_Lech_VND_Luong'    = $spread
                            'Gia_Mua_VND_Chi'         = $buyChi
                            'Gia_Ban_VND_Chi'         = $sellChi
                            'Gia_The_Gioi_USD_oz'     = $worldGoldUSD
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
                Start-Sleep -Milliseconds 150
            }
        }
    }
    
    $currentDate = $currentDate.AddDays(1)
}

Write-Host "Thu thap hoan tat: $($results.Count) ban ghi (den $($endDate.ToString('dd/MM/yyyy')))." -ForegroundColor Green

# 1. Ghi file Gia_Vang_Nhan_SJC_2026.csv (CSV UTF-8 BOM)
$Utf8WithBom = New-Object System.Text.UTF8Encoding $true
$sw = New-Object System.IO.StreamWriter($csvPath, $false, $Utf8WithBom)
$sw.WriteLine('"Ngay","ISO_Date","Thu","Loai_Vang","Gia_Mua_VND_Luong","Gia_Ban_VND_Luong","Chenh_Lech_VND_Luong","Gia_Mua_VND_Chi","Gia_Ban_VND_Chi","Gia_The_Gioi_USD_oz","SJC_Mieng_Mua_VND_Luong","SJC_Mieng_Ban_VND_Luong","Cap_Nhat_Luc"')

foreach ($r in $results) {
    $line = '"{0}","{1}","{2}","{3}",{4},{5},{6},{7},{8},{9},{10},{11},"{12}"' -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw.WriteLine($line)
}
$sw.Close()
Write-Host "[OK] Da cap nhat file CSV UTF-8: $csvPath" -ForegroundColor Cyan

# 2. Ghi file Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv (UTF-16LE CSV cho Excel)
$utf16Path = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv"
$utf16Encoding = New-Object System.Text.UnicodeEncoding $false, $true
$sw16 = New-Object System.IO.StreamWriter($utf16Path, $false, $utf16Encoding)
$sw16.WriteLine("Ngày`tISO Date`tThứ`tLoại vàng`tGiá Mua (VNĐ/lượng)`tGiá Bán (VNĐ/lượng)`tChênh lệch (VNĐ/lượng)`tGiá Mua (VNĐ/chỉ)`tGiá Bán (VNĐ/chỉ)`tGiá Thế Giới (USD/oz)`tSJC Miếng Mua`tSJC Miếng Bán`tCập nhật lúc")

foreach ($r in $results) {
    $line = "{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}`t{10}`t{11}`t{12}" -f `
        $r.Ngay, $r.ISO_Date, $r.Thu, $r.Loai_Vang, `
        $r.Gia_Mua_VND_Luong, $r.Gia_Ban_VND_Luong, $r.Chenh_Lech_VND_Luong, `
        $r.Gia_Mua_VND_Chi, $r.Gia_Ban_VND_Chi, $r.Gia_The_Gioi_USD_oz, `
        $r.SJC_Mieng_Mua_VND_Luong, $r.SJC_Mieng_Ban_VND_Luong, $r.Cap_Nhat_Luc
    $sw16.WriteLine($line)
}
# 2b. Ghi file gold_data.json tu dong cho Website Localhost
$jsonPath = Join-Path $PSScriptRoot "gold_data.json"
$jsonList = [System.Collections.Generic.List[PSObject]]::new()

foreach ($r in $results) {
    $xau = [double]$r.Gia_The_Gioi_USD_oz
    $worldVnd = [math]::Round(($xau * 26000) / 0.829426)
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
Write-Host "[OK] Da cap nhat file JSON Website: $jsonPath" -ForegroundColor Cyan


# 3. Ghi file Gia_Vang_Nhan_SJC_2026.xls (Excel HTML Format)
$xlsPath = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xls"
$swXls = New-Object System.IO.StreamWriter($xlsPath, $false, $Utf8WithBom)

$htmlHeader = @"
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Giá Vàng Nhẫn SJC 2026</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml><![endif]-->
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; }
  th { background-color: #1F497D; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #95B3D7; padding: 6px; }
  td { border: 1px solid #D9D9D9; padding: 5px; }
  .text { mso-number-format:"\@"; text-align: center; }
  .number { mso-number-format:"\#\,\#\#0"; text-align: right; }
  .decimal { mso-number-format:"\#\,\#\#0\.00"; text-align: right; font-weight: bold; color: #002060; }
  .bold { font-weight: bold; }
  tr:nth-child(even) { background-color: #F2F5F9; }
</style>
</head>
<body>
<h2>BẢNG GIÁ VÀNG NHẪN SJC 9999 VÀ GIÁ VÀNG THẾ GIỚI (01/01/2026 - $($endDate.ToString('dd/MM/yyyy')))</h2>
<table>
  <thead>
    <tr>
      <th>Ngày</th>
      <th>ISO Date</th>
      <th>Thứ</th>
      <th>Loại Vàng</th>
      <th>Giá Mua (VNĐ/lượng)</th>
      <th>Giá Bán (VNĐ/lượng)</th>
      <th>Chênh Lệch (VNĐ/lượng)</th>
      <th>Giá Mua (VNĐ/chỉ)</th>
      <th>Giá Bán (VNĐ/chỉ)</th>
      <th>Giá Thế Giới (USD/oz)</th>
      <th>SJC Miếng Mua (đ/lượng)</th>
      <th>SJC Miếng Bán (đ/lượng)</th>
      <th>Cập Nhật Lúc</th>
    </tr>
  </thead>
  <tbody>
"@
$swXls.WriteLine($htmlHeader)

foreach ($row in $results) {
    $buyLuong   = $row.Gia_Mua_VND_Luong
    $sellLuong  = $row.Gia_Ban_VND_Luong
    $spread     = $row.Chenh_Lech_VND_Luong
    $buyChi     = $row.Gia_Mua_VND_Chi
    $sellChi    = $row.Gia_Ban_VND_Chi
    $worldGold  = $row.Gia_The_Gioi_USD_oz
    $barBuy     = if ($row.SJC_Mieng_Mua_VND_Luong) { $row.SJC_Mieng_Mua_VND_Luong } else { 0 }
    $barSell    = if ($row.SJC_Mieng_Ban_VND_Luong) { $row.SJC_Mieng_Ban_VND_Luong } else { 0 }

    $tr = @"
    <tr>
      <td class="text">$($row.Ngay)</td>
      <td class="text">$($row.ISO_Date)</td>
      <td class="text">$($row.Thu)</td>
      <td>$($row.Loai_Vang)</td>
      <td class="number">$('{0:N0}' -f $buyLuong)</td>
      <td class="number bold" style="color:#C00000;">$('{0:N0}' -f $sellLuong)</td>
      <td class="number">$('{0:N0}' -f $spread)</td>
      <td class="number">$('{0:N0}' -f $buyChi)</td>
      <td class="number">$('{0:N0}' -f $sellChi)</td>
      <td class="decimal">$worldGold</td>
      <td class="number">$('{0:N0}' -f $barBuy)</td>
      <td class="number">$('{0:N0}' -f $barSell)</td>
      <td class="text">$($row.Cap_Nhat_Luc)</td>
    </tr>
"@
    $swXls.WriteLine($tr)
}

$htmlFooter = @"
  </tbody>
</table>
</body>
</html>
"@
$swXls.WriteLine($htmlFooter)
$swXls.Close()
Write-Host "[OK] Da cap nhat file Excel XLS: $xlsPath" -ForegroundColor Cyan

# 4. CAP NHAT CAC FILE EXCEL .XLSX Qua COM OBJECT
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " BAT DAU CAP NHAT CAC FILE EXCEL WORKBOOK (.XLSX)" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    # Helper function chuẩn hóa ngày trong cell Excel ra ISO string (yyyy-MM-dd)
    function Get-CellIsoDate($ws, $r) {
        $t1 = '' + $ws.Cells.Item($r, 1).Text
        $t2 = '' + $ws.Cells.Item($r, 2).Text
        $v2 = $ws.Cells.Item($r, 2).Value2
        
        if ($t2 -match '^\d{4}-\d{2}-\d{2}$') { return $t2.Trim() }
        if ($t1 -match '^(\d{1,2})/(\d{1,2})/(\d{4})$') {
            return ('{0:D4}-{1:D2}-{2:D2}' -f [int]$Matches[3], [int]$Matches[2], [int]$Matches[1])
        }
        if ($v2 -is [double] -or $v2 -is [int]) {
            try { return ([DateTime]::FromOADate([double]$v2)).ToString('yyyy-MM-dd') } catch {}
        }
        return $null
    }

    # Helper Function: Cập nhật một file Excel Workbook (.xlsx)
    function Update-ExcelWorkbook {
        param (
            [string]$FilePath,
            [string]$Type # "TheoDoi", "XuLy", "GiaVang"
        )

        if (-not (Test-Path $FilePath)) {
            Write-Host "[SKIP] Khong tim thay file: $FilePath" -ForegroundColor Yellow
            return
        }

        Write-Host "Dang xu ly file: $(Split-Path $FilePath -Leaf) ..." -ForegroundColor White
        $wb = $excel.Workbooks.Open($FilePath)
        $ws = $wb.Worksheets.Item(1)

        # Map ngày hiện có -> số dòng
        $lastRow = [int]$ws.UsedRange.Rows.Count
        $existingDates = @{}

        for ($r = 2; $r -le $lastRow; $r++) {
            $isoDate = Get-CellIsoDate $ws $r
            if ($isoDate) {
                $existingDates[$isoDate] = $r
            }
        }

        $addedCount = 0
        $updatedCount = 0

        foreach ($item in $results) {
            $isoDate = [string]$item.ISO_Date
            
            if ($existingDates.ContainsKey($isoDate)) {
                # Cập nhật dòng đã tồn tại
                $targetRow = [int]$existingDates[$isoDate]
                $updatedCount++
            } else {
                # Thêm dòng mới ở cuối bảng
                $lastRow++
                $targetRow = [int]$lastRow
                $addedCount++
                
                # Copy định dạng từ dòng liền trước
                if ($targetRow -gt 2) {
                    $prevRange = $ws.Rows.Item($targetRow - 1)
                    $prevRange.Copy() | Out-Null
                    $currRange = $ws.Rows.Item($targetRow)
                    $currRange.PasteSpecial(-4122) | Out-Null # xlPasteFormats
                }
            }

            if ($Type -eq "TheoDoi") {
                # Theo dõi giá vàng.xlsx (16 cột)
                $ws.Cells.Item($targetRow, 1).Value2 = [string]$item.Ngay
                $ws.Cells.Item($targetRow, 2).Value2 = [string]$item.ISO_Date
                $ws.Cells.Item($targetRow, 3).Formula = '=+"Tuần "&WEEKNUM(B' + $targetRow + ')'
                $ws.Cells.Item($targetRow, 4).Value2 = [string]$item.Thu
                $ws.Cells.Item($targetRow, 5).Value2 = "Vàng nhẫn SJC"
                $ws.Cells.Item($targetRow, 6).Value2 = [double]$item.Gia_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 7).Value2 = [double]$item.Gia_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 8).Formula = '=+(M' + $targetRow + '*26000)/0.829426'
                $ws.Cells.Item($targetRow, 9).Formula = '=+G' + $targetRow + '-H' + $targetRow
                $ws.Cells.Item($targetRow, 10).Value2 = [double]$item.Chenh_Lech_VND_Luong
                $ws.Cells.Item($targetRow, 11).Value2 = [double]$item.Gia_Mua_VND_Chi
                $ws.Cells.Item($targetRow, 12).Value2 = [double]$item.Gia_Ban_VND_Chi
                $ws.Cells.Item($targetRow, 13).Value2 = [double]$item.Gia_The_Gioi_USD_oz
                $ws.Cells.Item($targetRow, 14).Value2 = [double]$item.SJC_Mieng_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 15).Value2 = [double]$item.SJC_Mieng_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 16).Value2 = [string]$item.Cap_Nhat_Luc
            }
            elseif ($Type -eq "XuLy") {
                # Gia_Vang_Nhan_SJC_2026_xuly.xlsx (16 cột)
                $ws.Cells.Item($targetRow, 1).Value2 = [string]$item.Ngay
                $ws.Cells.Item($targetRow, 2).Value2 = [string]$item.ISO_Date
                $ws.Cells.Item($targetRow, 3).Formula = '=TEXT(B' + $targetRow + ',"mm")'
                $ws.Cells.Item($targetRow, 4).Value2 = [string]$item.Thu
                $ws.Cells.Item($targetRow, 5).Value2 = "Vàng nhẫn SJC 9999"
                $ws.Cells.Item($targetRow, 6).Value2 = [double]$item.Gia_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 7).Value2 = [double]$item.Gia_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 8).Formula = '=M' + $targetRow + '*26000*1.20565'
                $ws.Cells.Item($targetRow, 9).Formula = '=G' + $targetRow + '-H' + $targetRow
                $ws.Cells.Item($targetRow, 10).Value2 = [double]$item.Chenh_Lech_VND_Luong
                $ws.Cells.Item($targetRow, 11).Value2 = [double]$item.Gia_Mua_VND_Chi
                $ws.Cells.Item($targetRow, 12).Value2 = [double]$item.Gia_Ban_VND_Chi
                $ws.Cells.Item($targetRow, 13).Value2 = [double]$item.Gia_The_Gioi_USD_oz
                $ws.Cells.Item($targetRow, 14).Value2 = [double]$item.SJC_Mieng_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 15).Value2 = [double]$item.SJC_Mieng_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 16).Value2 = [string]$item.Cap_Nhat_Luc
            }
            elseif ($Type -eq "GiaVang") {
                # Gia_Vang_Nhan_SJC_2026.xlsx (12 cột)
                $ws.Cells.Item($targetRow, 1).Value2 = [string]$item.Ngay
                $ws.Cells.Item($targetRow, 2).Value2 = [string]$item.ISO_Date
                $ws.Cells.Item($targetRow, 3).Value2 = [string]$item.Thu
                $ws.Cells.Item($targetRow, 4).Value2 = "Vàng nhẫn SJC 9999"
                $ws.Cells.Item($targetRow, 5).Value2 = [double]$item.Gia_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 6).Value2 = [double]$item.Gia_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 7).Value2 = [double]$item.Chenh_Lech_VND_Luong
                $ws.Cells.Item($targetRow, 8).Value2 = [double]$item.Gia_Mua_VND_Chi
                $ws.Cells.Item($targetRow, 9).Value2 = [double]$item.Gia_Ban_VND_Chi
                $ws.Cells.Item($targetRow, 10).Value2 = [double]$item.SJC_Mieng_Mua_VND_Luong
                $ws.Cells.Item($targetRow, 11).Value2 = [double]$item.SJC_Mieng_Ban_VND_Luong
                $ws.Cells.Item($targetRow, 12).Value2 = [string]$item.Cap_Nhat_Luc
            }
        }

        $wb.Save()
        $wb.Close($true)
        Write-Host "   -> Thanh cong: Them $addedCount dong moi, cap nhat $updatedCount dong." -ForegroundColor Green
    }

    # Thực hiện cập nhật từng file Excel
    $theoDoiFile = (Get-ChildItem -Path $PSScriptRoot -Filter "*Theo*.xlsx")[0].FullName
    if ($theoDoiFile) { Update-ExcelWorkbook -FilePath $theoDoiFile -Type "TheoDoi" }

    $xuLyFile = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026_xuly.xlsx"
    Update-ExcelWorkbook -FilePath $xuLyFile -Type "XuLy"

    $copyXuLyFile = Join-Path $PSScriptRoot "Copy of Gia_Vang_Nhan_SJC_2026_xuly.xlsx"
    Update-ExcelWorkbook -FilePath $copyXuLyFile -Type "XuLy"

    $giaVangFile = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xlsx"
    Update-ExcelWorkbook -FilePath $giaVangFile -Type "GiaVang"

    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "[OK] Da cap nhat tat ca file Excel .XLSX hoan tat." -ForegroundColor Green
} catch {
    Write-Host "[LOI EXCEL] $($_.Exception.Message)" -ForegroundColor Red
    if ($excel) {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
}
