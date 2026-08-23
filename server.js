const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Helper: Fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Helper: Get day name in Vietnamese
function getVietnameseDayName(dateObj) {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[dateObj.getDay()];
}

const server = http.createServer(async (req, res) => {
  // API Endpoint: Live Update Gold Prices from Vang.today API
  if (req.url === '/api/update-gold' && (req.method === 'POST' || req.method === 'GET')) {
    try {
      const now = new Date();
      const isoDate = now.toISOString().substring(0, 10);
      const displayDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      const dayName = getVietnameseDayName(now);

      const apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;
      const apiResult = await fetchJson(apiUrl);

      if (!apiResult.success || !apiResult.prices) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'API không trả về dữ liệu thành công' }));
      }

      const sjRing = apiResult.prices.SJ9999 || {};
      const sjcBar = apiResult.prices.SJL1L10 || {};
      const xau = apiResult.prices.XAUUSD || {};

      const buyLuong = parseFloat(sjRing.buy) || 0;
      const sellLuong = parseFloat(sjRing.sell) || 0;
      const spreadLuong = sellLuong - buyLuong;
      const worldUsd = parseFloat(xau.buy) || 0;
      const worldVnd = Math.round((worldUsd * 26000) / 0.829426);
      const spreadWorld = sellLuong - worldVnd;

      const barBuy = parseFloat(sjcBar.buy) || 0;
      const barSell = parseFloat(sjcBar.sell) || 0;
      const updateTime = apiResult.time || `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      const newRecord = {
        Ngay: displayDate,
        ISO_Date: isoDate,
        Thu: dayName,
        Loai_Vang: "Vàng nhẫn SJC 9999",
        Gia_Mua_VND_Luong: buyLuong,
        Gia_Ban_VND_Luong: sellLuong,
        Chenh_Lech_VND_Luong: spreadLuong,
        Gia_Mua_VND_Chi: buyLuong / 10,
        Gia_Ban_VND_Chi: sellLuong / 10,
        Gia_The_Gioi_USD_oz: worldUsd,
        Gia_The_Gioi_VND_Luong: worldVnd,
        Chenh_Lech_The_Gioi: spreadWorld,
        SJC_Mieng_Mua: barBuy,
        SJC_Mieng_Ban: barSell,
        Cap_Nhat_Luc: updateTime
      };

      // Load existing gold_data.json
      const jsonPath = path.join(PUBLIC_DIR, 'gold_data.json');
      let goldData = [];
      if (fs.existsSync(jsonPath)) {
        const rawJson = fs.readFileSync(jsonPath, 'utf-8');
        goldData = JSON.parse(rawJson.replace(/^\uFEFF/, ''));
      }

      // Check if record for today exists
      const existingIdx = goldData.findIndex(item => item.ISO_Date === isoDate);
      if (existingIdx >= 0) {
        goldData[existingIdx] = newRecord;
      } else {
        goldData.push(newRecord);
      }

      // Sort chronologically
      goldData.sort((a, b) => new Date(a.ISO_Date) - new Date(b.ISO_Date));

      // Save gold_data.json with UTF-8 BOM
      fs.writeFileSync(jsonPath, '\uFEFF' + JSON.stringify(goldData, null, 4), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: `Đã cập nhật trực tiếp dữ liệu ngày ${displayDate} (${updateTime}) thành công!`,
        latestRecord: newRecord,
        totalRecords: goldData.length,
        fullData: goldData
      }));

    } catch (error) {
      console.error('Lỗi khi cập nhật dữ liệu trực tiếp:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
  }

  // Static File Server
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Gold Dashboard Server running at http://localhost:${PORT}`);
});
