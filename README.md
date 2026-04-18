# 🌍 Geo Breath — Smart City Air Quality Dashboard

> A **real-time, AI-powered Urban Air Quality Monitoring system** built for the **NavSanHyndri Smart City Hackathon 2025**.
> Monitor, predict, simulate, personalise, and plan — all in one premium dashboard across 5 Indian cities.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Open-Meteo](https://img.shields.io/badge/Data-Open--Meteo%20API-4CAF50)](https://open-meteo.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com/)

---

## 🚀 Tech Stack

| **Frontend**  | React 19 + Vite 8 + Vanilla CSS (Glassmorphism) + Lucide Icons      |
| **Charts**    | Recharts v3                                                         |
| **Maps**      | react-leaflet v5 + leaflet.heat                                     |
| **PDF Export**| html2canvas + jsPDF (Optimized for no-oklch)                        |
| **Auth**      | Firebase (Google Sign-In) for "My Air Story" health profile         |
| **Backend**   | FastAPI (Python 3.10+)                                              |
| **ML Model**  | scikit-learn `LinearRegression` with seasonal feature engineering  |
| **Live Data** | Open-Meteo Air Quality API (real-time + historical)                |
| **Emergency** | Automated Hazard Detection + AI Mitigation Engine                  |
| **Hosting**   | Vercel (frontend) + Render.com (backend)                           |

---

## 📁 Project Structure

```
navsanhyndri_hack/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # 7 API route definitions
│   ├── real_data.py            # Open-Meteo API integration (5 cities × 4 zones)
│   ├── mock_data.py            # Synthetic sensor data fallback generator
│   ├── ml_model.py             # Seasonal LinearRegression AQI predictor
│   ├── requirements.txt        # Python dependencies
│   └── render.yaml             # Render.com auto-deploy config
│
└── frontend/                   # React + Vite Single Page Application
    ├── src/
    │   ├── App.jsx             # Root router, global data orchestrator & caching
    │   ├── api.js              # Axios API abstraction layer
    │   ├── layouts/
    │   │   └── MainLayout.jsx  # Sidebar navigation shell + context provider
    │   ├── hooks/
    │   │   ├── useCountUp.js   # Animated number counter hook
    │   │   └── usePersonalise.js# Firebase auth + route tracking logic
    │   ├── pages/
    │   │   ├── DashboardPage.jsx     # Premium aqicn-style hero: Live AQI, 24h charts, pollutants, regional ranking
    │   │   ├── MapPage.jsx           # Interactive geospatial heatmap + zone drill-down
    │   │   ├── PredictionsPage.jsx   # 1d-365d ML Forecast + What-If Simulator + Exact Date Picker
    │   │   ├── EmergencyPage.jsx     # Emergency Operations Center (Automated detection + Manual simulation)
    │   │   ├── SuggestionsPage.jsx   # AI-driven policy recommendation engine
    │   │   ├── PersonalisePage.jsx   # My Air Story: Health profile, cigarette tracker, clean-air leaderboard
    │   │   ├── PlanningPage.jsx      # Govt. Urban Planning sandbox (Green zones vs Industrial growth)
    │   │   └── GovtLoginPage.jsx     # Secure government portal login entry
    │   └── components/
    │       ├── AQICards.jsx          # High-fidelity metric cards with gradient statuses
    │       ├── AlertBanner.jsx       # Global severity-driven dynamic notification system
    │       ├── AQIMap.jsx            # Multi-layer Leaflet heatmap engine
    │       ├── PollutantChart.jsx    # 24h historical multi-pollutant baseline rendering
    │       ├── PredictionGraph.jsx   # Horizon-aware ML forecast with confidence intervals
    │       ├── DatePickerWidget.jsx  # Exact date selection for targeted AQI predictions
    │       ├── WhatIfSimulator.jsx   # Interactive slider-based intervention modeling
    │       ├── EmergencySimulator.jsx# Live telemetry monitor + Automated Hazard detection + "Force Spike" demo
    │       └── ReportGenerator.jsx  # PDF executive summary engine (optimized CSS)
    ├── .env.example            # Environment template
    └── vercel.json             # Vercel SPA routing config
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Python **3.10+**
- Node.js **18+**

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Backend runs at: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local and set:
# VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

- Frontend runs at: `http://localhost:5173`

---

## 🌐 API Endpoints

| Method | Endpoint              | Query Params                | Description                                   |
|--------|-----------------------|-----------------------------|-----------------------------------------------|
| `GET`  | `/api/cities`         | —                           | List all supported cities and their zones     |
| `GET`  | `/api/current`        | `city`, `zone` (optional)   | Live AQI + pollutants for all city zones      |
| `GET`  | `/api/history`        | `city`, `hours` (default 24)| Time-series AQI for the last N hours          |
| `GET`  | `/api/heatmap`        | `city`                      | 150-point lat/lng grid with AQI intensity     |
| `GET`  | `/api/predict`        | `city`, `days` (1–365)      | ML forecast with confidence interval          |
| `POST` | `/api/simulate`       | JSON body (see below)       | Simulate emergency events and get response    |
| `GET`  | `/api/suggestions`    | `city`, `zone` (optional)   | AI policy recommendations based on factors   |

**Simulate Request Body:**
```json
{
  "event_type": "factory_leak | wildfire | traffic_jam",
  "city": "Pune",
  "zone": "Hinjewadi"
}
```

---

## 🗺️ Supported Cities & Zones

| City       | Zones                                          |
|------------|------------------------------------------------|
| Pune       | Swargate, Hinjewadi, Kothrud, Viman Nagar      |
| Mumbai     | Bandra, Andheri, Dharavi, Powai                |
| Delhi      | Connaught Place, Chandni Chowk, Dwarka, Okhla  |
| Bengaluru  | Koramangala, Indiranagar, Whitefield, Jayanagar |
| Chennai    | T Nagar, Adyar, Velachery, Anna Nagar          |

---

## 🤖 ML Model

- **Algorithm:** `LinearRegression` (scikit-learn)
- **Training data:** 365 days of synthetically anchored AQI, seeded from live Open-Meteo readings
- **Features:** `sin(day_of_year)`, `cos(day_of_year)`, `winter_penalty` (days 1-60 & 300-365 = 1.0)
- **Seasonal logic:** Winter inversions add +40 AQI baseline to capture north-Indian pollution spikes
- **Forecast horizon:** 1 day to 1 year (user-configurable via slider or exact date picker)
- **Output:** Daily forecast with `±15 AQI confidence band`
- **Explainability:** Season-aware, plain-English reasons generated per AQI level

---

## 📊 Dashboard Pages

| **Dashboard** | Premium aqicn-style command center: real-time AQI hero, weather widgets, pollutant breakdowns, 24h color-mapped charts, and localized zone rankings. |
| **Live Map** | High-precision Leaflet heatmap with real-time zone markers and geospatial drill-down. |
| **Forecasting** | Advanced ML forecasting with a 1d–365d horizon, "Exact Date" prediction widget, and "What-If" intervention simulator. |
| **Emergency** | Emergency Operations Center: Features **Automated Hazard Detection** from live feeds, AI-generated mitigation plans, and a **"Force Spike" demo** for simulation. |
| **Policy Engine** | Source attribution analysis (Vehicles/Industry/Dust) with context-aware AI policy directives. |
| **My Air Story** | Personalised health dashboard with cigarette-equivalent tracking, AQI journey logs, and Google-authenticated health profiles. |
| **Urban Planning** | Sandbox environment for city administrators to model green zone placement and industrial growth impact on local AQI. |

---

## 🚀 Deployment

### Frontend → Vercel
1. Import the `/frontend` folder to [vercel.com](https://vercel.com)
2. Set environment variable: `VITE_API_URL=<your-render-backend-url>`
3. Vercel auto-detects Vite; `vercel.json` handles SPA routing rewrites

### Backend → Render.com
- `render.yaml` is pre-configured in `/backend`
- Connect your GitHub repo → Render auto-detects and deploys
- Free tier may cold-start; first request after idle may take ~15 seconds

---

## 🏆 Built for

**navsanhyandri_hack** | Powered by goblet of fire
