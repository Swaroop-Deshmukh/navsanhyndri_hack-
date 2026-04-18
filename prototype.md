# 🧪 AQI Pulse — Prototype Walkthrough

> A comprehensive guide to every feature in the **AQI Pulse** hackathon prototype — what it does, how it works, and how to demo it live.

---

## Overview

**AQI Pulse** is a full-stack, real-time air quality intelligence platform for Indian cities. It was designed to answer a single question:

> *"Given what's happening in the air right now, what should city administrators do next?"*

The prototype covers the full decision-making loop:
1. **Monitor** → Live AQI readings per city zone
2. **Analyze** → Historical trends + pollutant source breakdown
3. **Predict** → 1d-365d ML-based AQI forecast + Exact Date Picker
4. **Respond** → Automated Hazard Detection + AI-generated Action Plans
5. **Simulate** → Govt. Urban Planning sandbox for city administrators
6. **Report** → One-click PDF executive report export

---

## 🗺️ Page-by-Page Walkthrough

### 1. Dashboard Page (`/`)

**What the judge sees first.** This is the command center.

| Element | What it shows |
|---------|--------------|
| **City / Zone Selector** | Switch between 5 cities (Pune, Mumbai, Delhi, Bengaluru, Chennai) and any of their 4 zones |
| **Alert Banner** | Auto-triggers with color-coded severity (Good → Moderate → Unhealthy → Hazardous) based on max zone AQI |
| **AQI Metric Cards** | Live readings per zone: AQI index, PM2.5 (μg/m³), PM10, NO₂, CO |
| **24h Trend Chart** | Multi-pollutant line chart (Recharts) showing the last 24 hours of readings |
| **Export PDF** | Generates and downloads a complete executive PDF report for the selected city |

**Demo tip:** Select **Delhi** → the AQI cards spike and the alert banner turns red. Selecting **Bengaluru** shows a cleaner baseline. This contrast makes the city selector feel impactful.

---

### 2. Heatmap Page (`/map`)

**Spatial intelligence** — where exactly is the pollution worst?

| Element | What it shows |
|---------|--------------|
| **Leaflet Heatmap** | 150 geo-scattered data points displayed as a color-intensity gradient (green → yellow → red → purple) |
| **Zone Markers** | Blue circle markers for each monitoring zone; click to open a popup showing live AQI, PM2.5, status |
| **Dynamic Anchor** | Heatmap intensity is anchored to the city's real current AQI from Open-Meteo (higher baseline = hotter grid) |

**Demo tip:** Click any zone marker on the map. A popup appears with the zone name and current readings without leaving the map view.

---

### 3. Predictions Page (`/predictions`)

**AI-powered forecasting** — what does the next 10 days look like?

| Element | What it shows |
|---------|--------------|
| **1d–365d Forecast** | Area chart with predicted AQI per day and a shaded confidence band |
| **Exact Date Picker** | Select any specific future date to get a targeted ML projection |
| **Intervention Slider**| "What-If" simulator to model AQI drops based on proposed EV adoption or factory shutdowns |
| **Explainability** | Plain-English AI-generated reasons for the forecast (Seasonality / Transitions) |

**How the ML works:**
- On first prediction call per city, the backend trains a `LinearRegression` model on 365 days of synthetic AQI data anchored on the city's current live AQI
- Features: sine/cosine of day-of-year (annual seasonality) + winter penalty flag (Indian inversion season)
- Training is cached per city for the session lifetime

**Demo tip:** Switch from Pune (April → moderate) to Delhi (same date every year is near-winter in history → higher forecast). The explainability text changes accordingly.

---

### 4. Emergency Operations Page (`/emergency`)

**Crisis simulation** — the most demo-friendly page.

| Element | What it shows |
|---------|--------------|
| **Hazard Monitor** | Automated detector that triggers when live zone AQI exceeds 150 |
| **Force Spike** | **Demo Secret:** A purple button that injects a hazardous scenario for instant judge-impressing triggers |
| **AI Action Plan** | Context-aware mitigation strategy generated based on the detected hazard |
| **Manual Override** | Three manual buttons: 🏭 Factory Leak, 🔥 Wildfire, 🚗 Traffic Jam |
| **Blast Radius Map**| Georeferenced map display showing the exact impact area of the crisis |

**Simulation responses:**
| Event | AQI Spike | Radius | Response |
|-------|-----------|--------|----------|
| Factory Leak | +180 | 5 km | Evacuate 1km, advise indoors |
| Wildfire | +300 | 25 km | N95 advisory, mass evacuation |
| Traffic Jam | +80 | 2.5 km | Reroute non-essential traffic |

**Demo tip:** Dispatch a Wildfire in Delhi → the map shows a 25km impact radius and the console logs the hazardous spike. Demonstrates immediate decision-support in a real emergency scenario.

---

### 5. Suggestions Page (`/suggestions`)

**AI policy engine** — actionable directives based on real pollutant factor data.

| Element | What it shows |
|---------|--------------|
| **Factor Bar Chart** | Visual breakdown of pollution sources: Vehicles / Industry / Construction Dust / Other (%) |
| **AI Directive Cards** | Context-aware recommendations generated by the backend based on factor thresholds |
| **Directive Targeting** | Each suggestion targets a specific source with an action and projected impact estimate |

**Directive logic (backend rule engine):**
| Condition | Recommendation |
|-----------|---------------|
| `vehicle_contribution > 40%` | Odd-even license plate enforcement → 15% PM2.5 drop |
| `factory > 25%` | Industrial suspension within 5km → 20% PM10 drop |
| `dust > 20%` | Anti-smog gun deployment + construction halt |
| None triggered | Maintain green corridors (stable baseline) |

**Demo tip:** Select **Dharavi, Mumbai** (heavy industry zone) → factory contribution is high → industrial curtailment directive appears automatically.

---

### 6. My Air Story (`/personalise`)

**Individual Impact** — making air quality personal.

| Element | What it shows |
|---------|--------------|
| **Cigarette Counter** | Real-time calculation of inhaled pollutants equivalent to cigarettes |
| **Air Story Log** | Chronological record of zones visited and exposure levels |
| **Clean Air Leaderboard**| Gamified community ranking for users with the lowest weekly exposure |
| **Health Profile** | Google-authenticated portal to track personal respiratory trends |

---

### 7. Govt. Planning Sandbox (`/planning`)

**Strategic Foresight** — auth-gated urban development simulation.

- **Green Zones:** Place virtual parks on the map and watch neighborhing zone AQI drop in real-time.
- **Industrial Growth:** Model the impact of new factories on regional air quality.
- **Commuter Exposure:** Track synthetic traffic patterns to optimize clean-air corridors.

---

### 8. PDF Report Export

**One-click executive deliverable.** Accessible from the Dashboard page header button.

The report contains:
1. **Header** — City name, report date, AQI status flag
2. **KPI Summary** — Peak AQI, average PM2.5, active zone count
3. **Zone Table** — All zones with full pollutant readings + color-coded status
4. **Charts** — Inline AQI trend projection + pollutant source pie chart
5. **AI Directives** — Same as Suggestions page, embedded in styled callout boxes
6. **Footer** — Data attribution to Open-Meteo

**Technical note:** The report DOM is rendered off-screen using only inline hex/rgb styles (Tailwind `oklch()` colors crash html2canvas). A 1.8-second delay ensures Recharts SVGs fully paint before canvas capture.

---

## 🔌 Live Data vs. Simulation

| Scenario | Behavior |
|----------|---------|
| **Online (normal demo)** | Open-Meteo API returns real European AQI index, PM2.5, PM10, NO₂, CO for all zones |
| **API rate limited / offline** | Backend `try/except` falls back to synthetic data with realistic noise and traffic pattern simulation |
| **Frontend cannot reach backend** | Warning banner appears at top: *"Network disconnected. Displaying cached simulation data."* |

The system is designed so that the prototype **always shows data** — it never crashes or shows empty states in a demo environment.

---

## 🧪 Quick Demo Script (5 minutes)

1. **Open the dashboard** → Select **Delhi** → Point out the premium aqicn-style UI and the red alert banner.
2. **Navigate to Predictions** → Move the slider to **90 days** → Show the seasonal shift in forecast.
3. **Use the Exact Date Picker** → Select a date in the future (e.g. next Winter) → Point out the hazardous prediction.
4. **Go to Emergency** → Click **Force Spike** → The automated system triggers; click **Generate Action Plan** to show ML-driven mitigation.
5. **Show My Air Story** → Highlight the cigarette-equivalent tracker for a "human" angle.
6. **Govt. Planning** → Drag an Industrial zone onto the map and show the localized AQI spike.
7. **Back to Dashboard** → Click **Export PDF** → Wait 2 seconds → Show the full 2-page executive report.

**Total: ~5 minutes, zero manual input required after city selection.**

---

## ⚡ Performance Notes

- **Initial load:** Backend cold starts on Render free tier may take ~15 seconds; loading spinner shown
- **Data refresh:** 30-second polling interval (balanced between freshness and API rate limits)
- **ML prediction:** First prediction per city triggers training (~0.5s) then is cached
- **PDF export:** ~2 second pipeline (chart render → canvas capture → PDF write → download)

---

## 🏆 Hackathon Highlights

| Category | What we built |
|----------|--------------|
| **Real-world data** | Live Open-Meteo API integration — not just hardcoded mock data |
| **Machine learning** | Seasonal LinearRegression model with explainable outputs |
| **Emergency response UX** | Real-time event simulation with geospatial mapping |
| **Policy intelligence** | Rule-based suggestion engine tied to live pollutant factors |
| **Export & reporting** | One-click PDF executive report — production-grade output |
| **Resilience** | Double-layered fallback (API → synthetic) ensures graceful degradation |
| **Multi-city support** | 5 cities × 4 zones = 20 monitoring stations in one platform |
