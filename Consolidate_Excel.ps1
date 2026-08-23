# Script hợp nhất 4 file Excel/CSV thành 1 file Excel duy nhất: Gia_Vang_Nhan_SJC_2026.xlsx (chứa 3 Worksheets)

$excelFile = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.xlsx"
$csvFile   = Join-Path $PSScriptRoot "Gia_Vang_Nhan_SJC_2026.csv"

if (-not (Test-Path $csvFile)) {
    Write-Host "Khong tim thay CSV!" -ForegroundColor Red
    exit
}

$results = Import-Csv -Path $csvFile -Encoding UTF8

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " BAT DAU HOP NHAT THANH 1 FILE EXCEL DUY NHAT: Gia_Vang_Nhan_SJC_2026.xlsx" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# Tạo mới hoặc mở Workbook hợp nhất
$wb = $excel.Workbooks.Add()

# -----------------------------------------------------------------------------
# SHEET 1: Theo Dõi Theo Tuần (16 cột có công thức Tuần & định dạng màu sắc)
# -----------------------------------------------------------------------------
$ws1 = $wb.Worksheets.Item(1)
$ws1.Name = "Theo Dõi Theo Tuần"

# Headers Sheet 1
$headers1 = @("Ngay", "ISO_Date", "Tháng/Tuần", "Thu", "Loai_Vang", "Gia_Mua_VND_Luong", "Gia_Ban_VND_Luong", "Giá vàng thế giới", "Độ chênh lệch", "Chenh_Lech_VND_Luong", "Gia_Mua_VND_Chi", "Gia_Ban_VND_Chi", "Gia_The_Gioi_USD_oz", "SJC_Mieng_Mua_VND_Luong", "SJC_Mieng_Ban_VND_Luong", "Cap_Nhat_Luc")
for ($c = 1; $c -le $headers1.Count; $c++) {
    $ws1.Cells.Item(1, $c).Value2 = $headers1[$c-1]
}

# Header Style Sheet 1
$headerRange1 = $ws1.Range($ws1.Cells.Item(1, 1), $ws1.Cells.Item(1, 16))
$headerRange1.Font.Bold = $true
$headerRange1.Font.ColorIndex = 2 # White
$headerRange1.Interior.Color = 0x7D491F # Navy blue (#1F497D in BGR)
$headerRange1.HorizontalAlignment = -4108 # Center

$rowIdx = 2
foreach ($r in $results) {
    $ws1.Cells.Item($rowIdx, 1).Value2 = [string]$r.Ngay
    $ws1.Cells.Item($rowIdx, 2).Value2 = [string]$r.ISO_Date
    $ws1.Cells.Item($rowIdx, 3).Formula = '=+"Tuần "&WEEKNUM(B' + $rowIdx + ')'
    $ws1.Cells.Item($rowIdx, 4).Value2 = [string]$r.Thu
    $ws1.Cells.Item($rowIdx, 5).Value2 = "Vàng nhẫn SJC"
    $ws1.Cells.Item($rowIdx, 6).Value2 = [double]$r.Gia_Mua_VND_Luong
    $ws1.Cells.Item($rowIdx, 7).Value2 = [double]$r.Gia_Ban_VND_Luong
    $ws1.Cells.Item($rowIdx, 8).Formula = '=+(M' + $rowIdx + '*26000)/0.829426'
    $ws1.Cells.Item($rowIdx, 9).Formula = '=+G' + $rowIdx + '-H' + $rowIdx
    $ws1.Cells.Item($rowIdx, 10).Value2 = [double]$r.Chenh_Lech_VND_Luong
    $ws1.Cells.Item($rowIdx, 11).Value2 = [double]$r.Gia_Mua_VND_Chi
    $ws1.Cells.Item($rowIdx, 12).Value2 = [double]$r.Gia_Ban_VND_Chi
    $ws1.Cells.Item($rowIdx, 13).Value2 = [double]$r.Gia_The_Gioi_USD_oz
    $ws1.Cells.Item($rowIdx, 14).Value2 = [double]$r.SJC_Mieng_Mua_VND_Luong
    $ws1.Cells.Item($rowIdx, 15).Value2 = [double]$r.SJC_Mieng_Ban_VND_Luong
    $ws1.Cells.Item($rowIdx, 16).Value2 = [string]$r.Cap_Nhat_Luc
    $rowIdx++
}

# Formatting Sheet 1
$ws1.Columns.Item(6).NumberFormat = "#,##0"
$ws1.Columns.Item(7).NumberFormat = "#,##0"
$ws1.Columns.Item(8).NumberFormat = "#,##0"
$ws1.Columns.Item(9).NumberFormat = "#,##0"
$ws1.Columns.Item(10).NumberFormat = "#,##0"
$ws1.Columns.Item(11).NumberFormat = "#,##0"
$ws1.Columns.Item(12).NumberFormat = "#,##0"
$ws1.Columns.Item(13).NumberFormat = "#,##0.0"
$ws1.Columns.Item(14).NumberFormat = "#,##0"
$ws1.Columns.Item(15).NumberFormat = "#,##0"

# -----------------------------------------------------------------------------
# SHEET 2: Dữ Liệu Phân Tích Theo Tháng (16 cột có công thức Tháng)
# -----------------------------------------------------------------------------
$ws2 = $wb.Worksheets.Add([System.Reflection.Missing]::Value, $ws1)
$ws2.Name = "Phân Tích Theo Tháng"

for ($c = 1; $c -le $headers1.Count; $c++) {
    $ws2.Cells.Item(1, $c).Value2 = $headers1[$c-1]
}
$headerRange2 = $ws2.Range($ws2.Cells.Item(1, 1), $ws2.Cells.Item(1, 16))
$headerRange2.Font.Bold = $true
$headerRange2.Font.ColorIndex = 2
$headerRange2.Interior.Color = 0x274E13 # Green
$headerRange2.HorizontalAlignment = -4108

$rowIdx = 2
foreach ($r in $results) {
    $ws2.Cells.Item($rowIdx, 1).Value2 = [string]$r.Ngay
    $ws2.Cells.Item($rowIdx, 2).Value2 = [string]$r.ISO_Date
    $ws2.Cells.Item($rowIdx, 3).Formula = '=TEXT(B' + $rowIdx + ',"mm")'
    $ws2.Cells.Item($rowIdx, 4).Value2 = [string]$r.Thu
    $ws2.Cells.Item($rowIdx, 5).Value2 = "Vàng nhẫn SJC 9999"
    $ws2.Cells.Item($rowIdx, 6).Value2 = [double]$r.Gia_Mua_VND_Luong
    $ws2.Cells.Item($rowIdx, 7).Value2 = [double]$r.Gia_Ban_VND_Luong
    $ws2.Cells.Item($rowIdx, 8).Formula = '=M' + $rowIdx + '*26000*1.20565'
    $ws2.Cells.Item($rowIdx, 9).Formula = '=G' + $rowIdx + '-H' + $rowIdx
    $ws2.Cells.Item($rowIdx, 10).Value2 = [double]$r.Chenh_Lech_VND_Luong
    $ws2.Cells.Item($rowIdx, 11).Value2 = [double]$r.Gia_Mua_VND_Chi
    $ws2.Cells.Item($rowIdx, 12).Value2 = [double]$r.Gia_Ban_VND_Chi
    $ws2.Cells.Item($rowIdx, 13).Value2 = [double]$r.Gia_The_Gioi_USD_oz
    $ws2.Cells.Item($rowIdx, 14).Value2 = [double]$r.SJC_Mieng_Mua_VND_Luong
    $ws2.Cells.Item($rowIdx, 15).Value2 = [double]$r.SJC_Mieng_Ban_VND_Luong
    $ws2.Cells.Item($rowIdx, 16).Value2 = [string]$r.Cap_Nhat_Luc
    $rowIdx++
}

$ws2.Columns.Item(6).NumberFormat = "#,##0"
$ws2.Columns.Item(7).NumberFormat = "#,##0"
$ws2.Columns.Item(8).NumberFormat = "#,##0"
$ws2.Columns.Item(9).NumberFormat = "#,##0"
$ws2.Columns.Item(10).NumberFormat = "#,##0"
$ws2.Columns.Item(11).NumberFormat = "#,##0"
$ws2.Columns.Item(12).NumberFormat = "#,##0"
$ws2.Columns.Item(13).NumberFormat = "#,##0.0"
$ws2.Columns.Item(14).NumberFormat = "#,##0"
$ws2.Columns.Item(15).NumberFormat = "#,##0"

# -----------------------------------------------------------------------------
# SHEET 3: Dữ Liệu Thô (12 Cột Thô)
# -----------------------------------------------------------------------------
$ws3 = $wb.Worksheets.Add([System.Reflection.Missing]::Value, $ws2)
$ws3.Name = "Dữ Liệu Thô"

$headers3 = @("Ngày", "ISO Date", "Thứ", "Loại vàng", "Giá Mua (VNĐ/lượng)", "Giá Bán (VNĐ/lượng)", "Chênh lệch (VNĐ/lượng)", "Giá Mua (VNĐ/chỉ)", "Giá Bán (VNĐ/chỉ)", "SJC Miếng Mua", "SJC Miếng Bán", "Cập nhật lúc")
for ($c = 1; $c -le $headers3.Count; $c++) {
    $ws3.Cells.Item(1, $c).Value2 = $headers3[$c-1]
}
$headerRange3 = $ws3.Range($ws3.Cells.Item(1, 1), $ws3.Cells.Item(1, 12))
$headerRange3.Font.Bold = $true
$headerRange3.Font.ColorIndex = 2
$headerRange3.Interior.Color = 0x4A4A4A # Gray
$headerRange3.HorizontalAlignment = -4108

$rowIdx = 2
foreach ($r in $results) {
    $ws3.Cells.Item($rowIdx, 1).Value2 = [string]$r.Ngay
    $ws3.Cells.Item($rowIdx, 2).Value2 = [string]$r.ISO_Date
    $ws3.Cells.Item($rowIdx, 3).Value2 = [string]$r.Thu
    $ws3.Cells.Item($rowIdx, 4).Value2 = "Vàng nhẫn SJC 9999"
    $ws3.Cells.Item($rowIdx, 5).Value2 = [double]$r.Gia_Mua_VND_Luong
    $ws3.Cells.Item($rowIdx, 6).Value2 = [double]$r.Gia_Ban_VND_Luong
    $ws3.Cells.Item($rowIdx, 7).Value2 = [double]$r.Chenh_Lech_VND_Luong
    $ws3.Cells.Item($rowIdx, 8).Value2 = [double]$r.Gia_Mua_VND_Chi
    $ws3.Cells.Item($rowIdx, 9).Value2 = [double]$r.Gia_Ban_VND_Chi
    $ws3.Cells.Item($rowIdx, 10).Value2 = [double]$r.SJC_Mieng_Mua_VND_Luong
    $ws3.Cells.Item($rowIdx, 11).Value2 = [double]$r.SJC_Mieng_Ban_VND_Luong
    $ws3.Cells.Item($rowIdx, 12).Value2 = [string]$r.Cap_Nhat_Luc
    $rowIdx++
}

$ws3.Columns.Item(5).NumberFormat = "#,##0"
$ws3.Columns.Item(6).NumberFormat = "#,##0"
$ws3.Columns.Item(7).NumberFormat = "#,##0"
$ws3.Columns.Item(8).NumberFormat = "#,##0"
$ws3.Columns.Item(9).NumberFormat = "#,##0"
$ws3.Columns.Item(10).NumberFormat = "#,##0"
$ws3.Columns.Item(11).NumberFormat = "#,##0"

# Save File Workbook hợp nhất
if (Test-Path $excelFile) {
    Remove-Item -Path $excelFile -Force
}
$wb.SaveAs($excelFile, 51) # 51 = xlOpenXMLWorkbook (.xlsx)
$wb.Close($true)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "[HOÀN THÀNH] Đã hợp nhất thành công vào file duy nhất: $excelFile" -ForegroundColor Green
