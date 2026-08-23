<#
.SYNOPSIS
    Script kiểm tra API Giá Vàng Thế Giới.
.REMARK
    [KHÔNG BẮT BUỘC] Script kiểm thử dành cho nhà phát triển.
#>
$dates = @("2026-01-01", "2026-01-05", "2026-02-15", "2026-05-10", "2026-08-14", "2026-08-15")

foreach ($d in $dates) {
    $u = "https://www.vang.today/api/prices?date=$d"
    try {
        $res = Invoke-RestMethod -Uri $u -Headers @{"User-Agent"="Mozilla/5.0"}
        $xau = $res.prices.XAUUSD
        if ($xau) {
            Write-Host "$d : World Gold (XAU/USD) = $($xau.buy) USD/oz"
        } else {
            Write-Host "$d : No XAUUSD data"
        }
    } catch {
        Write-Host "$d : Error $_"
    }
}
