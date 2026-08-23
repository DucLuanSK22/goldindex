#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script thu thập lịch sử giá vàng nhẫn SJC 9999 từ 01/01/2026 đến ngày hiện tại.
REMARK: [KHÔNG BẮT BUỘC] Kịch bản Python tùy chọn. Mặc định dự án sử dụng Update_World_Gold.ps1.
Tác giả: Antigravity AI
"""

import urllib.request
import json
import csv
from datetime import datetime, timedelta
import os

def collect_sjc_gold(start_date_str="2026-01-01", end_date_str="2026-08-15"):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    current_date = start_date
    records = []
    
    days_map = {
        0: "Thứ Hai",
        1: "Thứ Ba",
        2: "Thứ Tư",
        3: "Thứ Năm",
        4: "Thứ Sáu",
        5: "Thứ Bảy",
        6: "Chủ Nhật"
    }

    print("==========================================================================")
    print(f" THU THẬP GIÁ VÀNG NHẪN SJC 9999 ({start_date_str} - {end_date_str})")
    print("==========================================================================")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    while current_date <= end_date:
        date_iso = current_date.strftime("%Y-%m-%d")
        date_display = current_date.strftime("%d/%m/%Y")
        day_name = days_map[current_date.weekday()]
        
        url = f"https://www.vang.today/api/prices?date={date_iso}"
        req = urllib.request.Request(url, headers=headers)
        
        success = False
        for retry in range(3):
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    if data.get("success") and "prices" in data:
                        prices = data["prices"]
                        sj_ring = prices.get("SJ9999")
                        sjc_bar = prices.get("SJL1L10")
                        
                        if sj_ring:
                            buy_luong = float(sj_ring["buy"])
                            sell_luong = float(sj_ring["sell"])
                            spread_luong = sell_luong - buy_luong
                            
                            buy_chi = buy_luong / 10.0
                            sell_chi = sell_luong / 10.0
                            
                            bar_buy = float(sjc_bar["buy"]) if sjc_bar else None
                            bar_sell = float(sjc_bar["sell"]) if sjc_bar else None
                            
                            record = {
                                "Ngày": date_display,
                                "ISO Date": date_iso,
                                "Thứ": day_name,
                                "Loại vàng": "Vàng nhẫn SJC 9999",
                                "Giá Mua (VNĐ/lượng)": buy_luong,
                                "Giá Bán (VNĐ/lượng)": sell_luong,
                                "Chênh lệch (VNĐ/lượng)": spread_luong,
                                "Giá Mua (VNĐ/chỉ)": buy_chi,
                                "Giá Bán (VNĐ/chỉ)": sell_chi,
                                "SJC Miếng Mua (VNĐ/lượng)": bar_buy,
                                "SJC Miếng Bán (VNĐ/lượng)": bar_sell,
                                "Thời gian cập nhật": data.get("time", "")
                            }
                            records.append(record)
                            print(f"[{date_display}] {day_name} | Mua: {buy_luong:,.0f} VNĐ/lượng | Bán: {sell_luong:,.0f} VNĐ/lượng")
                            success = True
                            break
            except Exception as e:
                pass
        
        if not success:
            print(f"[{date_display}] Không lấy được dữ liệu.")
            
        current_date += timedelta(days=1)
        
    return records

def export_to_csv(records, filename="Gia_Vang_Nhan_SJC_2026.csv"):
    if not records:
        print("Không có dữ liệu để xuất.")
        return
        
    fieldnames = list(records[0].keys())
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    print(f"\n[Thành công] Đã xuất file CSV: {filepath}")

if __name__ == "__main__":
    records = collect_sjc_gold("2026-01-01", "2026-08-15")
    export_to_csv(records)
