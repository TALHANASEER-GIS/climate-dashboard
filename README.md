# 🌤 SkyView — Weather Forecasting Dashboard

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Open-Meteo](https://img.shields.io/badge/Open--Meteo-API-00BFFF?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?style=for-the-badge&logo=github)

A **fully responsive, real-time weather forecasting dashboard** built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no API keys — just open the browser and go.

---

## 🖼️ Preview

| Dark Mode | Light Mode |
|-----------|------------|
| Deep glassmorphism UI with animated blobs | Clean light theme with soft shadows |

> **Live Demo:** [talhanaseer-gis.github.io/climate-dashboard](https://talhanaseer-gis.github.io/climate-dashboard/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **City Search** | Live autocomplete as you type (powered by Open-Meteo Geocoding) |
| 📍 **GPS Location** | One-click "Use my location" via browser geolocation |
| 🌡️ **Current Weather** | Temperature, feels like, humidity, wind speed, precipitation, elevation |
| ⏱️ **24-Hour Hourly Forecast** | Scrollable hourly cards with icons and rain probability |
| 📅 **7-Day Forecast** | Daily cards with high/low temps, condition icons, rainfall |
| 📈 **Temperature Chart** | Pure Canvas chart showing weekly high/low temperature trends |
| ☀️ **UV Index** | Visual sliding bar with colour zones and safety tips |
| 🌬️ **Air Quality (AQI)** | Real-time PM2.5, PM10, CO, NO₂ with colour-coded health advice |
| 🌙 **Dark / Light Mode** | Smooth theme toggle — preference reflected in the canvas chart too |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |

---

## 🗂️ Project Structure

```
climate-dashboard/
├── index.html      # App structure & layout
├── style.css       # Dark/light themes, animations, responsive grid
├── app.js          # API calls, rendering logic, canvas chart
├── DEPLOY.md       # Step-by-step GitHub Pages deployment guide
└── README.md       # You are here
```

---

## 🌐 APIs Used

All APIs are **completely free** with **no API key required**.

| API | Purpose | Endpoint |
|-----|---------|----------|
| [Open-Meteo Forecast](https://open-meteo.com/) | Weather + UV + Hourly + Daily | `api.open-meteo.com/v1/forecast` |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City search & coordinates | `geocoding-api.open-meteo.com/v1/search` |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | PM2.5, PM10, CO, NO₂ | `air-quality-api.open-meteo.com/v1/air-quality` |

---

## 🚀 Getting Started

### Run Locally

No build step needed — just open the file:

```bash
git clone https://github.com/TALHANASEER-GIS/climate-dashboard.git
cd climate-dashboard
# Open index.html in your browser
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

### Deploy to GitHub Pages

1. Push the repo to GitHub *(already done ✅)*
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save — live in ~1 minute at:
   ```
   https://talhanaseer-gis.github.io/climate-dashboard/
   ```

Full instructions in [DEPLOY.md](./DEPLOY.md).

---

## 🧠 How It Works

```
User types city name
       ↓
Open-Meteo Geocoding API  →  lat / lon coordinates
       ↓
  Two parallel API calls:
  ┌──────────────────────────┐   ┌─────────────────────────────┐
  │  Open-Meteo Forecast API  │   │  Open-Meteo Air Quality API  │
  │  • Current conditions     │   │  • PM2.5 / PM10              │
  │  • Hourly (next 24h)      │   │  • Carbon monoxide           │
  │  • Daily (7-day)          │   │  • Nitrogen dioxide          │
  │  • UV index               │   └─────────────────────────────┘
  └──────────────────────────┘
       ↓
  Render dashboard:
  current card · UV bar · AQI card
  hourly scroll · 7-day grid · canvas chart
```

---

## 🎨 Tech Highlights

- **Zero dependencies** — no jQuery, no Chart.js, no React
- **Canvas chart** drawn entirely with the native HTML5 Canvas 2D API
- **CSS custom properties** power the full dark/light theme switch
- **CSS Grid + Flexbox** for responsive layout
- **Glassmorphism** UI with animated radial gradient blobs
- **Debounced search** with live autocomplete dropdown
- **Parallel `Promise.all` fetches** for fast data loading

---

## 📸 WMO Weather Code Coverage

The app interprets all standard WMO weather codes (0–99):

| Code Range | Condition |
|------------|-----------|
| 0–3 | Clear → Overcast |
| 45–48 | Fog |
| 51–55 | Drizzle |
| 61–65 | Rain |
| 71–77 | Snow |
| 80–82 | Rain Showers |
| 85–86 | Snow Showers |
| 95–99 | Thunderstorms |

---

## 📝 License

This project is open source under the [MIT License](https://opensource.org/licenses/MIT).  
Feel free to fork, modify, and use it in your own projects!

---

## 👤 Author

**TALHA NASEER**  
🔗 [github.com/TALHANASEER-GIS](https://github.com/TALHANASEER-GIS)

---

> Built with ❤️ using Open-Meteo's free weather APIs — no API key needed, ever.
