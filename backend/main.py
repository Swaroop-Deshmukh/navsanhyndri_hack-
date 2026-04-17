from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from real_data import get_current_real_data, get_historical_real_data, get_heatmap_real_data, CITIES
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
    city: str = "Pune"
    zone: Optional[str] = None

@app.get("/api/cities")
def get_cities():
    # Return available cities and their zones
    data = []
    for city_name, info in CITIES.items():
        data.append({
            "name": city_name,
            "zones": [z["name"] for z in info["zones"]]
        })
    return {"data": data}

@app.get("/api/current")
def get_current(city: str = "Pune", zone: Optional[str] = None):
    return {"data": get_current_real_data(city, zone)}

@app.get("/api/history")
def get_history(city: str = "Pune", hours: int = 24):
    return {"data": get_historical_real_data(city, hours)}

@app.get("/api/heatmap")
def get_heatmap(city: str = "Pune"):
    return {"data": get_heatmap_real_data(city)}

@app.get("/api/predict")
def predict_aqi(city: str = "Pune", days: int = 10):
    # Get current base aqi for the city to anchor the prediction
    current_data = get_current_real_data(city_name=city)
    base_aqi = 100
    if current_data:
        base_aqi = current_data[0]["aqi"]
        
    predictions = predictor.predict(city, days, base_aqi)
    
    # We provide explainability for the final forecasted day
    explanation = None
    if predictions:
        final_day = predictions[-1]
        explanation = get_explanation(final_day["predicted_aqi"], final_day["date"])
        
    return {
        "predictions": predictions,
        "explanation": explanation
    }

@app.post("/api/simulate")
def simulate_event(req: SimulationRequest):
    event_type = req.event_type
    
    if event_type == "factory_leak":
        return {
            "aqi_spike": 180,
            "affected_radius_km": 5.0,
            "recommendation": f"Evacuate workers within 1km in {req.city}. Advise residents to stay indoors."
        }
    elif event_type == "wildfire":
        return {
            "aqi_spike": 300,
            "affected_radius_km": 25.0,
            "recommendation": f"Hazardous smoke overlapping {req.zone or req.city}. Issue N95 masks."
        }
    elif event_type == "traffic_jam":
        return {
            "aqi_spike": 80,
            "affected_radius_km": 2.5,
            "recommendation": f"High NO2 around {req.zone or req.city} corridor. Reroute non-essential traffic."
        }
    else:
        return {
            "aqi_spike": 0,
            "affected_radius_km": 0,
            "recommendation": "Unknown simulation event. No immediate action required."
        }

@app.get("/api/suggestions")
def get_suggestions(city: str = "Pune", zone: Optional[str] = None):
    # In a fully fleshed out AI app, we'd pass factors to an LLM.
    # Here we simulate the suggestion engine based on current real-world factors of the selected zone.
    current_data = get_current_real_data(city, zone)
    if not current_data:
        return {"suggestions": []}
        
    factor_data = current_data[0].get("factors", {})
    suggestions = []
    
    if factor_data.get("vehicle_contribution", 0) > 40:
        suggestions.append({
            "target": "Vehicular Emissions",
            "action": "Implement odd-even license plate rule during peak hours (08:00 - 11:00 AM).",
            "impact_estimate": "15% reduction in PM2.5 within 3 days."
        })
    if factor_data.get("factory", 0) > 25:
        suggestions.append({
            "target": "Industrial Output",
            "action": "Mandate temporary suspension of non-essential heavy industry within 5km radius.",
            "impact_estimate": "Immediate 20% drop in localized PM10."
        })
    if factor_data.get("dust", 0) > 20:
        suggestions.append({
            "target": "Construction Dust",
            "action": "Deploy anti-smog guns and halt major construction activities temporarily.",
            "impact_estimate": "Immediate 10% reduction in coarse particulates."
        })
        
    if not suggestions:
        suggestions.append({
            "target": "General Maintenance",
            "action": "Maintain current green corridor protocols and continue monitoring.",
            "impact_estimate": "Stable AQI over the next 48 hours."
        })
        
    return {"suggestions": suggestions}
