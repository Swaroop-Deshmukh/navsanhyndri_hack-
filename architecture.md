# 🏗️ AQI Pulse — System Architecture

> This document describes the full-stack architecture, data flow, and component design of the AQI Pulse platform.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│                                                                      │
│  React 19 SPA (Vite 8) — Deployed on Vercel                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │Dashboard │  │ Heatmap  │  │Predictions│  │Emergency │  │Sugges-│ │
│  │  Page    │  │  Page    │  │  Page    │  │  Page    │  │tions  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       │              │             │              │             │     │
│       └──────────────┴─────────────┴──────────────┴─────────────┘   │
│                                   │                                  │
│                            App.jsx (Root)                            │
│                      Global Data Cache + Context                     │
│                         Axios API Layer (api.js)                     │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  HTTPS REST  (VITE_API_URL)
                               │  (30-second polling interval)
┌──────────────────────────────▼───────────────────────────────────────┐
│                        BACKEND (Python)                              │
│                                                                      │
│         FastAPI — Deployed on Render.com                             │
│                                                                      │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────┐                │
│  │ real_data  │   │  ml_model   │   │  mock_data   │                │
│  │  .py       │   │    .py      │   │   .py        │                │
│  │            │   │             │   │              │                │
│  │ Open-Meteo │   │ sklearn     │   │ Synthetic    │                │
│  │ API calls  │   │ Linear      │   │ Fallback     │                │
│  │ (live AQI) │   │ Regression  │   │ (offline)    │                │
│  └─────┬──────┘   └──────┬──────┘   └──────────────┘                │
│        │                 │                                           │
│        └─────────────────▼                                           │
│                     main.py (Route Handlers)                         │
│        /cities /current /history /heatmap /predict                   │
│        /simulate /suggestions                                        │
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                      EXTERNAL DATA SOURCE                            │
│              Open-Meteo Air Quality API (free, no-key)               │
│       european_aqi | pm2_5 | pm10 | carbon_monoxide | nitrogen_dioxide│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Routing & Layout

The application uses **React Router v7** nested routes. All pages share a `MainLayout` shell that provides:
- Persistent sidebar navigation (Dashboard / Map / Predictions / Emergency / Suggestions)
- City + Zone selector dropdowns
- PDF export trigger (opens `ReportGenerator`)
- React Context for passing shared `contextData` to all pages

```
BrowserRouter
└── MainLayout (sidebar + selectors + context provider)
    ├── / → DashboardPage
    ├── /map → MapPage
    ├── /predictions → PredictionsPage
    ├── /emergency → EmergencyPage
    └── /suggestions → SuggestionsPage
```

### 2.2 Centralized Data Fetching & Caching

All data fetching is centralized in `App.jsx` to **eliminate redundant API calls** across page navigations:

```
App.jsx
├── useEffect → getCities()             (once on mount)
└── useEffect (depends: city, zone)
    ├── getCurrentData(city, zone)       ┐ parallel via
    └── getHistoryData(city, 24h)        ┘ Promise.all()
    └── setInterval(fetchData, 30_000)  (30s polling)
```

`contextData` is passed down through `MainLayout` → `Outlet context` → individual pages and components, so no child component independently fetches data from the API.

### 2.3 Component Breakdown

| Component | Purpose |
|-----------|---------|
| `AQICards` | KPI metric cards displaying AQI, PM2.5, PM10, NO₂, CO per zone |
| `AlertBanner` | Dynamic severity banner triggered when max AQI exceeds thresholds |
| `AQIMap` | Leaflet heatmap + clickable zone markers with AQI popups |
| `PollutantChart` | 24-hour multi-pollutant Recharts line chart (historical data) |
| `PredictionGraph` | 10-day ML forecast area chart with shaded confidence band |
| `ExplainabilityCard` | Season-aware, plain-English bullet explanations for forecast |
| `FactorsBarChart` | Bar chart breakdown of pollutant sources (vehicle/factory/dust/other) |
| `WhatIfSimulator` | Client-side AQI slider to model intervention impact scenarios |
| `EmergencySimulator` | Live event log + POST `/api/simulate` dispatch + minimap |
| `ReportGenerator` | Off-screen PDF render using html2canvas + jsPDF (inline styles only) |

---

## 3. Backend Architecture

### 3.1 API Layer (`main.py`)

FastAPI handles all routes. CORS is open (`*`) to allow Vercel → Render cross-origin requests.

```python
GET  /api/cities       → List cities + zones
GET  /api/current      → Live zone AQI (real_data.get_current_real_data)
GET  /api/history      → Hourly historical AQI (real_data.get_historical_real_data)
GET  /api/heatmap      → 150-point AQI intensity grid (real_data.get_heatmap_real_data)
GET  /api/predict      → 10-day ML forecast (ml_model.predictor.predict)
POST /api/simulate     → Emergency event response (hardcoded scenario responses)
GET  /api/suggestions  → Factor-based policy suggestions (threshold rules)
```

### 3.2 Data Layer (`real_data.py`)

**Primary source:** Open-Meteo Air Quality API (free, no API key required)

- **Current data:** Multi-coordinate batch request for all city zones simultaneously
- **Historical data:** `past_days` parameter fetches hourly archive
- **Heatmap data:** Single city-center query → 150 noise-scattered points around actual base AQI
- **Graceful fallback:** `try/except` block returns hardcoded moderate values if API is offline

**City coverage:**

```
Pune (4 zones) | Mumbai (4 zones) | Delhi (4 zones)
Bengaluru (4 zones) | Chennai (4 zones)
```

### 3.3 ML Model (`ml_model.py`)

The `AQIPredictor` class implements a **per-city lazy-trained linear regression** model:

```
Input Features:
  sin(day_of_year / 365.25 × 2π)   ← captures annual seasonality
  cos(day_of_year / 365.25 × 2π)   ← orthogonal seasonality component
  winter_penalty (0 or 1)           ← 1 for days 1-60 and 300-365

Training Data:
  365 synthetic days anchored on city's current live AQI
  Winter penalty adds +40 AQI (India inversion layer effect)
  Gaussian noise σ=10 for realism

Output per forecast day:
  predicted_aqi | confidence_high (+20) | confidence_low (-20) | date
```

Models are cached in `city_models` dict after first prediction call per city (no re-training unless restarted).

### 3.4 Synthetic Fallback (`mock_data.py`)

Used as offline fallback when Open-Meteo is unreachable:
- 5 hardcoded zones with base AQI values (Mumbai area coordinates)
- Traffic factor: ×1.3 multiplier during peak hours (08-10h, 17-20h)
- Gaussian noise (σ=5) to simulate sensor variance
- PM2.5, PM10, NO₂, CO derived as proportional fractions of AQI

---

## 4. Data Flow Diagram

```
User selects City/Zone
        │
        ▼
App.jsx triggers useEffect
        │
        ├──► GET /api/current?city=Pune
        │         │
        │         ▼
        │    real_data.py
        │    → Open-Meteo API call (multi-zone batch)
        │    → Falls back to mock if API fails
        │    → Returns: [{zone, aqi, pm25, pm10, no2, co, status, factors}]
        │
        └──► GET /api/history?city=Pune&hours=24
                  │
                  ▼
             real_data.py
             → Open-Meteo hourly archive (past_days=2)
             → Returns last 24 hourly readings
             → [{timestamp, aqi, pm25, pm10, no2}]

        Both fetched in parallel via Promise.all()
        Results stored in App state → passed via Context

PredictionsPage mounts
        │
        ▼
GET /api/predict?city=Pune&days=10
        │
        ▼
ml_model.py
→ Trains on 365d synthetic data anchored on current AQI
→ Predicts 10 future days with features
→ Returns [{date, predicted_aqi, confidence_high, confidence_low}]
→ get_explanation() returns season-aware insight bullets

EmergencyPage user clicks "Dispatch Wildfire"
        │
        ▼
POST /api/simulate {event_type: "wildfire", city: "Pune"}
        │
        ▼
main.py returns {aqi_spike: 300, affected_radius_km: 25, recommendation: "..."}
        │
        ▼
EmergencySimulator renders spike on minimap + appends to event log

DashboardPage "Export PDF" clicked
        │
        ▼
ReportGenerator mounts off-screen, renders full report DOM
html2canvas captures the report div (inline styles only, no oklch)
jsPDF generates and downloads AQI_Pulse_Report_<City>_<Date>.pdf
```

---

## 5. Deployment Architecture

```
GitHub Repo
    │
    ├── /frontend → Vercel
    │              Auto-build: npm run build (Vite)
    │              Env: VITE_API_URL=https://<render-service>.onrender.com
    │              SPA rewrites: vercel.json → all routes → index.html
    │
    └── /backend  → Render.com
                   Config: render.yaml
                   Service: Web Service (Python)
                   Start: uvicorn main:app --host 0.0.0.0 --port $PORT
                   Free tier: cold start ~15s after 30min idle
```

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Centralized data fetching in App.jsx** | Eliminates redundant API calls when navigating between pages; reduces Open-Meteo rate limit risk |
| **30-second polling (not WebSocket)** | Sufficient for AQI data that changes every few minutes; simpler to deploy and debug |
| **Open-Meteo (no API key)** | Enables zero-friction demo deployment; graceful fallback ensures reliability |
| **Per-city lazy ML training** | Models trained on first predict call per city; cached for session; avoids pre-training all 5 cities at startup |
| **Inline styles in ReportGenerator** | html2canvas crashes on Tailwind's `oklch()` color values; all PDF components use hex/rgb inline styles |
| **Synthetic heatmap noise** | 150 geo-scattered points around actual city-center AQI create a visually realistic heatmap without querying 150 individual coordinates |
