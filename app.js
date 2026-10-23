/* ============================================================
   SkyView Weather Dashboard — app.js  (v2 — extended)
   Features: city search, geolocation, current weather,
             hourly 24h, 7-day forecast, UV index,
             Air Quality (AQI), dark/light theme toggle,
             weekly temperature canvas chart.
   API: Open-Meteo (no API key required)
   ============================================================ */

'use strict';

// ── DOM refs ──────────────────────────────────────────────
const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const locateBtn    = document.getElementById('locateBtn');
const themeToggle  = document.getElementById('themeToggle');
const themeIcon    = document.getElementById('themeIcon');
const suggestions  = document.getElementById('suggestions');
const loadingState = document.getElementById('loadingState');
const errorState   = document.getElementById('errorState');
const errorMsg     = document.getElementById('errorMsg');
const welcomeState = document.getElementById('welcomeState');
const dashboard    = document.getElementById('dashboard');

// current card
const cityName     = document.getElementById('cityName');
const countryName  = document.getElementById('countryName');
const currentDate  = document.getElementById('currentDate');
const currentIcon  = document.getElementById('currentIcon');
const currentTemp  = document.getElementById('currentTemp');
const currentDesc  = document.getElementById('currentDesc');
const feelsLike    = document.getElementById('feelsLike');
const humidityEl   = document.getElementById('humidity');
const windSpeedEl  = document.getElementById('windSpeed');
const precipEl     = document.getElementById('precipitation');
const elevationEl  = document.getElementById('elevation');

// UV
const uvBadge   = document.getElementById('uvBadge');
const uvFill    = document.getElementById('uvFill');
const uvPointer = document.getElementById('uvPointer');
const uvTip     = document.getElementById('uvTip');

// AQI
const aqiBadge = document.getElementById('aqiBadge');
const pm25El   = document.getElementById('pm25');
const pm10El   = document.getElementById('pm10');
const coEl     = document.getElementById('co');
const no2El    = document.getElementById('no2');
const aqiTip   = document.getElementById('aqiTip');

// hourly + forecast
const hourlyTrack = document.getElementById('hourlyTrack');
const forecastGrid = document.getElementById('forecastGrid');

// ── WMO weather-code map ──────────────────────────────────
const WMO = {
  0:  { label: 'Clear sky',           icon: '☀️'  },
  1:  { label: 'Mainly clear',        icon: '🌤️' },
  2:  { label: 'Partly cloudy',       icon: '⛅'  },
  3:  { label: 'Overcast',            icon: '☁️'  },
  45: { label: 'Foggy',               icon: '🌫️' },
  48: { label: 'Icy fog',             icon: '🌫️' },
  51: { label: 'Light drizzle',       icon: '🌦️' },
  53: { label: 'Moderate drizzle',    icon: '🌦️' },
  55: { label: 'Dense drizzle',       icon: '🌧️' },
  61: { label: 'Light rain',          icon: '🌧️' },
  63: { label: 'Moderate rain',       icon: '🌧️' },
  65: { label: 'Heavy rain',          icon: '🌧️' },
  71: { label: 'Light snow',          icon: '🌨️' },
  73: { label: 'Moderate snow',       icon: '❄️'  },
  75: { label: 'Heavy snow',          icon: '❄️'  },
  77: { label: 'Snow grains',         icon: '🌨️' },
  80: { label: 'Light showers',       icon: '🌦️' },
  81: { label: 'Moderate showers',    icon: '🌧️' },
  82: { label: 'Violent showers',     icon: '⛈️'  },
  85: { label: 'Snow showers',        icon: '🌨️' },
  86: { label: 'Heavy snow showers',  icon: '❄️'  },
  95: { label: 'Thunderstorm',        icon: '⛈️'  },
  96: { label: 'Thunderstorm + hail', icon: '⛈️'  },
  99: { label: 'Thunderstorm + hail', icon: '⛈️'  },
};
function wmo(code) { return WMO[code] ?? { label: 'Unknown', icon: '🌡️' }; }

// ── Theme Toggle ─────────────────────────────────────────
let isDark = true;
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  // Redraw chart with new colours
  if (window._chartData) drawChart(window._chartData);
});

// ── Utilities ─────────────────────────────────────────────
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function dayName(iso, index) {
  if (index === 0) return 'Today';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}
function hourLabel(isoTime) {
  const d = new Date(isoTime);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}${ampm}`;
}
function setMode(mode) {
  hide(loadingState); hide(errorState); hide(welcomeState); hide(dashboard);
  if (mode === 'loading')   show(loadingState);
  else if (mode === 'error')   show(errorState);
  else if (mode === 'welcome') show(welcomeState);
  else if (mode === 'dashboard') show(dashboard);
}
function showError(msg) { errorMsg.textContent = msg; setMode('error'); }

// ── UV helpers ────────────────────────────────────────────
function uvInfo(uv) {
  if (uv <= 2)  return { label: 'Low',     tip: 'No protection needed. Enjoy the sun!', pct: uv / 11 };
  if (uv <= 5)  return { label: 'Moderate',tip: 'Wear sunscreen SPF 30+ and a hat.',    pct: uv / 11 };
  if (uv <= 7)  return { label: 'High',    tip: 'Apply SPF 50+, seek shade midday.',    pct: uv / 11 };
  if (uv <= 10) return { label: 'Very High',tip: 'Extra protection essential.',         pct: uv / 11 };
  return               { label: 'Extreme', tip: 'Avoid being outside. Full cover.',     pct: 1 };
}

// ── AQI helpers (European AQI from Open-Meteo) ───────────
function aqiInfo(pm25) {
  // Based on WHO PM2.5 thresholds
  if (pm25 <= 10)  return { label: 'Good',       color: '#4ade80', bg: 'rgba(74,222,128,0.15)', tip: 'Air quality is excellent. 😊' };
  if (pm25 <= 25)  return { label: 'Fair',        color: '#a3e635', bg: 'rgba(163,230,53,0.15)', tip: 'Acceptable air quality for most people.' };
  if (pm25 <= 50)  return { label: 'Moderate',    color: '#facc15', bg: 'rgba(250,204,21,0.15)', tip: 'Sensitive groups may be affected.' };
  if (pm25 <= 75)  return { label: 'Poor',        color: '#f97316', bg: 'rgba(249,115,22,0.15)', tip: 'Unhealthy for sensitive groups. Reduce outdoor activity.' };
  if (pm25 <= 800) return { label: 'Very Poor',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  tip: 'Unhealthy. Limit outdoor exposure.' };
  return                  { label: 'Hazardous',   color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', tip: 'Health emergency. Stay indoors!' };
}

// ── Geocoding / Search ────────────────────────────────────
let suggestTimeout = null;

searchInput.addEventListener('input', () => {
  clearTimeout(suggestTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { hide(suggestions); suggestions.innerHTML = ''; return; }
  suggestTimeout = setTimeout(() => fetchSuggestions(q), 300);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { hide(suggestions); doSearch(searchInput.value.trim()); }
});
searchBtn.addEventListener('click', () => { hide(suggestions); doSearch(searchInput.value.trim()); });
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) hide(suggestions);
});

async function fetchSuggestions(q) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const data = await (await fetch(url)).json();
    renderSuggestions(data.results || []);
  } catch { hide(suggestions); }
}

function renderSuggestions(results) {
  if (!results.length) { hide(suggestions); return; }
  suggestions.innerHTML = results.map(r => `
    <li data-lat="${r.latitude}" data-lon="${r.longitude}"
        data-name="${r.name}" data-country="${r.country ?? ''}" data-elevation="${r.elevation ?? 0}">
      ${r.name}<span class="sug-country">${r.country ?? ''} ${r.admin1 ? '· ' + r.admin1 : ''}</span>
    </li>`).join('');
  show(suggestions);
  suggestions.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const { lat, lon, name, country, elevation } = li.dataset;
      searchInput.value = name;
      hide(suggestions);
      fetchWeather(+lat, +lon, name, country, +elevation);
    });
  });
}

async function doSearch(q) {
  if (!q) return;
  setMode('loading');
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('Geocoding error');
    const data = await res.json();
    if (!data.results?.length) { showError('City not found. Try a different name.'); return; }
    const r = data.results[0];
    fetchWeather(r.latitude, r.longitude, r.name, r.country ?? '', r.elevation ?? 0);
  } catch (err) {
    console.error('Search error:', err);
    showError('Could not connect. Check your internet connection.');
  }
}

// ── Geolocation ───────────────────────────────────────────
locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showError('Geolocation is not supported by your browser.'); return; }
  setMode('loading');
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location', '', 0),
    ()  => showError('Location access denied. Please search manually.')
  );
});

// ── Fetch all data (weather + air quality) in parallel ────
async function fetchWeather(lat, lon, name, country, elev) {
  setMode('loading');
  try {
    // Weather forecast params
    const wParams = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: [
        'temperature_2m','apparent_temperature','relative_humidity_2m',
        'wind_speed_10m','precipitation','weather_code','uv_index',
      ].join(','),
      hourly: [
        'temperature_2m','weather_code','precipitation_probability',
      ].join(','),
      daily: [
        'weather_code','temperature_2m_max','temperature_2m_min',
        'precipitation_sum','wind_speed_10m_max',
      ].join(','),
      timezone: 'auto',
      forecast_days: 7,
    });

    // Air quality params
    const aParams = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: ['pm2_5','pm10','carbon_monoxide','nitrogen_dioxide'].join(','),
      timezone: 'auto',
    });

    // Use allSettled so air quality failure never breaks weather data
    const [wResult, aResult] = await Promise.allSettled([
      fetch(`https://api.open-meteo.com/v1/forecast?${wParams}`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aParams}`),
    ]);

    // Weather is required — bail if it failed
    if (wResult.status === 'rejected') throw new Error('Weather fetch failed');
    const wRes = wResult.value;
    if (!wRes.ok) throw new Error(`Weather API error: ${wRes.status}`);
    const wData = await wRes.json();

    // Air quality is optional — silently degrade if unavailable
    let aData = null;
    try {
      if (aResult.status === 'fulfilled' && aResult.value.ok) {
        aData = await aResult.value.json();
      }
    } catch { /* air quality unavailable — no problem */ }

    renderDashboard(wData, aData, name, country, elev || wData.elevation || 0);
  } catch (err) {
    console.error('Weather fetch error:', err);
    showError('Failed to fetch weather data. Please try again.');
  }
}

// ── Render ────────────────────────────────────────────────
function renderDashboard(wData, aData, name, country, elev) {
  const cur = wData.current;
  const day = wData.daily;
  const hr  = wData.hourly;
  const info = wmo(cur.weather_code);

  // ── Current card ────────────────────────────────────────
  cityName.textContent    = name;
  countryName.textContent = country;
  currentDate.textContent = formatDate(cur.time.split('T')[0]);
  currentIcon.textContent = info.icon;
  currentTemp.textContent = `${Math.round(cur.temperature_2m)}°C`;
  currentDesc.textContent = info.label;
  feelsLike.textContent   = `${Math.round(cur.apparent_temperature)}°C`;
  humidityEl.textContent  = `${cur.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  precipEl.textContent    = `${cur.precipitation} mm`;
  elevationEl.textContent = `${Math.round(elev)} m`;

  // ── UV Index ─────────────────────────────────────────────
  const uv = cur.uv_index ?? 0;
  const ui = uvInfo(uv);
  uvBadge.textContent = `UV ${Math.round(uv)} — ${ui.label}`;
  uvTip.textContent   = ui.tip;
  // position pointer (clamp 2% – 98%)
  const pct = Math.min(Math.max(ui.pct * 100, 2), 98);
  uvPointer.style.left = `${pct}%`;

  // ── Air Quality ───────────────────────────────────────────
  if (aData?.current) {
    const ac  = aData.current;
    const pm25Val = ac.pm2_5 ?? 0;
    const ai  = aqiInfo(pm25Val);
    pm25El.textContent = `${pm25Val.toFixed(1)} µg/m³`;
    pm10El.textContent = `${(ac.pm10 ?? 0).toFixed(1)} µg/m³`;
    coEl.textContent   = `${(ac.carbon_monoxide ?? 0).toFixed(0)} µg/m³`;
    no2El.textContent  = `${(ac.nitrogen_dioxide ?? 0).toFixed(1)} µg/m³`;
    aqiBadge.textContent     = ai.label;
    aqiBadge.style.color     = ai.color;
    aqiBadge.style.background = ai.bg;
    aqiBadge.style.border    = `1px solid ${ai.color}55`;
    aqiTip.textContent = ai.tip;
  } else {
    pm25El.textContent = pm10El.textContent = coEl.textContent = no2El.textContent = 'N/A';
    aqiBadge.textContent = 'N/A';
    aqiTip.textContent   = 'Air quality data unavailable for this location.';
  }

  // ── Hourly forecast (next 24 slots from current hour) ───
  const nowIso = cur.time; // e.g. "2026-10-23T14:00"
  const nowIdx = hr.time.findIndex(t => t >= nowIso.slice(0, 13));
  const startIdx = nowIdx >= 0 ? nowIdx : 0;
  const hourSlots = hr.time.slice(startIdx, startIdx + 24);

  hourlyTrack.innerHTML = hourSlots.map((t, i) => {
    const absIdx = startIdx + i;
    const temp   = Math.round(hr.temperature_2m[absIdx]);
    const code   = hr.weather_code[absIdx];
    const prob   = hr.precipitation_probability[absIdx];
    const hInfo  = wmo(code);
    const isNow  = i === 0;
    return `
      <div class="hourly-card ${isNow ? 'now' : ''}">
        <span class="hc-time">${isNow ? 'Now' : hourLabel(t)}</span>
        <span class="hc-icon">${hInfo.icon}</span>
        <span class="hc-temp">${temp}°</span>
        ${prob > 10 ? `<span class="hc-rain">💧${prob}%</span>` : ''}
      </div>`;
  }).join('');

  // ── 7-Day forecast ───────────────────────────────────────
  forecastGrid.innerHTML = day.time.map((iso, i) => {
    const fc   = wmo(day.weather_code[i]);
    const max  = Math.round(day.temperature_2m_max[i]);
    const min  = Math.round(day.temperature_2m_min[i]);
    const rain = day.precipitation_sum[i];
    return `
      <div class="forecast-card ${i === 0 ? 'today' : ''}">
        <span class="fc-day">${dayName(iso, i)}</span>
        <span class="fc-icon">${fc.icon}</span>
        <span class="fc-max">${max}°</span>
        <span class="fc-min">${min}°</span>
        ${rain > 0 ? `<span class="fc-rain">💧${rain}mm</span>` : ''}
      </div>`;
  }).join('');

  // ── Chart ────────────────────────────────────────────────
  window._chartData = day;
  drawChart(day);

  // ── Map ──────────────────────────────────────────────────
  updateMap(
    wData.latitude, wData.longitude,
    name,
    `${Math.round(cur.temperature_2m)}°C`,
    info.label,
    info.icon,
    `${Math.round(cur.wind_speed_10m)} km/h`,
    `${cur.relative_humidity_2m}%`
  );

  setMode('dashboard');
}

// ── Canvas Temperature Chart ──────────────────────────────
function drawChart(daily) {
  const canvas  = document.getElementById('tempChart');
  const wrapper = canvas.parentElement;
  const W = wrapper.clientWidth;
  const H = 200;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const maxTemps = daily.temperature_2m_max;
  const minTemps = daily.temperature_2m_min;
  const labels   = daily.time.map((iso, i) => dayName(iso, i));
  const n        = labels.length;

  const allVals = [...maxTemps, ...minTemps];
  const dataMin = Math.min(...allVals) - 2;
  const dataMax = Math.max(...allVals) + 2;
  const range   = dataMax - dataMin || 1;

  const padL = 40, padR = 24, padT = 24, padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const light   = document.documentElement.getAttribute('data-theme') === 'light';
  const textCol = light ? '#4a5568' : '#8b949e';
  const gridCol = light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';
  const bgCol   = light ? '#f0f4f8'           : '#0d1117';
  const accent  = light ? '#2563eb'           : '#58a6ff';
  const accent2 = light ? '#7c3aed'           : '#bc8cff';

  function xOf(i) { return padL + (i / (n - 1)) * plotW; }
  function yOf(v) { return padT + plotH - ((v - dataMin) / range) * plotH; }

  // Grid
  ctx.strokeStyle = gridCol; ctx.lineWidth = 1;
  for (let t = 0; t <= 4; t++) {
    const y = padT + (t / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  }

  // Max area
  const gradMax = ctx.createLinearGradient(0, padT, 0, H - padB);
  gradMax.addColorStop(0, `${accent}55`);
  gradMax.addColorStop(1, `${accent}08`);
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(maxTemps[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(maxTemps[i]));
  ctx.lineTo(xOf(n-1), H - padB); ctx.lineTo(xOf(0), H - padB);
  ctx.closePath(); ctx.fillStyle = gradMax; ctx.fill();

  // Min area
  const gradMin = ctx.createLinearGradient(0, padT, 0, H - padB);
  gradMin.addColorStop(0, `${accent2}44`);
  gradMin.addColorStop(1, `${accent2}08`);
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(minTemps[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(minTemps[i]));
  ctx.lineTo(xOf(n-1), H - padB); ctx.lineTo(xOf(0), H - padB);
  ctx.closePath(); ctx.fillStyle = gradMin; ctx.fill();

  // Max line
  ctx.beginPath(); ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.moveTo(xOf(0), yOf(maxTemps[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(maxTemps[i]));
  ctx.stroke();

  // Min line
  ctx.beginPath(); ctx.strokeStyle = accent2; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.moveTo(xOf(0), yOf(minTemps[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(minTemps[i]));
  ctx.stroke();

  // Dots + labels (max)
  maxTemps.forEach((v, i) => {
    const x = xOf(i), y = yOf(v);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();
    ctx.strokeStyle = bgCol; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = light ? '#1a202c' : '#e6edf3';
    ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(v)}°`, x, y - 10);
  });

  // Dots (min)
  minTemps.forEach((v, i) => {
    const x = xOf(i), y = yOf(v);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent2; ctx.fill();
    ctx.strokeStyle = bgCol; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // Day labels
  ctx.fillStyle = textCol; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center';
  labels.forEach((label, i) => ctx.fillText(label, xOf(i), H - padB + 20));

  // Legend
  ctx.textAlign = 'right'; ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = accent;  ctx.fillText('▬ High', W - padR, padT + 14);
  ctx.fillStyle = accent2; ctx.fillText('▬ Low',  W - padR, padT + 30);
}

// Redraw chart on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window._chartData) drawChart(window._chartData);
  }, 120);
});

// ── MAP ───────────────────────────────────────────────────
let leafletMap     = null;
let cityMarker     = null;
let radarLayer     = null;
let overlayLayer   = null;
let activeLayerKey = 'radar';

// OpenWeatherMap-style tile layers using free sources
const LAYER_CONFIG = {
  radar: {
    legendClass: 'radar-legend',
    legendTitle: 'Precipitation',
    legendLabels: ['None', 'Light', 'Heavy'],
    getTileUrl: async () => {
      // RainViewer — free precipitation radar, no key needed
      try {
        const data = await (await fetch('https://api.rainviewer.com/public/weather-maps.json')).json();
        const ts   = data.radar.past[data.radar.past.length - 1].time;
        return `https://tilecache.rainviewer.com/v2/radar/${ts}/512/{z}/{x}/{y}/4/1_1.png`;
      } catch { return null; }
    },
  },
  temp: {
    legendClass: 'temp-legend',
    legendTitle: 'Temperature',
    legendLabels: ['Cold', 'Mild', 'Hot'],
    getTileUrl: async () =>
      'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo',
  },
  wind: {
    legendClass: 'wind-legend',
    legendTitle: 'Wind Speed',
    legendLabels: ['Calm', 'Moderate', 'Strong'],
    getTileUrl: async () =>
      'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo',
  },
  clouds: {
    legendClass: 'cloud-legend',
    legendTitle: 'Cloud Cover',
    legendLabels: ['Clear', 'Partly', 'Overcast'],
    getTileUrl: async () =>
      'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=demo',
  },
};

function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('weatherMap', {
    center: [30, 0],
    zoom: 2,
    zoomControl: true,
    attributionControl: true,
  });

  // Base tile layer — OpenStreetMap (free, no key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(leafletMap);

  // Load initial radar layer
  loadMapLayer('radar');

  // Tab switching
  document.querySelectorAll('.map-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.map-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadMapLayer(btn.dataset.layer);
    });
  });
}

async function loadMapLayer(key) {
  activeLayerKey = key;
  const cfg = LAYER_CONFIG[key];

  // Remove old overlay
  if (overlayLayer) { leafletMap.removeLayer(overlayLayer); overlayLayer = null; }

  // Update legend
  const legendBar = document.querySelector('.legend-bar');
  const legendTitle = document.querySelector('.legend-title');
  const legendLabels = document.querySelectorAll('.legend-labels span');
  if (legendBar) {
    legendBar.className = `legend-bar ${cfg.legendClass}`;
    legendTitle.textContent = cfg.legendTitle;
    cfg.legendLabels.forEach((l, i) => { if (legendLabels[i]) legendLabels[i].textContent = l; });
  }

  const tileUrl = await cfg.getTileUrl();
  if (!tileUrl) return;

  overlayLayer = L.tileLayer(tileUrl, {
    opacity: 0.7,
    maxZoom: 18,
    attribution: key === 'radar' ? '© <a href="https://rainviewer.com">RainViewer</a>' : '© OpenWeatherMap',
  }).addTo(leafletMap);
}

function updateMap(lat, lon, name, temp, desc, icon, wind, humidity) {
  if (!leafletMap) return;

  // Fly to city
  leafletMap.flyTo([lat, lon], 8, { duration: 1.5 });

  // Remove old marker
  if (cityMarker) { leafletMap.removeLayer(cityMarker); cityMarker = null; }

  // Custom icon
  const markerIcon = L.divIcon({
    className: '',
    html: `<div style="
      background: linear-gradient(135deg,#1c2a4a,#0d1117);
      border: 2.5px solid #58a6ff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,.5);
    ">
      <span style="transform:rotate(45deg);font-size:18px;">${icon}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  });

  cityMarker = L.marker([lat, lon], { icon: markerIcon }).addTo(leafletMap);

  cityMarker.bindPopup(`
    <div class="map-popup">
      <div class="pop-city">${name}</div>
      <div class="pop-icon">${icon}</div>
      <div class="pop-temp">${temp}</div>
      <div class="pop-desc">${desc}</div>
      <div class="pop-stats">
        <span>💧 ${humidity}</span>
        <span>💨 ${wind}</span>
      </div>
    </div>
  `, { maxWidth: 200 }).openPopup();
}

// ── Init ──────────────────────────────────────────────────
setMode('welcome');
initMap();
