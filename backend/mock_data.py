import numpy as np
import datetime

ZONES = [
    {"zone_id": 1, "zone_name": "Industrial Zone", "lat": 19.085, "lng": 72.890, "base_aqi": 120},
    {"zone_id": 2, "zone_name": "City Center", "lat": 19.070, "lng": 72.870, "base_aqi": 90},
    {"zone_id": 3, "zone_name": "Suburbs", "lat": 19.100, "lng": 72.850, "base_aqi": 60},
    {"zone_id": 4, "zone_name": "Green Zone", "lat": 19.120, "lng": 72.900, "base_aqi": 35},
    {"zone_id": 5, "zone_name": "Highway Corridor", "lat": 19.060, "lng": 72.885, "base_aqi": 110},
]

def get_aqi_status(aqi):
    if aqi < 50:
        return "Good"
    elif aqi < 100:
        return "Moderate"
    elif aqi < 150:
        return "Unhealthy"
    elif aqi < 200:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def calculate_pollutants(base_aqi, current_hour):
    # Traffic factor increases pollution at hours 8-10am and 5-8pm (17-20)
    traffic_factor = 1.0
    if 8 <= current_hour <= 10 or 17 <= current_hour <= 20:
        traffic_factor = 1.3
    
    # Add random variation using numpy to simulate sensor noise
    noise = np.random.normal(0, 5)
    
    aqi = int(base_aqi * traffic_factor + noise)
    aqi = max(0, aqi)
    
    # Generate other pollutants based loosely on AQI severity
    pm25 = round(aqi * 0.4 + np.random.normal(0, 2), 1)
    pm10 = round(aqi * 0.8 + np.random.normal(0, 3), 1)
    no2 = round(aqi * 0.3 + np.random.normal(0, 1), 1)
    co = round(aqi * 0.05 + np.random.normal(0, 0.5), 2)
    
    return {
        "aqi": aqi,
        "pm25": max(0, pm25),
        "pm10": max(0, pm10),
        "no2": max(0, no2),
        "co": max(0, co),
        "status": get_aqi_status(aqi)
    }

def get_current_mock_data():
    current_hour = datetime.datetime.now().hour
    data = []
    for zone in ZONES:
        pollutants = calculate_pollutants(zone["base_aqi"], current_hour)
        zone_data = {
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "lat": zone["lat"],
            "lng": zone["lng"],
            **pollutants
        }
        data.append(zone_data)
    return data

def get_historical_data(hours=24):
    now = datetime.datetime.now()
    history = []
    
    for i in range(hours):
        dt = now - datetime.timedelta(hours=hours-i)
        for zone in ZONES:
            # Daily sine wave pattern offset by basic noise
            time_of_day_effect = np.sin((dt.hour / 24) * 2 * np.pi) * 15 
            base_aqi = zone["base_aqi"] + time_of_day_effect
            
            pollutants = calculate_pollutants(base_aqi, dt.hour)
            history.append({
                "timestamp": dt.isoformat(),
                "zone_id": zone["zone_id"],
                "zone_name": zone["zone_name"],
                **pollutants
            })
    return history

def get_heatmap_data():
    points = []
    center_lat, center_lng = 19.07, 72.87
    
    for _ in range(150):
        dlat = np.random.uniform(-0.08, 0.08)
        dlng = np.random.uniform(-0.08, 0.08)
        
        aqi = int(np.random.normal(100, 40))
        aqi = max(10, min(300, aqi))
        
        points.append({
            "lat": round(center_lat + dlat, 5),
            "lng": round(center_lng + dlng, 5),
            "aqi": aqi
        })
    return points
