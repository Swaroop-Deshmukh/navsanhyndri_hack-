# 🌍 AQI Pulse — Smart City Air Quality Dashboard

> A **real-time, AI-powered Urban Air Quality Monitoring system** built for the **NavSanHyndri Smart City Hackathon 2025**.
> Monitor, predict, simulate, and act on air quality data across 5 Indian cities — all in one dashboard.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Open-Meteo](https://img.shields.io/badge/Data-Open--Meteo%20API-4CAF50)](https://open-meteo.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com/)

---

## 🚀 Tech Stack

| Layer        | Technology                                                          |
|--------------|---------------------------------------------------------------------|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui                   |
| **Charts**   | Recharts v3                                                         |
| **Maps**     | react-leaflet v5 + leaflet.heat                                     |
| **PDF Export**| html2canvas + jsPDF                                                |
| **Backend**  | FastAPI (Python 3.10+)                                              |
| **ML Model** | scikit-learn `LinearRegression` with seasonal feature engineering  |
| **Live Data**| Open-Meteo Air Quality API (real-time + historical)                |
| **Fallback** | Synthetic sensor simulation (noise + traffic patterns)             |
| **Hosting**  | Vercel (frontend) + Render.com (backend)                           |

---

## 📁 Project Structure

```
navsanhyndri_hack/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # 6 API route definitions
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
    │   ├── pages/
    │   │   ├── DashboardPage.jsx     # Overview: KPI cards, trend chart, alert banner
    │   │   ├── MapPage.jsx           # Interactive heatmap + zone marker drill-down
    │   │   ├── PredictionsPage.jsx   # 10-day ML forecast + explainability
    │   │   ├── EmergencyPage.jsx     # Emergency Operations Center
    │   │   └── SuggestionsPage.jsx   # AI-driven policy recommendation engine
    │   └── components/
    │       ├── AQICards.jsx          # Metric cards (AQI / PM2.5 / NO₂ / CO)
    │       ├── AlertBanner.jsx       # Severity-driven dynamic alert ribbon
    │       ├── AQIMap.jsx            # Leaflet heatmap with AQI intensity grid
    │       ├── PollutantChart.jsx    # 24h historical multi-line trend chart
    │       ├── PredictionGraph.jsx   # 10-day ML forecast + confidence band
    │       ├── ExplainabilityCard.jsx# Plain-English AI insight bullets
    │       ├── FactorsBarChart.jsx   # Pollutant source breakdown bar chart
    │       ├── WhatIfSimulator.jsx   # Client-side AQI what-if slider model
    │       ├── EmergencySimulator.jsx# Live telemetry + event dispatch minimap
    │       └── ReportGenerator.jsx  # PDF executive report (inline charts)
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

| Method | Endpoint              | Query Params               | Description                                   |
|--------|-----------------------|----------------------------|-----------------------------------------------|
| `GET`  | `/api/cities`         | —                          | List all supported cities and their zones     |
| `GET`  | `/api/current`        | `city`, `zone` (optional)  | Live AQI + pollutants for all city zones      |
| `GET`  | `/api/history`        | `city`, `hours` (default 24)| Time-series AQI for the last N hours        |
| `GET`  | `/api/heatmap`        | `city`                     | 150-point lat/lng grid with AQI intensity     |
| `GET`  | `/api/predict`        | `city`, `days` (default 10) | ML 10-day forecast with confidence interval  |
| `POST` | `/api/simulate`       | JSON body (see below)      | Simulate emergency events and get response    |
| `GET`  | `/api/suggestions`    | `city`, `zone` (optional)  | AI policy recommendations based on factors   |

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

| City       | Zones                                         |
|------------|-----------------------------------------------|
| Pune       | Swargate, Hinjewadi, Kothrud, Viman Nagar     |
| Mumbai     | Bandra, Andheri, Dharavi, Powai               |
| Delhi      | Connaught Place, Chandni Chowk, Dwarka, Okhla|
| Bengaluru  | Koramangala, Indiranagar, Whitefield, Jayanagar|
| Chennai    | T Nagar, Adyar, Velachery, Anna Nagar         |

---

## 🤖 ML Model

- **Algorithm:** `LinearRegression` (scikit-learn)
- **Training data:** 365 days of synthetically anchored AQI, seeded from live Open-Meteo readings
- **Features:** `sin(day_of_year)`, `cos(day_of_year)`, `winter_penalty` (days 1-60 & 300-365 = 1.0)
- **Seasonal logic:** Winter inversions add +40 AQI baseline to capture north-Indian pollution spikes
- **Output:** 10-day daily forecast with `±20 AQI confidence band`
- **Explainability:** Season-aware, plain-English reasons generated per AQI level

---

## 📊 Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Real-time KPI cards, 24h pollutant trend, alert banner, PDF export |
| **Heatmap** | Interactive Leaflet heatmap with zone markers and drill-down popups |
| **Predictions** | 10-day ML forecast chart with confidence band and AI explainability |
| **Emergency** | Live telemetry console + manual simulation of wildfire / factory leak / traffic jam events |
| **Suggestions** | AI-generated policy directives (odd-even enforcement, industrial curtailment, dust protocols) |

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

**Quatum Arena 1.0 Hackathon** | Powered by Central Government
