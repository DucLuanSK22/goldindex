# Script sửa lỗi phông chữ tiếng Việt cho Gia_Vang_Nhan_SJC_2026.csv và gold_data.json
# REMARK: [KHÔNG BẮT BUỘC] Kịch bản phụ hỗ trợ chuẩn hóa encoding khi chỉnh sửa dữ liệu thủ công.
$csvPath = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"
$jsonPath = Join-Path $PSScriptRoot "gold_data.json"

if (-not (Test-Path $csvPath)) {
    Write-Host "Khong tim thay CSV!"
    exit
}

$csv = Import-Csv -Path $csvPath -Encoding UTF8
$viCulture = [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")
$cleanList = [System.Collections.Generic.List[PSObject]]::new()

foreach ($r in $csv) {
    $dt = Get-Date $r.ISO_Date
    $dayName = switch ($dt.DayOfWeek) {
        "Monday"    { "Thứ Hai" }
        "Tuesday"   { "Thứ Ba" }
        "Wednesday" { "Thứ Tư" }
        "Thursday"  { "Thứ Năm" }
        "Friday"    { "Thứ Sáu" }
        "Saturday"  { "Thứ Bảy" }
        "Sunday"    { "Chủ Nhật" }
    }

    $buyL = [double]$r.Gia_Mua_VND_Luong
    $sellL = [double]$r.Gia_Ban_VND_Luong
    $xau = [double]$r.Gia_The_Gioi_USD_oz
    $worldVnd = [math]::Round(($xau * 26000) / 0.829426)
    $spreadWorld = $sellL - $worldVnd

    $obj = [PSCustomObject]@{
        Ngay                    = $r.Ngay
        ISO_Date                = $r.ISO_Date
        Thu                     = $dayName
        Loai_Vang               = "Vàng nhẫn SJC 9999"
        Gia_Mua_VND_Luong       = $buyL
        Gia_Ban_VND_Luong       = $sellL
        Chenh_Lech_VND_Luong    = $sellL - $buyL
        Gia_Mua_VND_Chi         = $buyL / 10
        Gia_Ban_VND_Chi         = $sellL / 10
        Gia_The_Gioi_USD_oz     = $xau
        Gia_The_Gioi_VND_Luong  = $worldVnd
        Chenh_Lech_The_Gioi     = $spreadWorld
        SJC_Mieng_Mua           = [double]$r.SJC_Mieng_Mua_VND_Luong
        SJC_Mieng_Ban           = [double]$r.SJC_Mieng_Ban_VND_Luong
        Cap_Nhat_Luc            = $r.Cap_Nhat_Luc
    }
    $cleanList.Add($obj)
}

$utf8WithBom = New-Object System.Text.UTF8Encoding $true

# Write CSV UTF8 BOM
$sw = New-Object System.IO.StreamWriter($csvPath, $false, $utf8WithBom)
$sw.WriteLine('"Ngay","ISO_Date","Thu","Loai_Vang","Gia_Mua_VND_Luong","Gia_Ban_VND_Luong","Chenh_Lech_VND_Luong","Gia_Mua_VND_Chi","Gia_Ban_VND_Chi","Gia_The_Gioi_USD_oz","SJC_Mieng_Mua_VND_Luong","SJC_Mieng_Ban_VND_Luong","Cap_Nhat_Luc"')

foreach ($c in $cleanList) {
    $line = '"{0}","{1}","{2}","{3}",{4},{5},{6},{7},{8},{9},{10},{11},"{12}"' -f `
        $c.Ngay, $c.ISO_Date, $c.Thu, $c.Loai_Vang, `
        $c.Gia_Mua_VND_Luong, $c.Gia_Ban_VND_Luong, $c.Chenh_Lech_VND_Luong, `
        $c.Gia_Mua_VND_Chi, $c.Gia_Ban_VND_Chi, $c.Gia_The_Gioi_USD_oz, `
        $c.SJC_Mieng_Mua, $c.SJC_Mieng_Ban, $c.Cap_Nhat_Luc
    $sw.WriteLine($line)
}
$sw.Close()

# Write JSON UTF8 BOM
$jsonText = $cleanList | ConvertTo-Json -Depth 5
$swJson = New-Object System.IO.StreamWriter($jsonPath, $false, $utf8WithBom)
$swJson.Write($jsonText)
$swJson.Close()

Write-Host "DA SUA LOI PHONG TIENG VIET THANH CONG CHO CSV VA JSON!" -ForegroundColor Green
