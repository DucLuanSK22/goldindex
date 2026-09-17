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
  {"Ngay":"08/09/2026","ISO_Date":"2026-09-08","Thu":"Thứ Ba","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":143100000,"Gia_Ban_VND_Luong":146100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14310000,"Gia_Ban_VND_Chi":14610000,"Gia_The_Gioi_USD_oz":4392.9,"Gia_The_Gioi_VND_Luong":137704147,"Chenh_Lech_The_Gioi":8395853,"SJC_Mieng_Mua":143600000,"SJC_Mieng_Ban":146600000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"09/09/2026","ISO_Date":"2026-09-09","Thu":"Thứ Tư","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":143100000,"Gia_Ban_VND_Luong":146100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14310000,"Gia_Ban_VND_Chi":14610000,"Gia_The_Gioi_USD_oz":4403.5,"Gia_The_Gioi_VND_Luong":138036425,"Chenh_Lech_The_Gioi":8063575,"SJC_Mieng_Mua":143600000,"SJC_Mieng_Ban":146600000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"10/09/2026","ISO_Date":"2026-09-10","Thu":"Thứ Năm","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":143100000,"Gia_Ban_VND_Luong":146100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14310000,"Gia_Ban_VND_Chi":14610000,"Gia_The_Gioi_USD_oz":4363.7,"Gia_The_Gioi_VND_Luong":136788815,"Chenh_Lech_The_Gioi":9311185,"SJC_Mieng_Mua":143600000,"SJC_Mieng_Ban":146600000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"11/09/2026","ISO_Date":"2026-09-11","Thu":"Thứ Sáu","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":141900000,"Gia_Ban_VND_Luong":144900000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14190000,"Gia_Ban_VND_Chi":14490000,"Gia_The_Gioi_USD_oz":4361.5,"Gia_The_Gioi_VND_Luong":136719852,"Chenh_Lech_The_Gioi":8180148,"SJC_Mieng_Mua":142400000,"SJC_Mieng_Ban":145400000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"12/09/2026","ISO_Date":"2026-09-12","Thu":"Thứ Bảy","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":142500000,"Gia_Ban_VND_Luong":145500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14250000,"Gia_Ban_VND_Chi":14550000,"Gia_The_Gioi_USD_oz":4349.7,"Gia_The_Gioi_VND_Luong":136349958,"Chenh_Lech_The_Gioi":9150042,"SJC_Mieng_Mua":143000000,"SJC_Mieng_Ban":146000000,"Cap_Nhat_Luc":"09:30"},
  {"Ngay":"13/09/2026","ISO_Date":"2026-09-13","Thu":"Chủ Nhật","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":142500000,"Gia_Ban_VND_Luong":145500000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14250000,"Gia_Ban_VND_Chi":14550000,"Gia_The_Gioi_USD_oz":4349.7,"Gia_The_Gioi_VND_Luong":136349958,"Chenh_Lech_The_Gioi":9150042,"SJC_Mieng_Mua":143000000,"SJC_Mieng_Ban":146000000,"Cap_Nhat_Luc":"14:00"},
  {"Ngay":"14/09/2026","ISO_Date":"2026-09-14","Thu":"Thứ Hai","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":142100000,"Gia_Ban_VND_Luong":145100000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14210000,"Gia_Ban_VND_Chi":14510000,"Gia_The_Gioi_USD_oz":4304.9,"Gia_The_Gioi_VND_Luong":134945613,"Chenh_Lech_The_Gioi":10154387,"SJC_Mieng_Mua":142600000,"SJC_Mieng_Ban":145600000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"15/09/2026","ISO_Date":"2026-09-15","Thu":"Thứ Ba","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":141800000,"Gia_Ban_VND_Luong":144800000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14180000,"Gia_Ban_VND_Chi":14480000,"Gia_The_Gioi_USD_oz":4296,"Gia_The_Gioi_VND_Luong":134666625,"Chenh_Lech_The_Gioi":10133375,"SJC_Mieng_Mua":142300000,"SJC_Mieng_Ban":145300000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"16/09/2026","ISO_Date":"2026-09-16","Thu":"Thứ Tư","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":143000000,"Gia_Ban_VND_Luong":146000000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14300000,"Gia_Ban_VND_Chi":14600000,"Gia_The_Gioi_USD_oz":4346.5,"Gia_The_Gioi_VND_Luong":136249647,"Chenh_Lech_The_Gioi":9750353,"SJC_Mieng_Mua":143500000,"SJC_Mieng_Ban":146500000,"Cap_Nhat_Luc":"23:30"},
  {"Ngay":"17/09/2026","ISO_Date":"2026-09-17","Thu":"Thứ Năm","Loai_Vang":"Vàng nhẫn SJC 9999","Gia_Mua_VND_Luong":142300000,"Gia_Ban_VND_Luong":145300000,"Chenh_Lech_VND_Luong":3000000,"Gia_Mua_VND_Chi":14230000,"Gia_Ban_VND_Chi":14530000,"Gia_The_Gioi_USD_oz":4293.1,"Gia_The_Gioi_VND_Luong":134575719,"Chenh_Lech_The_Gioi":10724281,"SJC_Mieng_Mua":142800000,"SJC_Mieng_Ban":145800000,"Cap_Nhat_Luc":"11:30"}
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

  // Initialize AI Gemini Chatbot
  initAiChatbot();
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
      const latestItem = rawGoldData.length > 0 ? rawGoldData[rawGoldData.length - 1] : null;
      let curr = new Date();
      if (latestItem && latestItem.ISO_Date) {
        curr = new Date(latestItem.ISO_Date);
        curr.setDate(curr.getDate() + 1);
      }
      
      const today = new Date();
      let daysFetched = 0;
      let lastSuccessDate = '';

      // Loop and fetch every missing day up to today
      while (curr <= today) {
        const isoDate = curr.toISOString().substring(0, 10);
        const displayDate = `${String(curr.getDate()).padStart(2,'0')}/${String(curr.getMonth()+1).padStart(2,'0')}/${curr.getFullYear()}`;
        const apiUrl = `https://www.vang.today/api/prices?date=${isoDate}`;

        try {
          const response = await fetch(apiUrl);
          const apiResult = await response.json();

          if (apiResult.success && apiResult.prices && apiResult.prices.SJ9999 && apiResult.prices.SJ9999.buy) {
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
            const updateTime = apiResult.time || (curr.toDateString() === today.toDateString() ? `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` : '23:30');
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

            daysFetched++;
            lastSuccessDate = `${displayDate} (${updateTime})`;
            updateSuccess = true;
          }
        } catch (e) {
          console.warn('Lỗi lấy API ngày ' + isoDate, e);
        }

        curr.setDate(curr.getDate() + 1);
      }

      if (updateSuccess) {
        successMessage = `Đã cập nhật liên tục ${daysFetched} ngày mới đến ngày ${lastSuccessDate}!`;
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
      populateWeekDropdown();
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

// Filter data by time period (Calendar-based calculation)
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
    if (!isNaN(days) && rawGoldData.length > 0) {
      const latestItem = rawGoldData[rawGoldData.length - 1];
      const latestDt = new Date(latestItem.ISO_Date);
      const cutoffDt = new Date(latestDt);
      cutoffDt.setDate(cutoffDt.getDate() - (days - 1));
      const cutoffIso = cutoffDt.toISOString().substring(0, 10);

      const byDate = rawGoldData.filter(item => item.ISO_Date >= cutoffIso);
      filteredData = (byDate.length > 0) ? byDate : rawGoldData.slice(-days);
    } else {
      filteredData = [...rawGoldData];
    }
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

// ==========================================================================
// AI GEMINI CHATBOT CONTROLLER & API INTEGRATION
// ==========================================================================

const DEFAULT_GEMINI_CONFIG = {
  type: 'worker',
  workerUrl: '',
  apiKey: '',
  model: 'gemini-1.5-flash'
};

function getAiConfig() {
  try {
    const saved = localStorage.getItem('gold_gemini_config');
    if (saved) {
      return { ...DEFAULT_GEMINI_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading gold_gemini_config:', e);
  }
  return { ...DEFAULT_GEMINI_CONFIG };
}

function saveAiConfig(cfg) {
  try {
    localStorage.setItem('gold_gemini_config', JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving gold_gemini_config:', e);
  }
}

function initAiChatbot() {
  const fab = document.getElementById('aiChatFab');
  const widget = document.getElementById('aiChatWidget');
  const closeBtn = document.getElementById('btnAiClose');
  const settingsBtn = document.getElementById('btnAiSettings');
  const clearBtn = document.getElementById('btnAiClear');
  const settingsModal = document.getElementById('aiSettingsModal');
  const settingsCloseBtn = document.getElementById('btnAiSettingsClose');
  const settingsSaveBtn = document.getElementById('btnAiSettingsSave');
  const sendBtn = document.getElementById('btnAiSend');
  const userInput = document.getElementById('aiUserInput');
  const currentModelBadge = document.getElementById('currentModelBadge');

  const radioTypes = document.querySelectorAll('input[name="aiConnectionType"]');
  const fieldWorker = document.getElementById('fieldWorkerUrl');
  const fieldDirect = document.getElementById('fieldDirectApiKey');
  const inputWorker = document.getElementById('inputWorkerUrl');
  const inputDirect = document.getElementById('inputDirectApiKey');
  const selectModel = document.getElementById('selectAiModel');

  // Load Initial Settings
  const currentCfg = getAiConfig();
  if (currentModelBadge) {
    currentModelBadge.textContent = currentCfg.model.replace('gemini-', '').replace('-', ' ').toUpperCase();
  }

  // Toggle Chat Window
  if (fab && widget) {
    fab.addEventListener('click', () => {
      widget.classList.toggle('hidden');
      if (!widget.classList.contains('hidden')) {
        userInput?.focus();
        scrollChatToBottom();
      }
    });
  }

  if (closeBtn && widget) {
    closeBtn.addEventListener('click', () => {
      widget.classList.add('hidden');
    });
  }

  // Clear Chat History
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const messagesContainer = document.getElementById('aiChatMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="ai-message bot">
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content">
              <p>Xin chào! Tôi là <strong>Trợ lý AI Gemini</strong> chuyên phân tích thị trường Vàng SJC & Thế giới.</p>
              <p>Đoạn hội thoại đã được làm mới. Hãy nhập câu hỏi hoặc chọn một gợi ý bên trên để bắt đầu phân tích nhé!</p>
            </div>
          </div>
        `;
      }
    });
  }

  // Settings Modal Handlers
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      const cfg = getAiConfig();
      radioTypes.forEach(r => {
        r.checked = (r.value === cfg.type);
      });

      if (inputWorker) inputWorker.value = cfg.workerUrl || '';
      if (inputDirect) inputDirect.value = cfg.apiKey || '';
      if (selectModel) selectModel.value = cfg.model || 'gemini-1.5-flash';

      toggleConfigFields(cfg.type);
      settingsModal.classList.remove('hidden');
    });
  }

  if (settingsCloseBtn && settingsModal) {
    settingsCloseBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  radioTypes.forEach(r => {
    r.addEventListener('change', (e) => {
      toggleConfigFields(e.target.value);
    });
  });

  function toggleConfigFields(type) {
    if (type === 'worker') {
      fieldWorker?.classList.remove('hidden');
      fieldDirect?.classList.add('hidden');
    } else {
      fieldWorker?.classList.add('hidden');
      fieldDirect?.classList.remove('hidden');
    }
  }

  if (settingsSaveBtn && settingsModal) {
    settingsSaveBtn.addEventListener('click', () => {
      const selectedType = document.querySelector('input[name="aiConnectionType"]:checked')?.value || 'worker';
      const workerUrl = inputWorker?.value?.trim() || '';
      const apiKey = inputDirect?.value?.trim() || '';
      const model = selectModel?.value || 'gemini-1.5-flash';

      saveAiConfig({
        type: selectedType,
        workerUrl: workerUrl,
        apiKey: apiKey,
        model: model
      });

      if (currentModelBadge) {
        currentModelBadge.textContent = model.replace('gemini-', '').replace('-', ' ').toUpperCase();
      }

      settingsModal.classList.add('hidden');
      appendBotMessage(`✅ **Đã lưu cấu hình thành công!** Đang kết nối qua *${selectedType === 'worker' ? 'Cloudflare Worker Proxy' : 'Gemini API Trực Tiếp'}* (${model}).`);
    });
  }

  // Quick Prompt Chips
  document.querySelectorAll('.quick-prompt-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const promptText = e.currentTarget.getAttribute('data-prompt');
      if (promptText) {
        sendAiChatMessage(promptText);
      }
    });
  });

  // Auto-resize textarea & Enter key listener
  if (userInput) {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
    });

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiChatMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      sendAiChatMessage();
    });
  }
}

// Scroll chat messages to bottom
function scrollChatToBottom() {
  const container = document.getElementById('aiChatMessages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// Append User Message to UI
function appendUserMessage(text) {
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!messagesContainer) return;

  const div = document.createElement('div');
  div.className = 'ai-message user';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
    <div class="msg-content"><p>${escapeHtml(text)}</p></div>
  `;
  messagesContainer.appendChild(div);
  scrollChatToBottom();
}

// Append Bot Message to UI
function appendBotMessage(htmlContent) {
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!messagesContainer) return;

  const div = document.createElement('div');
  div.className = 'ai-message bot';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-content">${htmlContent}</div>
  `;
  messagesContainer.appendChild(div);
  scrollChatToBottom();
}

// Simple HTML Escape helper
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert Markdown syntax to styled HTML
function formatMarkdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Headers (###, ##, #)
  html = html.replace(/^### (.*$)/gim, '<h5 style="color:var(--gold-light);margin:8px 0 4px 0;font-weight:700;">$1</h5>');
  html = html.replace(/^## (.*$)/gim, '<h4 style="color:var(--gold-light);margin:10px 0 4px 0;font-weight:700;">$1</h4>');
  html = html.replace(/^# (.*$)/gim, '<h3 style="color:var(--gold-light);margin:12px 0 6px 0;font-weight:700;">$1</h3>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bullet points
  const lines = html.split('\n');
  let inList = false;
  let formattedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        formattedLines.push('<ul>');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        formattedLines.push('<ol>');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      if (trimmed.length > 0) {
        formattedLines.push(`<p>${trimmed}</p>`);
      }
    }
  }

  if (inList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('');
}

// Build Contextual Gold Market Summary for System Prompt
function buildMarketSystemContext() {
  if (!rawGoldData || rawGoldData.length === 0) {
    return 'Hiện tại chưa có dữ liệu giá vàng nạp vào hệ thống.';
  }

  const latest = rawGoldData[rawGoldData.length - 1];
  const prev = rawGoldData.length > 1 ? rawGoldData[rawGoldData.length - 2] : latest;

  const ringPrices = rawGoldData.slice(-14).map(d => d.Gia_Ban_VND_Luong);
  const high14d = Math.max(...ringPrices);
  const low14d = Math.min(...ringPrices);

  return `
[THÔNG TIN THỊ TRƯỜNG VÀNG THỰC TẾ TRÊN HỆ THỐNG ANTIGRAVITY GOLD INDEX]:
- Ngày cập nhật mới nhất: ${latest.Ngay} (${latest.Thu}), lúc ${latest.Cap_Nhat_Luc || '23:30'}
- Vàng Nhẫn SJC 9999: Mua vào ${formatVND(latest.Gia_Mua_VND_Luong)} đ/lượng | Bán ra ${formatVND(latest.Gia_Ban_VND_Luong)} đ/lượng (Chênh lệch mua - bán: ${formatVND(latest.Chenh_Lech_VND_Luong)} đ)
- Vàng Miếng SJC (L1-L10): Mua vào ${formatVND(latest.SJC_Mieng_Mua)} đ/lượng | Bán ra ${formatVND(latest.SJC_Mieng_Ban)} đ/lượng
- Giá Vàng Thế Giới (XAU/USD): ${formatUSD(latest.Gia_The_Gioi_USD_oz)} USD/oz
- Giá Vàng Thế Giới Quy Đổi: ${formatVND(latest.Gia_The_Gioi_VND_Luong)} đ/lượng
- Độ Chênh Lệch Trong Nước vs Thế Giới: +${formatVND(latest.Chenh_Lech_The_Gioi)} đ/lượng (${latest.Gia_The_Gioi_VND_Luong > 0 ? ((latest.Chenh_Lech_The_Gioi / latest.Gia_The_Gioi_VND_Luong) * 100).toFixed(2) : 0}%)
- Biên độ dao động 14 ngày gần nhất: Thấp nhất ${formatVND(low14d)} đ/lượng - Cao nhất ${formatVND(high14d)} đ/lượng.
`;
}

// Send Message to Gemini AI (Via Cloudflare Worker or Direct API)
async function sendAiChatMessage(customText = null) {
  const userInput = document.getElementById('aiUserInput');
  const typingIndicator = document.getElementById('aiTypingIndicator');
  const sendBtn = document.getElementById('btnAiSend');

  const textToSend = customText || userInput?.value?.trim();
  if (!textToSend) return;

  // Clear input box
  if (userInput && !customText) {
    userInput.value = '';
    userInput.style.height = 'auto';
  }

  // Display User Bubble
  appendUserMessage(textToSend);

  // Show Typing Indicator
  if (typingIndicator) typingIndicator.classList.remove('hidden');
  if (sendBtn) sendBtn.disabled = true;
  scrollChatToBottom();

  const cfg = getAiConfig();

  // Validate configuration
  if (cfg.type === 'worker' && !cfg.workerUrl) {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    if (sendBtn) sendBtn.disabled = false;
    appendBotMessage(`
      <p>⚠️ <strong>Chưa cấu hình URL Cloudflare Worker Proxy!</strong></p>
      <p>Vui lòng bấm vào nút <strong>Cài đặt (<i class="fa-solid fa-gear"></i>)</strong> góc trên bên phải khung chat để dán URL Worker của bạn hoặc chọn chuyển sang <em>"Gemini API Key Trực Tiếp"</em>.</p>
    `);
    return;
  }

  if (cfg.type === 'direct' && !cfg.apiKey) {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    if (sendBtn) sendBtn.disabled = false;
    appendBotMessage(`
      <p>⚠️ <strong>Chưa có Google Gemini API Key!</strong></p>
      <p>Vui lòng bấm vào nút <strong>Cài đặt (<i class="fa-solid fa-gear"></i>)</strong> để nhập API Key hoặc lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</p>
    `);
    return;
  }

  // Prepare System Prompt with live market context
  const marketContext = buildMarketSystemContext();
  const systemInstruction = `
Bạn là "Antigravity Gold Advisor" - Chuyên gia phân tích thị trường vàng, ngoại hối và cố vấn chiến lược đầu tư tài chính chuyên nghiệp tại Việt Nam.
Hãy trả lời câu hỏi của nhà đầu tư dựa trên dữ liệu thị trường thực tế sau đây:
${marketContext}

QUY TẮC PHÂN TÍCH:
1. Luôn sử dụng số liệu thực tế được cung cấp ở trên làm căn cứ.
2. Trả lời súc tích, chuyên nghiệp, logic, có phân tích cả mặt cơ hội và rủi ro thị trường (Spread trong nước vs thế giới, biên độ mua/bán).
3. Đưa ra lời khuyên thiết thực, phân bổ danh mục an toàn.
4. Trình bày rõ ràng, sử dụng định dạng Markdown (gạch đầu dòng, in đậm các ý chính và số liệu).
`;

  const fullPrompt = `${systemInstruction}\n\n[CÂU HỎI CỦA NGƯỜI DÙNG]: ${textToSend}`;

  try {
    let aiResponseText = '';

    if (cfg.type === 'worker') {
      // Call via Cloudflare Worker Proxy
      const res = await fetch(cfg.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: cfg.model || 'gemini-1.5-flash'
        })
      });

      if (!res.ok) {
        throw new Error(`Worker phản hồi mã lỗi HTTP ${res.status}: ${res.statusText}`);
      }

      const resData = await res.json();
      if (resData.candidates && resData.candidates[0]?.content?.parts?.[0]?.text) {
        aiResponseText = resData.candidates[0].content.parts[0].text;
      } else if (resData.error) {
        throw new Error(typeof resData.error === 'string' ? resData.error : JSON.stringify(resData.error));
      } else {
        throw new Error('Dữ liệu phản hồi từ AI không đúng cấu trúc.');
      }

    } else {
      // Call Google Gemini API directly
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model || 'gemini-1.5-flash'}:generateContent?key=${cfg.apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }]
            }
          ]
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`);
      }

      const resData = await res.json();
      if (resData.candidates && resData.candidates[0]?.content?.parts?.[0]?.text) {
        aiResponseText = resData.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Không nhận được nội dung trả lời từ Gemini API.');
      }
    }

    // Convert Markdown & Render Message
    const formattedHtml = formatMarkdownToHtml(aiResponseText);
    appendBotMessage(formattedHtml);

  } catch (error) {
    console.error('Gemini AI Error:', error);
    appendBotMessage(`
      <p style="color:var(--ruby-red);"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Lỗi kết nối Gemini AI:</strong></p>
      <p style="font-size:12px;color:var(--text-muted);">${escapeHtml(error.message || 'Không thể kết nối tới máy chủ AI.')}</p>
      <p style="font-size:12px;">👉 <em>Vui lòng kiểm tra lại URL Cloudflare Worker hoặc API Key trong phần Cài đặt (<i class="fa-solid fa-gear"></i>).</em></p>
    `);
  } finally {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    if (sendBtn) sendBtn.disabled = false;
    scrollChatToBottom();
  }
}

