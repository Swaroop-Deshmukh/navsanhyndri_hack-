from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from mock_data import get_current_mock_data, get_historical_data, get_heatmap_data
from ml_model import predictor, get_explanation

app = FastAPI(title="Smart City AQI API")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    event_type: str

@app.get("/api/current")
def get_current():
    return {"data": get_current_mock_data()}

@app.get("/api/history")
def get_history(hours: int = 24):
    return {"data": get_historical_data(hours)}

@app.get("/api/heatmap")
def get_heatmap():
    return {"data": get_heatmap_data()}

@app.get("/api/predict")
def predict_aqi(hours: int = 48):
    predictions = predictor.predict(hours)
    
    explanation = None
    if predictions:
        explanation = get_explanation(predictions[0]["predicted_aqi"])
        
    return {
        "predictions": predictions,
        "explanation": explanation
    }

@app.post("/api/simulate")
def simulate_event(req: SimulationRequest):
    event_type = req.event_type
    
    if event_type == "factory_leak":
        return {
            "aqi_spike": 130,
            "affected_radius_km": 5.0,
            "recommendation": "Evacuate workers within 1km. Advise residents within 5km to stay indoors."
        }
    elif event_type == "wildfire":
        return {
            "aqi_spike": 300,
            "affected_radius_km": 25.0,
            "recommendation": "Hazardous smoke in the area. Issue N95 masks to all field personnel and halt outdoor labor."
        }
    elif event_type == "traffic_jam":
        return {
            "aqi_spike": 60,
            "affected_radius_km": 2.5,
            "recommendation": "High NO2 emissions detected. Reroute non-essential traffic away from the jam corridor."
        }
    else:
        return {
            "aqi_spike": 0,
            "affected_radius_km": 0,
            "recommendation": "Unknown simulation event. No immediate action required."
        }
