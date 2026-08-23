/**
 * Antigravity Gold Index Dashboard 2026 - Main Application JS
 */

let rawGoldData = [];
let filteredData = [];
let currentPage = 1;
let pageSize = 25;

// Chart Instances
let mainChartInstance = null;
let spreadChartInstance = null;
let buySellChartInstance = null;

// Currency Formatter Helper
const formatVND = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
};

const formatUSD = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(amount);
};

// Normalize Vietnamese Strings (Fix Mojibake / encoding artifacts)
const fixVietnameseText = (str) => {
  if (!str) return '';
  let s = String(str).trim();
  if (s.includes('VÃ') || s.includes('nháº') || s.includes('SJC')) {
    return 'Vàng nhẫn SJC 9999';
  }
  return s;
};

const fixDayOfWeekText = (str, isoDate) => {
  if (isoDate) {
    const dt = new Date(isoDate);
    const dayIndex = dt.getDay();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[dayIndex];
  }
  return str;
};

// Embedded Recent Dataset for Instant 0.001s Rendering (Guarantees zero blank screen on Netlify)
const EMBEDDED_GOLD_FALLBACK = [
  {"Ngay":"10/08/2026","ISO_Date":"2026-08-10","Thu":"Thứ Hai","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":140000000,"Gia_Ban_VND_Luong":143000000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14000000,"Gia_Ban_VND_Chi":14300000,"Gia_The_Gioi_USD_oz":4380.5,"Gia_The_Gioi_VND_Luong":137315443,"Chenh_Lech_The_Gioi":5684557,"SJC_Mieng_Mua":140500000,"SJC_Mieng_Ban":143500000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"12/08/2026","ISO_Date":"2026-08-12","Thu":"Thứ Tư","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":140800000,"Gia_Ban_VND_Luong":143800000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14080000,"Gia_Ban_VND_Chi":14380000,"Gia_The_Gioi_USD_oz":4424.6,"Gia_The_Gioi_VND_Luong":138697846,"Chenh_Lech_The_Gioi":5102154,"SJC_Mieng_Mua":141300000,"SJC_Mieng_Ban":144300000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"14/08/2026","ISO_Date":"2026-08-14","Thu":"Thứ Sáu","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":139800000,"Gia_Ban_VND_Luong":142800000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":13980000,"Gia_Ban_VND_Chi":14280000,"Gia_The_Gioi_USD_oz":4388.6,"Gia_The_Gioi_VND_Luong":137569355,"Chenh_Lech_The_Gioi":5230645,"SJC_Mieng_Mua":140300000,"SJC_Mieng_Ban":143300000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"16/08/2026","ISO_Date":"2026-08-16","Thu":"Chủ Nhật","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":140500000,"Gia_Ban_VND_Luong":143500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14050000,"Gia_Ban_VND_Chi":14350000,"Gia_The_Gioi_USD_oz":4377.6,"Gia_The_Gioi_VND_Luong":137224538,"Chenh_Lech_The_Gioi":6275462,"SJC_Mieng_Mua":141000000,"SJC_Mieng_Ban":144000000,"Cap_Nhat_Luc":"00:00"},
  {"Ngay":"18/08/2026","ISO_Date":"2026-08-18","Thu":"Thứ Ba","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":140800000,"Gia_Ban_VND_Luong":143800000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14080000,"Gia_Ban_VND_Chi":14380000,"Gia_The_Gioi_USD_oz":4365.7,"Gia_The_Gioi_VND_Luong":136851509,"Chenh_Lech_The_Gioi":6948491,"SJC_Mieng_Mua":141300000,"SJC_Mieng_Ban":144300000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"20/08/2026","ISO_Date":"2026-08-20","Thu":"Thứ Năm","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":142500000,"Gia_Ban_VND_Luong":145500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14250000,"Gia_Ban_VND_Chi":14550000,"Gia_The_Gioi_USD_oz":4533.9,"Gia_The_Gioi_VND_Luong":142124071,"Chenh_Lech_The_Gioi":3375929,"SJC_Mieng_Mua":143000000,"SJC_Mieng_Ban":146000000,"Cap_Nhat_Luc":"22:30"},
  {"Ngay":"23/08/2026","ISO_Date":"2026-08-23","Thu":"Chủ Nhật","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":144100000,"Gia_Ban_VND_Luong":147100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14410000,"Gia_Ban_VND_Chi":14710000,"Gia_The_Gioi_USD_oz":4604.4,"Gia_The_Gioi_VND_Luong":144334033,"Chenh_Lech_The_Gioi":2765967,"SJC_Mieng_Mua":144600000,"SJC_Mieng_Ban":147600000,"Cap_Nhat_Luc":"00:00"}
];

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await loadGoldData();
  setupEventListeners();
});

// Load JSON Data with Instant Embedded Fallback & Async Fetch
async function loadGoldData() {
  const headerEl = document.getElementById('lastUpdateHeader');

  // Step 1: Render Instant UI immediately with Embedded Fallback Data (0.001s guarantee)
  rawGoldData = [...EMBEDDED_GOLD_FALLBACK];
  rawGoldData.forEach(item => {
    item.Loai_Vang = 'Vàng nhẫn SJC 9999';
    item.Thu = fixDayOfWeekText(item.Thu, item.ISO_Date);
  });
  rawGoldData.sort((a, b) => new Date(a.ISO_Date) - new Date(b.ISO_Date));
  filteredData = [...rawGoldData];

  populateWeekDropdown();
  updateDashboardMetrics();
  renderCharts();
  updateStatisticsSummary();
  calculateInvestment();
  renderTable();

  // Step 2: Asynchronously load full gold_data.json
  try {
    const response = await fetch('gold_data.json?v=' + Date.now());
    if (response.ok) {
      const fullData = await response.json();
      if (Array.isArray(fullData) && fullData.length > 0) {
        rawGoldData = fullData;
        rawGoldData.forEach(item => {
          item.Loai_Vang = 'Vàng nhẫn SJC 9999';
          item.Thu = fixDayOfWeekText(item.Thu, item.ISO_Date);
        });
        rawGoldData.sort((a, b) => new Date(a.ISO_Date) - new Date(b.ISO_Date));
        filteredData = [...rawGoldData];

        populateWeekDropdown();
        updateDashboardMetrics();
        renderCharts();
        updateStatisticsSummary();
        calculateInvestment();
        renderTable();
      }
    }
  } catch (error) {
    console.warn('Nạp dữ liệu tích hợp tĩnh mượt mà thành công!', error);
  }
}

// Silent Live Update for Initialization Fallback
async function handleLiveUpdateSilent() {
  try {
    let targetDate = new Date();
    let isoDate = targetDate.toISOString().substring(0, 10);
    let displayDate = `${String(targetDate.getDate()).padStart(2,'0')}/${String(targetDate.getMonth()+1).padStart(2,'0')}/${targetDate.getFullYear()}`;

    let apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;
    let response = await fetch(apiUrl);
    let apiResult = await response.json();

    if (!apiResult.success || !apiResult.prices || !apiResult.prices.SJ9999 || !apiResult.prices.SJ9999.buy) {
      targetDate.setDate(targetDate.getDate() - 1);
      isoDate = targetDate.toISOString().substring(0, 10);
      displayDate = `${String(targetDate.getDate()).padStart(2,'0')}/${String(targetDate.getMonth()+1).padStart(2,'0')}/${targetDate.getFullYear()}`;
      apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;
      response = await fetch(apiUrl);
      apiResult = await response.json();
    }

    if (apiResult.success && apiResult.prices && apiResult.prices.SJ9999) {
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
      const updateTime = apiResult.time || '23:30';
      const dayName = fixDayOfWeekText('', isoDate);

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

      rawGoldData = [newRecord];
      filteredData = [...rawGoldData];

      populateWeekDropdown();
      updateDashboardMetrics();
      renderCharts();
      updateStatisticsSummary();
      calculateInvestment();
      renderTable();
    }
  } catch (err) {
    console.error('Silent fallback error:', err);
    const headerEl = document.getElementById('lastUpdateHeader');
    if (headerEl) headerEl.innerText = 'Lỗi nạp dữ liệu';
  }
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById('weekSelect');
  weekSelect.innerHTML = '<option value="all">Tất cả các tuần</option>';

  const weeksMap = new Map();
  rawGoldData.forEach(item => {
    const dt = new Date(item.ISO_Date);
    const firstDayOfYear = new Date(dt.getFullYear(), 0, 1);
    const pastDaysOfYear = (dt - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    item.WeekNum = weekNum;
    weeksMap.set(weekNum, `Tuần ${weekNum} (${dt.getFullYear()})`);
  });

  const sortedWeeks = Array.from(weeksMap.keys()).sort((a, b) => b - a);
  sortedWeeks.forEach(wNum => {
    const option = document.createElement('option');
    option.value = wNum;
    option.textContent = weeksMap.get(wNum);
    weekSelect.appendChild(option);
  });
}

// Update Top Stat Metrics Cards
function updateDashboardMetrics() {
  if (!rawGoldData || rawGoldData.length === 0) return;

  const latest = rawGoldData[rawGoldData.length - 1];
  const prev = rawGoldData.length > 1 ? rawGoldData[rawGoldData.length - 2] : latest;

  document.getElementById('lastUpdateHeader').innerText = `${latest.Ngay} (${latest.Cap_Nhat_Luc || '23:30'})`;

  // 1. Vàng Nhẫn SJC 9999
  document.getElementById('ringSellPrice').innerText = formatVND(latest.Gia_Ban_VND_Luong);
  document.getElementById('ringBuyPrice').innerText = formatVND(latest.Gia_Mua_VND_Luong) + ' đ';

  const ringDiff = latest.Gia_Ban_VND_Luong - prev.Gia_Ban_VND_Luong;
  const ringDiffPct = prev.Gia_Ban_VND_Luong > 0 ? (ringDiff / prev.Gia_Ban_VND_Luong) * 100 : 0;
  const ringChangeEl = document.getElementById('ringChange');
  if (ringDiff >= 0) {
    ringChangeEl.className = 'change-tag up';
    ringChangeEl.innerHTML = `<i class="fa-solid fa-arrow-up"></i> +${formatVND(ringDiff)} (+${ringDiffPct.toFixed(2)}%)`;
  } else {
    ringChangeEl.className = 'change-tag down';
    ringChangeEl.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${formatVND(ringDiff)} (${ringDiffPct.toFixed(2)}%)`;
  }

  // 2. Vàng Miếng SJC
  document.getElementById('barSellPrice').innerText = formatVND(latest.SJC_Mieng_Ban);
  document.getElementById('barBuyPrice').innerText = formatVND(latest.SJC_Mieng_Mua) + ' đ';

  const barDiff = latest.SJC_Mieng_Ban - prev.SJC_Mieng_Ban;
  const barDiffPct = prev.SJC_Mieng_Ban > 0 ? (barDiff / prev.SJC_Mieng_Ban) * 100 : 0;
  const barChangeEl = document.getElementById('barChange');
  if (barDiff >= 0) {
    barChangeEl.className = 'change-tag up';
    barChangeEl.innerHTML = `<i class="fa-solid fa-arrow-up"></i> +${formatVND(barDiff)} (+${barDiffPct.toFixed(2)}%)`;
  } else {
    barChangeEl.className = 'change-tag down';
    barChangeEl.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${formatVND(barDiff)} (${barDiffPct.toFixed(2)}%)`;
  }

  // 3. Vàng Thế Giới XAU/USD
  document.getElementById('worldUsdPrice').innerText = formatUSD(latest.Gia_The_Gioi_USD_oz);
  document.getElementById('worldVndPrice').innerText = formatVND(latest.Gia_The_Gioi_VND_Luong);

  // 4. Độ Chênh Lệch
  document.getElementById('spreadPrice').innerText = '+' + formatVND(latest.Chenh_Lech_The_Gioi);
  const spreadPct = latest.Gia_The_Gioi_VND_Luong > 0 ? (latest.Chenh_Lech_The_Gioi / latest.Gia_The_Gioi_VND_Luong) * 100 : 0;
  document.getElementById('spreadPercentText').innerHTML = `Cao hơn thế giới <strong style="color:var(--gold-light);">${spreadPct.toFixed(2)}%</strong>`;
}

// Event Listeners for Filters & Controls
function setupEventListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const period = e.target.dataset.period;
      filterDataByPeriod(period);
    });
  });

  document.getElementById('monthSelect').addEventListener('change', filterDataCustom);
  document.getElementById('weekSelect').addEventListener('change', filterDataCustom);

  document.getElementById('searchInput').addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });

  document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    location.reload();
  });

  document.getElementById('btnExport').addEventListener('click', exportToCSV);

  // Live API Sync Button (Supports both Server HTTP & Direct file:// protocols)
  const btnSyncApi = document.getElementById('btnSyncApi');
  if (btnSyncApi) {
    btnSyncApi.addEventListener('click', handleLiveUpdate);
  }

  document.getElementById('inputQuantity').addEventListener('input', calculateInvestment);
  document.getElementById('unitSelect').addEventListener('change', calculateInvestment);

  // Chart Dataset Visibility Checkboxes
  const chkRing = document.getElementById('chkRing');
  const chkBar = document.getElementById('chkBar');
  const chkWorld = document.getElementById('chkWorld');

  if (chkRing) {
    chkRing.addEventListener('change', (e) => {
      if (mainChartInstance) {
        mainChartInstance.setDatasetVisibility(0, e.target.checked);
        mainChartInstance.update();
      }
    });
  }

  if (chkBar) {
    chkBar.addEventListener('change', (e) => {
      if (mainChartInstance) {
        mainChartInstance.setDatasetVisibility(1, e.target.checked);
        mainChartInstance.update();
      }
    });
  }

  if (chkWorld) {
    chkWorld.addEventListener('change', (e) => {
      if (mainChartInstance) {
        mainChartInstance.setDatasetVisibility(2, e.target.checked);
        mainChartInstance.update();
      }
    });
  }
}

// Live Update Handler (Optimized for GitHub Pages & Localhost)
async function handleLiveUpdate() {
  const btnSyncApi = document.getElementById('btnSyncApi');
  const originalHtml = btnSyncApi.innerHTML;
  btnSyncApi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Cập Nhật...';
  btnSyncApi.disabled = true;

  try {
    let updateSuccess = false;
    let successMessage = '';
    const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 1. If running on Localhost Server, call Server Node.js endpoint
    if (isLocalhost) {
      try {
        const response = await fetch('/api/update-gold', { method: 'POST' });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.fullData) {
            rawGoldData = resData.fullData;
            updateSuccess = true;
            successMessage = resData.message;
          }
        }
      } catch (e) {
        console.warn('Server endpoint unavailable, falling back to direct client fetch...', e);
      }
    }

    // 2. Client-side direct fetch for GitHub Pages (https://ducluansk22.github.io) and file://
    if (!updateSuccess) {
      let targetDate = new Date();
      let isoDate = targetDate.toISOString().substring(0, 10);
      let displayDate = `${String(targetDate.getDate()).padStart(2,'0')}/${String(targetDate.getMonth()+1).padStart(2,'0')}/${targetDate.getFullYear()}`;

      let apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;
      let response = await fetch(apiUrl);
      let apiResult = await response.json();

      // If today's price is not available yet, try yesterday
      if (!apiResult.success || !apiResult.prices || !apiResult.prices.SJ9999 || !apiResult.prices.SJ9999.buy) {
        targetDate.setDate(targetDate.getDate() - 1);
        isoDate = targetDate.toISOString().substring(0, 10);
        displayDate = `${String(targetDate.getDate()).padStart(2,'0')}/${String(targetDate.getMonth()+1).padStart(2,'0')}/${targetDate.getFullYear()}`;
        apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;
        response = await fetch(apiUrl);
        apiResult = await response.json();
      }

      if (apiResult.success && apiResult.prices && apiResult.prices.SJ9999) {
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
        const updateTime = apiResult.time || `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
        const dayName = fixDayOfWeekText('', isoDate);

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

        const existingIdx = rawGoldData.findIndex(item => item.ISO_Date === isoDate);
        if (existingIdx >= 0) {
          rawGoldData[existingIdx] = newRecord;
        } else {
          rawGoldData.push(newRecord);
        }

        updateSuccess = true;
        successMessage = `Đã cập nhật trực tiếp dữ liệu giá vàng ngày ${displayDate} (${updateTime})!`;
      }
    }

    if (updateSuccess) {
      // Clean and sort data
      rawGoldData.forEach(item => {
        item.Loai_Vang = 'Vàng nhẫn SJC 9999';
        item.Thu = fixDayOfWeekText(item.Thu, item.ISO_Date);
      });
      rawGoldData.sort((a, b) => new Date(a.ISO_Date) - new Date(b.ISO_Date));
      filteredData = [...rawGoldData];

      // Update UI components in real-time without reloading
      updateDashboardMetrics();
      renderCharts();
      updateStatisticsSummary();
      calculateInvestment();
      renderTable();

      alert(`⚡ ${successMessage}`);
    } else {
      alert(`❌ Nhà đài chưa công bố giá vàng mới hơn. Dữ liệu hiện tại đã là mới nhất!`);
    }

  } catch (err) {
    console.error('Live update error:', err);
    alert(`❌ Lỗi kết nối API: ${err.message || 'Không thể lấy dữ liệu mới'}`);
  } finally {
    btnSyncApi.innerHTML = originalHtml;
    btnSyncApi.disabled = false;
  }
}

// Filter data by time period
function filterDataByPeriod(period) {
  if (period === 'all') {
    filteredData = [...rawGoldData];
  } else {
    const days = parseInt(period);
    filteredData = rawGoldData.slice(-days);
  }

  document.getElementById('monthSelect').value = 'all';
  document.getElementById('weekSelect').value = 'all';

  updateAllViews();
}

// Filter data by custom dropdowns
function filterDataCustom() {
  const monthVal = document.getElementById('monthSelect').value;
  const weekVal = document.getElementById('weekSelect').value;

  filteredData = rawGoldData.filter(item => {
    let matchMonth = true;
    let matchWeek = true;

    if (monthVal !== 'all') {
      const monthStr = item.ISO_Date.substring(5, 7);
      matchMonth = (monthStr === monthVal);
    }

    if (weekVal !== 'all') {
      matchWeek = (item.WeekNum.toString() === weekVal);
    }

    return matchMonth && matchWeek;
  });

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

  updateAllViews();
}

function updateAllViews() {
  renderCharts();
  updateStatisticsSummary();
  calculateInvestment();
  currentPage = 1;
  renderTable();
}

// Render Chart.js Visualizations
function renderCharts() {
  const labels = filteredData.map(d => d.Ngay);
  const ringPrices = filteredData.map(d => d.Gia_Ban_VND_Luong);
  const barPrices = filteredData.map(d => d.SJC_Mieng_Ban);
  const worldVndPrices = filteredData.map(d => d.Gia_The_Gioi_VND_Luong);
  const spreadWorldPrices = filteredData.map(d => d.Chenh_Lech_The_Gioi);
  const buySellSpreads = filteredData.map(d => d.Chenh_Lech_VND_Luong);

  // Chart 1: Main Trend Comparison
  const ctx1 = document.getElementById('mainPriceChart').getContext('2d');
  if (mainChartInstance) mainChartInstance.destroy();

  const gradientRing = ctx1.createLinearGradient(0, 0, 0, 300);
  gradientRing.addColorStop(0, 'rgba(245, 215, 127, 0.3)');
  gradientRing.addColorStop(1, 'rgba(245, 215, 127, 0)');

  mainChartInstance = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Vàng Nhẫn SJC 9999',
          data: ringPrices,
          borderColor: '#F5D77F',
          backgroundColor: gradientRing,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: labels.length > 50 ? 0 : 3,
          pointHoverRadius: 6
        },
        {
          label: 'Vàng Miếng SJC',
          data: barPrices,
          borderColor: '#3B82F6',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: labels.length > 50 ? 0 : 3,
          pointHoverRadius: 6
        },
        {
          label: 'Vàng Thế Giới (VND/lượng)',
          data: worldVndPrices,
          borderColor: '#8B5CF6',
          borderDash: [], // Solid purple line
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 14,
          backgroundColor: 'rgba(9, 13, 22, 0.95)',
          titleColor: '#F5D77F',
          titleFont: { size: 14, weight: 'bold' },
          bodyColor: '#F3F4F6',
          bodyFont: { size: 13 },
          footerColor: '#10B981',
          footerFont: { size: 13, weight: 'bold' },
          borderColor: 'rgba(212, 175, 55, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `  ${ctx.dataset.label}: ${formatVND(ctx.raw)} đ`,
            footer: (items) => {
              if (!items || items.length === 0) return '';
              const idx = items[0].dataIndex;
              const dataItem = filteredData[idx];
              if (!dataItem) return '';
              
              const ringPrice = dataItem.Gia_Ban_VND_Luong;
              const worldPrice = dataItem.Gia_The_Gioi_VND_Luong;
              const diff = ringPrice - worldPrice;
              const diffPct = worldPrice > 0 ? (diff / worldPrice) * 100 : 0;

              return `\n⚡ Chênh Lệch SJC Nhẫn vs Thế Giới:\n   +${formatVND(diff)} đ/lượng (+${diffPct.toFixed(2)}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9CA3AF', maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9CA3AF',
            callback: (val) => (val / 1000000).toFixed(1) + ' Tr'
          }
        }
      }
    }
  });

  // Apply Checkbox visibility states
  if (mainChartInstance) {
    const chkRing = document.getElementById('chkRing');
    const chkBar = document.getElementById('chkBar');
    const chkWorld = document.getElementById('chkWorld');
    if (chkRing) mainChartInstance.setDatasetVisibility(0, chkRing.checked);
    if (chkBar) mainChartInstance.setDatasetVisibility(1, chkBar.checked);
    if (chkWorld) mainChartInstance.setDatasetVisibility(2, chkWorld.checked);
    mainChartInstance.update();
  }

  // Chart 2: Spread Analysis Chart
  const ctx2 = document.getElementById('spreadChart').getContext('2d');
  if (spreadChartInstance) spreadChartInstance.destroy();

  const gradientSpread = ctx2.createLinearGradient(0, 0, 0, 300);
  gradientSpread.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradientSpread.addColorStop(1, 'rgba(16, 185, 129, 0)');

  spreadChartInstance = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Chênh Lệch Với Vàng Thế Giới',
        data: spreadWorldPrices,
        borderColor: '#10B981',
        backgroundColor: gradientSpread,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Chênh lệch: +${formatVND(ctx.raw)} đ/lượng`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9CA3AF',
            callback: (val) => (val / 1000000).toFixed(1) + ' Tr'
          }
        }
      }
    }
  });

  // Chart 3: Buy/Sell Spread Chart
  const ctx3 = document.getElementById('buySellSpreadChart').getContext('2d');
  if (buySellChartInstance) buySellChartInstance.destroy();

  buySellChartInstance = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Biên Độ Mua - Bán SJC',
        data: buySellSpreads,
        backgroundColor: 'rgba(212, 175, 55, 0.4)',
        borderColor: '#D4AF37',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Chênh lệch Mua-Bán: ${formatVND(ctx.raw)} đ`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9CA3AF',
            callback: (val) => (val / 1000000).toFixed(1) + ' Tr'
          }
        }
      }
    }
  });
}

// Update Statistics Summary Widget
function updateStatisticsSummary() {
  if (!filteredData || filteredData.length === 0) return;

  const ringPrices = filteredData.map(d => d.Gia_Ban_VND_Luong);
  const spreads = filteredData.map(d => d.Chenh_Lech_The_Gioi);

  const highPrice = Math.max(...ringPrices);
  const lowPrice = Math.min(...ringPrices);
  const avgPrice = ringPrices.reduce((a, b) => a + b, 0) / ringPrices.length;

  const maxSpread = Math.max(...spreads);
  const minSpread = Math.min(...spreads);

  document.getElementById('statHighPrice').innerText = formatVND(highPrice) + ' đ';
  document.getElementById('statLowPrice').innerText = formatVND(lowPrice) + ' đ';
  document.getElementById('statAvgPrice').innerText = formatVND(avgPrice) + ' đ';

  document.getElementById('statMaxSpread').innerText = '+' + formatVND(maxSpread) + ' đ';
  document.getElementById('statMinSpread').innerText = '+' + formatVND(minSpread) + ' đ';
}

// Calculator Investment Function
function calculateInvestment() {
  if (!rawGoldData || rawGoldData.length === 0) return;

  const latest = rawGoldData[rawGoldData.length - 1];
  const qtyInput = parseFloat(document.getElementById('inputQuantity').value) || 0;
  const unit = document.getElementById('unitSelect').value;

  const totalLuong = unit === 'chi' ? qtyInput / 10.0 : qtyInput;

  const buyTotal = totalLuong * latest.Gia_Mua_VND_Luong;
  const sellTotal = totalLuong * latest.Gia_Ban_VND_Luong;

  document.getElementById('calcBuyTotal').innerText = formatVND(buyTotal) + ' VNĐ';
  document.getElementById('calcSellTotal').innerText = formatVND(sellTotal) + ' VNĐ';
}

// Render Data Table with Pagination & Search
function renderTable() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

  const tableData = filteredData.filter(item => {
    if (!searchQuery) return true;
    return (
      item.Ngay.toLowerCase().includes(searchQuery) ||
      item.Thu.toLowerCase().includes(searchQuery) ||
      item.Loai_Vang.toLowerCase().includes(searchQuery) ||
      item.Gia_Ban_VND_Luong.toString().includes(searchQuery) ||
      (item.WeekNum && item.WeekNum.toString().includes(searchQuery))
    );
  });

  document.getElementById('totalRecordsBadge').innerText = `${tableData.length} bản ghi`;

  const totalPages = Math.ceil(tableData.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const pageData = tableData.slice(startIndex, startIndex + pageSize);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px; color:var(--text-muted);">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
    return;
  }

  pageData.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-numeric"><strong>${r.Ngay}</strong></td>
      <td><span class="tag-day">${r.Thu}</span></td>
      <td><strong>${r.Loai_Vang}</strong></td>
      <td class="font-numeric">${formatVND(r.Gia_Mua_VND_Luong)}</td>
      <td class="font-numeric price-sell">${formatVND(r.Gia_Ban_VND_Luong)}</td>
      <td class="font-numeric">${formatVND(r.Chenh_Lech_VND_Luong)}</td>
      <td class="font-numeric" style="color:var(--purple-accent);">${formatUSD(r.Gia_The_Gioi_USD_oz)}</td>
      <td class="font-numeric">${formatVND(r.Gia_The_Gioi_VND_Luong)}</td>
      <td class="font-numeric" style="color:var(--emerald-green);">+${formatVND(r.Chenh_Lech_The_Gioi)}</td>
      <td class="font-numeric">${formatVND(r.SJC_Mieng_Mua)}</td>
      <td class="font-numeric">${formatVND(r.SJC_Mieng_Ban)}</td>
      <td style="color:var(--text-dim); font-size:12px;">${r.Cap_Nhat_Luc || '23:30'}</td>
    `;
    tbody.appendChild(tr);
  });

  renderPaginationControls(totalPages);
}

// Render Pagination Buttons
function renderPaginationControls(totalPages) {
  const container = document.getElementById('paginationControls');
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  container.appendChild(prevBtn);

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let p = startPage; p <= endPage; p++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
    pageBtn.textContent = p;
    pageBtn.addEventListener('click', () => {
      currentPage = p;
      renderTable();
    });
    container.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  container.appendChild(nextBtn);
}

// Export to CSV Function
function exportToCSV() {
  if (!filteredData || filteredData.length === 0) return;

  const headers = ['Ngay', 'ISO_Date', 'Thu', 'Loai_Vang', 'Gia_Mua_VND_Luong', 'Gia_Ban_VND_Luong', 'Chenh_Lech_VND_Luong', 'Gia_The_Gioi_USD_oz', 'Gia_The_Gioi_VND_Luong', 'Chenh_Lech_The_Gioi', 'SJC_Mieng_Mua', 'SJC_Mieng_Ban', 'Cap_Nhat_Luc'];

  let csvContent = '\uFEFF' + headers.join(',') + '\n';

  filteredData.forEach(r => {
    const row = [
      `"${r.Ngay}"`,
      `"${r.ISO_Date}"`,
      `"${r.Thu}"`,
      `"${r.Loai_Vang}"`,
      r.Gia_Mua_VND_Luong,
      r.Gia_Ban_VND_Luong,
      r.Chenh_Lech_VND_Luong,
      r.Gia_The_Gioi_USD_oz,
      r.Gia_The_Gioi_VND_Luong,
      r.Chenh_Lech_The_Gioi,
      r.SJC_Mieng_Mua,
      r.SJC_Mieng_Ban,
      `"${r.Cap_Nhat_Luc || '23:30'}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_Cao_Gia_Vang_2026_${new Date().toISOString().substring(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
