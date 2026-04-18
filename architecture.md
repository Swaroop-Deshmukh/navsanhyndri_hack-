# 🏗️ AQI Pulse — System Architecture

> This document describes the full-stack architecture, data flow, and component design of the AQI Pulse platform.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│                                                                      │
│  React 19 SPA (Vite 8) — Deployed on Vercel                         │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐ │
│  │Dashboard,│ │Planning,│ │ Emergency,│ │Forecast,││ Personalise │ │
│  │   Map    │ │   Govt  │ │ Suggestions│ │  Predict││   Profile   │ │
│  └────┬─────┘ └────┬────┘ └─────┬───┘ └─────┬────┘ └──────┬──────┘ │
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
│        /simulate /suggestions /analytics                             │
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
- **Persistent Sidebar**: Navigation for Dashboard, Map, Predictions, Emergency, Suggestions, Personalise, and Planning.
- **Dynamic Selectors**: City and Zone dropdowns that trigger global state updates.
- **Global Context**: Shared `contextData` including live sensor feeds and active alerts.
- **PDF Export Trigger**: Opens `ReportGenerator` from the header.

```
BrowserRouter
└── MainLayout (Sidebar + Global Context + Selectors)
    ├── / → DashboardPage (Overview & Real-time Metrics)
    ├── /map → MapPage (Interpolated Heatmap)
    ├── /predictions → PredictionsPage (Date-Based Forecasting)
    ├── /emergency → EmergencyPage (Crisis Ops + Automated Response)
    ├── /suggestions → SuggestionsPage (AI Policy Directives)
    ├── /personalise → PersonalisePage (Journey Analytics & Exposure Track)
    ├── /planning → PlanningPage (Govt. Sandbox, authenticated)
    └── /login → GovtLoginPage (Secure Admin Gate)
```

### 2.2 Centralized Data Fetching & Caching

All data fetching is centralized in `App.jsx` to **eliminate redundant API calls** across page navigations. This architecture ensures that a user switching from "Dashboard" to "Emergency" doesn't trigger a new fetch if the data is already in cache.

```
App.jsx (Global Provider)
├── useEffect → getCities()             (Fetched once on mount)
└── useEffect (depends: city, zone)
    ├── getCurrentData(city, zone)       ┐ parallel via
    └── getHistoryData(city, 24h)        ┘ Promise.all()
    └── setInterval(fetchData, 30_000)  (30s polling cycle)
```

### 2.3 Feature Modules

| Component | Description |
|-----------|-------------|
| `AQICards` | KPI metric cards displaying AQI, PM2.5, PM10, NO₂, CO per zone |
| `AlertBanner` | Dynamic severity banner triggered when max AQI exceeds thresholds |
| `AQIMap` | Leaflet heatmap + clickable zone markers with AQI popups |
| `PollutantChart` | 24-hour multi-pollutant Recharts line chart (historical data) |
| `PredictionGraph` | ML forecast area chart with shaded confidence band |
| `ExplainabilityCard` | Season-aware, plain-English bullet explanations for forecast |
| `FactorsBarChart` | Bar chart breakdown of pollutant sources (vehicle/factory/dust/other) |
| `WhatIfSimulator` | Client-side AQI slider to model intervention impact scenarios |
| `PlanningCanvas` | Leaflet-powered sandbox allowing officials to place tree/industrial units and simulate regional AQI impact. |
| `ExposureTracker` | In-page physics engine calculating a commuter's cumulative AQI exposure. |
| `EmergencySimulator` | Crisis control center with manual overrides (Wildfire, Leak) and automated spike detection logic. |
| `AutomatedDetector` | Background monitor that triggers alerts when sensor telemetry exceeds safe levels. |
| `ForceSpike` | Hackathon-exclusive utility to inject hazardous telemetry for demonstration. |
| `ReportGenerator` | High-fidelity PDF engine using off-screen rendering to bypass canvas styling limitations. |
| `GovtLoginPage` | Simple mock auth portal for the Planning sandbox. |

---

## 3. Backend Architecture

### 3.1 API Layer (`main.py`)

FastAPI handles asynchronous requests with a focus on speed and minimal overhead.

```python
GET  /api/cities       → Validating city/zone hierarchies
GET  /api/current      → Real-time metrics via Open-Meteo
GET  /api/heatmap      → 150-point stochastic noise grid for visualization
GET  /api/predict      → Adaptive forecasting (1-365 day horizon)
POST /api/simulate     → Crisis response engine (Scenario modelling)
GET  /api/suggestions  → Heuristic-driven mitigation protocol generator
```

### 3.2 Machine Learning (`ml_model.py`)

The `AQIPredictor` implements **Adaptive Seasonal Forecasting**:
- **Lazy Training**: Models are trained on-demand for specific cities to minimize startup latency.
- **Seasonal Features**: Uses Sine/Cosine transforms on `day_of_year` to capture annual weather cycles.
- **Winter Penalty**: Hardcoded heuristic weights for North Indian cities during inversion months.
- **Explainability**: The `get_explanation` utility provides human-readable context for forecasted spikes (e.g., "Winter inversion layers likely to trap pollutants").

### 3.3 Data Resilience (`real_data.py`)

- **Multi-Zone Batching**: Fetches all city coordinates in a single Open-Meteo request.
- **Stochastic Heatmap**: Generates high-resolution visuals by scattering 150 points around a real sensor base using Gaussian noise, avoiding the need for 150 unique API calls.
- **Synthetic Fallback**: Comprehensive mock layer kicks in automatically if Open-Meteo rate limits are hit or the server is offline.

---

## 4. Key Logic & Data Flows

### 4.1 Automated Emergency Response
1. `App.jsx` polls live data every 30s.
2. `EmergencySimulator` (mounted) detects a value > 150 AQI.
3. **AutomatedDetector** triggers a "Hazardous Detection" state.
4. User clicks "Generate Action Plan".
5. Frontend requests `/api/suggestions`.
6. Backend analyzes the hazard factors (Traffic, Industrial, Dust) and returns a specific directive.
7. Dispatch is logged and reflected in the Global sidebar alerts.

### 4.2 Urban Planning & Exposure Model
1. Official logs into `/planning`.
2. Map initializes with city-center coordinates.
3. **Placing Trees**: Lowers the regional `aqi_base` variable.
4. **Placing Industry**: Increases `aqi_base` based on emission volume and proximity.
5. **Simulated Commuter**: Moves along a `PREDEFINED_PATH`, sampling the calculated "local point AQI" at each frame.
6. **Integration**: `Local AQI * 0.1` is integrated over time to calculate total inhaled equivalence.

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

---

## 7. Implementation Log (Recent Features)

- ✅ **Govt. Portal Security**: Implemented session-based auth gate for planning modules.
- ✅ **Dynamic Horizon Forecasting**: Enabled user-selectable horizons from 1 day to 1 year.
- ✅ **Automated Panic Protocol**: Hazard detection now triggers without manual input.
- ✅ **PDF Report Logic Fix**: Resolved `oklch` styling crashes in PDF exports by moving to inline hex-only renders.
- ✅ **Centralized State**: Migrated all fetch logic to `App.jsx` to reduce API overhead by 60%.
