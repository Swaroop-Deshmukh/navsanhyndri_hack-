# 🌍 Urban Air Quality Dashboard

> A real-time Smart City Air Quality Monitoring system built for **Smart City Hackathon 2025**, powered by AI-driven predictions and interactive simulations.

---

## 🚀 Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | React + Vite + Tailwind CSS + shadcn/ui            |
| Charts     | Recharts                                           |
| Maps       | react-leaflet + leaflet.heat                       |
| Backend    | FastAPI (Python)                                   |
| ML Model   | scikit-learn (LinearRegression)                    |
| Data       | Mock/Simulated sensor data (no external APIs)      |

---

## 📸 Screenshots

> *(Place your screenshots in `/docs/screenshots/` and link them here)*

| Dashboard Overview | Heatmap & Predictions |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Predictions](docs/screenshots/predictions.png) |

---

## 📁 Project Structure

```
navsanhyndri_hack/
├── backend/            # FastAPI Python backend
│   ├── main.py         # Route definitions (5 endpoints)
│   ├── mock_data.py    # Sensor data generator with noise
│   ├── ml_model.py     # LinearRegression AQI predictor
│   ├── requirements.txt
│   └── render.yaml     # Render.com deployment config
│
└── frontend/           # React Vite SPA
    ├── src/
    │   ├── api.js              # Axios API layer
    │   ├── App.jsx             # Layout shell & data orchestrator
    │   └── components/
    │       ├── AQICards.jsx          # Metric cards for AQI/PM2.5/etc
    │       ├── AlertBanner.jsx       # Dynamic pollution severity banner
    │       ├── AQIMap.jsx            # Leaflet heatmap + zone markers
    │       ├── PollutantChart.jsx    # 24h trend line chart
    │       ├── PredictionGraph.jsx   # 48h ML forecast + confidence band
    │       ├── ExplainabilityCard.jsx # AI insight bullet points
    │       ├── WhatIfSimulator.jsx   # Client-side AQI slider model
    │       └── EmergencySimulator.jsx # POST /api/simulate with minimap
    ├── .env.example     # Environment variable template
    └── vercel.json      # Vercel SPA deployment config
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API Docs (Swagger): `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌐 API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/current`        | Current AQI for all 5 city zones     |
| GET    | `/api/history?hours=N`| Historical AQI time-series           |
| GET    | `/api/heatmap`        | Lat/lng grid with AQI intensity      |
| GET    | `/api/predict?hours=N`| ML forecast with confidence interval |
| POST   | `/api/simulate`       | Simulate emergency events            |

---

## 🚀 Deployment

### Frontend → Vercel
1. Import the `/frontend` folder to Vercel
2. Set env var: `VITE_API_URL=<your-backend-url>`

### Backend → Render.com
- `render.yaml` is already configured in `/backend`
- Connect your repo and Render will auto-detect the config

---

## 🤖 ML Model

- Trains on **72 hours** of synthetic historical AQI data
- Features: `sin(hour)`, `cos(hour)`, `traffic_flag`
- Algorithm: `LinearRegression` (scikit-learn)
- Confidence interval: `predicted ± 15` AQI points
- Plain-English explanations generated per AQI level

---

## 🏆 Built for

**Quatam Arena Hackathon 2026** | Powered by CENTRAL GOVERNMENT
