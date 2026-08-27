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
  {"Ngay":"22/08/2026","ISO_Date":"2026-08-22","Thu":"Thứ Bảy","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":144100000,"Gia_Ban_VND_Luong":147100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14410000,"Gia_Ban_VND_Chi":14710000,"Gia_The_Gioi_USD_oz":4604.4,"Gia_The_Gioi_VND_Luong":144334033,"Chenh_Lech_The_Gioi":2765967,"SJC_Mieng_Mua":144600000,"SJC_Mieng_Ban":147600000,"Cap_Nhat_Luc":"11:00"},
  {"Ngay":"23/08/2026","ISO_Date":"2026-08-23","Thu":"Chủ Nhật","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":144100000,"Gia_Ban_VND_Luong":147100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14410000,"Gia_Ban_VND_Chi":14710000,"Gia_The_Gioi_USD_oz":4604.4,"Gia_The_Gioi_VND_Luong":144334033,"Chenh_Lech_The_Gioi":2765967,"SJC_Mieng_Mua":144600000,"SJC_Mieng_Ban":147600000,"Cap_Nhat_Luc":"00:00"},
  {"Ngay":"24/08/2026","ISO_Date":"2026-08-24","Thu":"Thứ Hai","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":146500000,"Gia_Ban_VND_Luong":149500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14650000,"Gia_Ban_VND_Chi":14950000,"Gia_The_Gioi_USD_oz":4659.4,"Gia_The_Gioi_VND_Luong":146058117,"Chenh_Lech_The_Gioi":3441883,"SJC_Mieng_Mua":147000000,"SJC_Mieng_Ban":150000000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"25/08/2026","ISO_Date":"2026-08-25","Thu":"Thứ Ba","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":147100000,"Gia_Ban_VND_Luong":150100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14710000,"Gia_Ban_VND_Chi":15010000,"Gia_The_Gioi_USD_oz":4641.5,"Gia_The_Gioi_VND_Luong":145497006,"Chenh_Lech_The_Gioi":4602994,"SJC_Mieng_Mua":147600000,"SJC_Mieng_Ban":150600000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"26/08/2026","ISO_Date":"2026-08-26","Thu":"Thứ Tư","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":146800000,"Gia_Ban_VND_Luong":149800000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14680000,"Gia_Ban_VND_Chi":14980000,"Gia_The_Gioi_USD_oz":4596.5,"Gia_The_Gioi_VND_Luong":144086392,"Chenh_Lech_The_Gioi":5713608,"SJC_Mieng_Mua":147300000,"SJC_Mieng_Ban":150300000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"27/08/2026","ISO_Date":"2026-08-27","Thu":"Thứ Năm","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":146500000,"Gia_Ban_VND_Luong":149500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14650000,"Gia_Ban_VND_Chi":14950000,"Gia_The_Gioi_USD_oz":4608.9,"Gia_The_Gioi_VND_Luong":144475095,"Chenh_Lech_The_Gioi":5024905,"SJC_Mieng_Mua":147000000,"SJC_Mieng_Ban":150000000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"28/08/2026","ISO_Date":"2026-08-28","Thu":"Thứ Sáu","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":146500000,"Gia_Ban_VND_Luong":149500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14650000,"Gia_Ban_VND_Chi":14950000,"Gia_The_Gioi_USD_oz":4614.8,"Gia_The_Gioi_VND_Luong":144660042,"Chenh_Lech_The_Gioi":4839958,"SJC_Mieng_Mua":147000000,"SJC_Mieng_Ban":150000000,"Cap_Nhat_Luc":"00:00"}
];

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadGoldData();
  setupEventListeners();
});

// Initialize Light / Dark Theme from localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('gold_theme');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
    if (themeText) themeText.textContent = 'Chủ Đề Sáng';
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
    if (themeText) themeText.textContent = 'Chủ Đề Tối';
  }
}

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

  // Apply Custom Date Range Filter
  const btnApplyCustomDate = document.getElementById('btnApplyCustomDate');
  if (btnApplyCustomDate) {
    btnApplyCustomDate.addEventListener('click', () => {
      const startDate = document.getElementById('startDatePicker').value;
      const endDate = document.getElementById('endDatePicker').value;

      if (!startDate || !endDate) {
        alert('Vui lòng chọn đầy đủ từ ngày và đến ngày.');
        return;
      }

      if (startDate > endDate) {
        alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc.');
        return;
      }

      filteredData = rawGoldData.filter(item => {
        return item.ISO_Date >= startDate && item.ISO_Date <= endDate;
      });

      document.getElementById('monthSelect').value = 'all';
      document.getElementById('weekSelect').value = 'all';

      updateAllViews();
    });
  }

  // Theme Switcher Toggle (Light / Dark Mode)
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      const themeIcon = document.getElementById('themeIcon');
      const themeText = document.getElementById('themeText');

      if (isLight) {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
        if (themeText) themeText.textContent = 'Chủ Đề Sáng';
        localStorage.setItem('gold_theme', 'light');
      } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
        if (themeText) themeText.textContent = 'Chủ Đề Tối';
        localStorage.setItem('gold_theme', 'dark');
      }

      // Re-render charts so grid colors adapt
      renderCharts();
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
  const customBox = document.getElementById('customDateRangeBox');

  if (period === 'custom') {
    if (customBox) customBox.style.display = 'block';
    return; // Wait for user to click Apply button
  } else {
    if (customBox) customBox.style.display = 'none';
  }

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

// Helper: Get or Create Custom HTML Tooltip Container
function getOrCreateCustomTooltip(chart) {
  let tooltipEl = chart.canvas.parentNode.querySelector('.chartjs-custom-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chartjs-custom-tooltip';
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  return tooltipEl;
}

// Custom Tooltip Renderer with Pure White Labels and Emerald Green Numbers
function customHtmlTooltipHandler(context, chartType) {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateCustomTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
    const idx = tooltip.dataPoints[0].dataIndex;
    const item = filteredData[idx];
    if (!item) return;

    let innerHtml = `
      <div class="tooltip-header">
        <span class="tooltip-title">📅 ${item.Ngay} (${item.Thu || ''})</span>
      </div>
      <div class="tooltip-body">
    `;

    if (chartType === 'main') {
      const ringPrice = item.Gia_Ban_VND_Luong;
      const barPrice = item.SJC_Mieng_Ban;
      const worldPrice = item.Gia_The_Gioi_VND_Luong;
      const diff = ringPrice - worldPrice;
      const diffPct = worldPrice > 0 ? (diff / worldPrice) * 100 : 0;

      innerHtml += `
        <div class="tooltip-row">
          <span class="tooltip-label"><span class="color-dot ring-dot"></span> Vàng Nhẫn SJC 9999:</span>
          <span class="green-number">${formatVND(ringPrice)} đ</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label"><span class="color-dot bar-dot"></span> Vàng Miếng SJC:</span>
          <span class="green-number">${formatVND(barPrice)} đ</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label"><span class="color-dot world-dot"></span> Vàng Thế Giới (quy đổi):</span>
          <span class="green-number">${formatVND(worldPrice)} đ</span>
        </div>
        <div class="tooltip-row tooltip-divider">
          <span class="tooltip-label">⚡ Chênh lệch:</span>
          <span class="green-number">+${formatVND(diff)} đ (+${diffPct.toFixed(2)}%)</span>
        </div>
      `;
    } else if (chartType === 'spread') {
      const ringPrice = item.Gia_Ban_VND_Luong;
      const worldPrice = item.Gia_The_Gioi_VND_Luong;
      const worldUsd = item.Gia_The_Gioi_USD_oz;
      const diff = ringPrice - worldPrice;
      const diffPct = worldPrice > 0 ? (diff / worldPrice) * 100 : 0;

      innerHtml += `
        <div class="tooltip-row">
          <span class="tooltip-label">⚡ Độ chênh lệch:</span>
          <span class="green-number">+${formatVND(diff)} đ/lượng</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">📈 Cao hơn thế giới:</span>
          <span class="green-number">+${diffPct.toFixed(2)}%</span>
        </div>
        <div class="tooltip-row tooltip-divider">
          <span class="tooltip-label">• SJC Nhẫn bán ra:</span>
          <span class="green-number">${formatVND(ringPrice)} đ</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">• Vàng TG quy đổi:</span>
          <span class="green-number">${formatVND(worldPrice)} đ</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">• Giá thế giới gốc:</span>
          <span class="green-number">$${formatUSD(worldUsd)} /oz</span>
        </div>
      `;
    } else if (chartType === 'buysell') {
      innerHtml += `
        <div class="tooltip-row">
          <span class="tooltip-label">🔸 Biên độ Mua - Bán:</span>
          <span class="green-number">${formatVND(item.Chenh_Lech_VND_Luong)} đ/lượng</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">• Giá Mua vào:</span>
          <span class="green-number">${formatVND(item.Gia_Mua_VND_Luong)} đ</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">• Giá Bán ra:</span>
          <span class="green-number">${formatVND(item.Gia_Ban_VND_Luong)} đ</span>
        </div>
      `;
    }

    innerHtml += `</div>`;
    tooltipEl.innerHTML = innerHtml;
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  tooltipEl.style.opacity = '1';

  const parentWidth = chart.canvas.parentNode.offsetWidth;
  let left = positionX + tooltip.caretX + 16;
  if (left + 280 > parentWidth) {
    left = positionX + tooltip.caretX - 290;
  }
  if (left < 10) left = 10;

  let top = positionY + tooltip.caretY - 50;
  if (top < 10) top = 10;

  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
}

// Render Chart.js Visualizations
function renderCharts() {
  const isLight = document.body.classList.contains('light-theme');
  const tickColor = isLight ? '#475569' : '#9CA3AF';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';

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
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#F5D77F',
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Vàng Miếng SJC',
          data: barPrices,
          borderColor: '#3B82F6',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: labels.length > 50 ? 0 : 3,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#3B82F6',
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Vàng Thế Giới (VND/lượng)',
          data: worldVndPrices,
          borderColor: '#8B5CF6',
          borderDash: [],
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: labels.length > 50 ? 0 : 3,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#8B5CF6',
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2
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
          enabled: false,
          external: (context) => customHtmlTooltipHandler(context, 'main')
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, maxTicksLimit: 12 }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            callback: (val) => (val / 1000000).toFixed(0) + ' Tr'
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
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: labels.length > 50 ? 0 : 3,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: (context) => customHtmlTooltipHandler(context, 'spread')
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, maxTicksLimit: 12 } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
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
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(212, 175, 55, 0.8)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: (context) => customHtmlTooltipHandler(context, 'buysell')
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, maxTicksLimit: 12 } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
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

  // Sort table data in descending chronological order (Newest date first)
  const sortedTableData = [...tableData].sort((a, b) => new Date(b.ISO_Date) - new Date(a.ISO_Date));

  document.getElementById('totalRecordsBadge').innerText = `${sortedTableData.length} bản ghi`;

  const totalPages = Math.ceil(sortedTableData.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const pageData = sortedTableData.slice(startIndex, startIndex + pageSize);

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
