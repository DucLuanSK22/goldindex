<#
.SYNOPSIS
    Tạo các file Excel chuẩn tiếng Việt (UTF-16LE, HTML XLS, XLSX) không bị lỗi font khi mở bằng MS Excel.
#>

# 1. Đọc dữ liệu từ CSV hiện tại
$csvPath = "c:\Users\luanl\OneDrive\Documents\Investment\Gia_Vang_Nhan_SJC_2026.csv"
$data = Import-Csv -Path $csvPath -Encoding UTF8

Write-Host "Tổng số dòng đọc được: $($data.Count)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# ĐỊNH DẠNG 1: FILE CSV UTF-16LE (Định dạng chuẩn nhất để Excel trên Windows mở trực tiếp không lỗi font)
# -----------------------------------------------------------------------------
$utf16Path = "c:\Users\luanl\OneDrive\Documents\Investment\Gia_Vang_Nhan_SJC_2026_Excel_UTF16.csv"
$utf16Encoding = New-Object System.Text.UnicodeEncoding $false, $true # UTF-16LE with BOM
$sw = New-Object System.IO.StreamWriter($utf16Path, $false, $utf16Encoding)

# Header tab-separated
$sw.WriteLine("Ngày`tISO Date`tThứ`tLoại vàng`tGiá Mua (VNĐ/lượng)`tGiá Bán (VNĐ/lượng)`tChênh lệch (VNĐ/lượng)`tGiá Mua (VNĐ/chỉ)`tGiá Bán (VNĐ/chỉ)`tSJC Miếng Mua (VNĐ/lượng)`tSJC Miếng Bán (VNĐ/lượng)`tCập nhật lúc")

foreach ($row in $data) {
    $line = "{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}`t{10}`t{11}" -f `
        $row.Ngay, `
        $row.ISO_Date, `
        $row.Thu, `
        $row.Loai_Vang, `
        $row.Gia_Mua_VND_Luong, `
        $row.Gia_Ban_VND_Luong, `
        $row.Chenh_Lech_VND_Luong, `
        $row.Gia_Mua_VND_Chi, `
        $row.Gia_Ban_VND_Chi, `
        $row.SJC_Mieng_Mua_VND_Luong, `
        $row.SJC_Mieng_Ban_VND_Luong, `
        $row.Cap_Nhat_Luc
    $sw.WriteLine($line)
}
$sw.Close()
Write-Host "Đã xuất file CSV UTF-16LE: $utf16Path" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# ĐỊNH DẠNG 2: FILE EXCEL XLS (HTML Spreadsheet chuẩn có định dạng màu sắc & phông chữ tiếng Việt)
# -----------------------------------------------------------------------------
$xlsPath = "c:\Users\luanl\OneDrive\Documents\Investment\Gia_Vang_Nhan_SJC_2026.xls"
$utf8WithBom = New-Object System.Text.UTF8Encoding $true
$swXls = New-Object System.IO.StreamWriter($xlsPath, $false, $utf8WithBom)

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
  .bold { font-weight: bold; }
  tr:nth-child(even) { background-color: #F2F5F9; }
</style>
</head>
<body>
<h2>BẢNG GIÁ VÀNG NHẪN SJC 9999 (01/01/2026 - 15/08/2026)</h2>
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
      <th>SJC Miếng Mua (đ/lượng)</th>
      <th>SJC Miếng Bán (đ/lượng)</th>
      <th>Cập Nhật Lúc</th>
    </tr>
  </thead>
  <tbody>
"@
$swXls.WriteLine($htmlHeader)

foreach ($row in $data) {
    $buyLuong = [double]$row.Gia_Mua_VND_Luong
    $sellLuong = [double]$row.Gia_Ban_VND_Luong
    $spread = [double]$row.Chenh_Lech_VND_Luong
    $buyChi = [double]$row.Gia_Mua_VND_Chi
    $sellChi = [double]$row.Gia_Ban_VND_Chi
    $barBuy = if ($row.SJC_Mieng_Mua_VND_Luong) { [double]$row.SJC_Mieng_Mua_VND_Luong } else { 0 }
    $barSell = if ($row.SJC_Mieng_Ban_VND_Luong) { [double]$row.SJC_Mieng_Ban_VND_Luong } else { 0 }

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

Write-Host "Đã xuất file Excel XLS HTML: $xlsPath" -ForegroundColor Cyan
