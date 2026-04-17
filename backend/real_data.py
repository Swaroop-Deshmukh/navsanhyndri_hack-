import requests
import datetime
import numpy as np

CITIES = {
    "Pune": {"lat": 18.5204, "lng": 73.8567, "zones": [
        {"id": 1, "name": "Swargate", "lat": 18.5018, "lng": 73.8636},
        {"id": 2, "name": "Hinjewadi", "lat": 18.5913, "lng": 73.7389},
        {"id": 3, "name": "Kothrud", "lat": 18.5074, "lng": 73.8077},
        {"id": 4, "name": "Viman Nagar", "lat": 18.5679, "lng": 73.9143}
    ]},
    "Mumbai": {"lat": 19.0760, "lng": 72.8777, "zones": [
        {"id": 5, "name": "Bandra", "lat": 19.0596, "lng": 72.8295},
        {"id": 6, "name": "Andheri", "lat": 19.1136, "lng": 72.8697},
        {"id": 7, "name": "Dharavi", "lat": 19.0380, "lng": 72.8538},
        {"id": 8, "name": "Powai", "lat": 19.1176, "lng": 72.9060}
    ]},
    "Delhi": {"lat": 28.7041, "lng": 77.1025, "zones": [
        {"id": 9, "name": "Connaught Place", "lat": 28.6315, "lng": 77.2167},
        {"id": 10, "name": "Chandni Chowk", "lat": 28.6505, "lng": 77.2303},
        {"id": 11, "name": "Dwarka", "lat": 28.5823, "lng": 77.0500},
        {"id": 12, "name": "Okhla", "lat": 28.5222, "lng": 77.2806}
    ]},
    "Bengaluru": {"lat": 12.9716, "lng": 77.5946, "zones": [
        {"id": 13, "name": "Koramangala", "lat": 12.9279, "lng": 77.6271},
        {"id": 14, "name": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
        {"id": 15, "name": "Whitefield", "lat": 12.9698, "lng": 77.7499},
        {"id": 16, "name": "Jayanagar", "lat": 12.9299, "lng": 77.5824}
    ]},
    "Chennai": {"lat": 13.0827, "lng": 80.2707, "zones": [
        {"id": 17, "name": "T Nagar", "lat": 13.0418, "lng": 80.2341},
        {"id": 18, "name": "Adyar", "lat": 13.0012, "lng": 80.2565},
        {"id": 19, "name": "Velachery", "lat": 12.9815, "lng": 80.2180},
        {"id": 20, "name": "Anna Nagar", "lat": 13.0850, "lng": 80.2101}
    ]}
}

def get_aqi_status(aqi):
    if aqi < 50: return "Good"
    elif aqi < 100: return "Moderate"
    elif aqi < 150: return "Unhealthy"
    elif aqi < 200: return "Very Unhealthy"
    else: return "Hazardous"

def _synthetic_factors_from_aqi(aqi_val):
    # Depending on AQI, breakdown the contributing factors
    if aqi_val > 150:
        return {"vehicle_contribution": 45, "factory": 35, "dust": 15, "other": 5}
    elif aqi_val > 100:
        return {"vehicle_contribution": 55, "factory": 20, "dust": 15, "other": 10}
    else:
        return {"vehicle_contribution": 40, "factory": 15, "dust": 30, "other": 15}

def get_current_real_data(city_name="Pune", zone_name=None):
    if city_name not in CITIES:
        city_name = "Pune"
        
    zones = CITIES[city_name]["zones"]
    if zone_name:
        zones = [z for z in zones if z["name"].lower() == zone_name.lower()]
        if not zones: zones = CITIES[city_name]["zones"]

    results = []
    # Make API calls for each zone. Open-meteo can take multiple coordinates, but for simplicity we iterate.
    # Alternatively, pass multiple lats/lngs.
    lats = [str(z["lat"]) for z in zones]
    lngs = [str(z["lng"]) for z in zones]
    
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={','.join(lats)}&longitude={','.join(lngs)}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        # If multiple locations queried, open-meteo returns a list. If 1, it returns a dict.
        if isinstance(data, dict) and "current" in data:
            data_list = [data]
        else:
            data_list = data
            
        for i, z in enumerate(zones):
            loc_data = data_list[i]["current"]
            aqi = loc_data.get("european_aqi", 50)
            if aqi is None: aqi = 50 # Fallback
            
            factors = _synthetic_factors_from_aqi(aqi)
            
            results.append({
                "zone_id": z["id"],
                "zone_name": z["name"],
                "lat": z["lat"],
                "lng": z["lng"],
                "aqi": int(aqi),
                "pm25": loc_data.get("pm2_5", 15.0),
                "pm10": loc_data.get("pm10", 30.0),
                "no2": loc_data.get("nitrogen_dioxide", 20.0),
                "co": loc_data.get("carbon_monoxide", 300.0) / 1000.0, # convert to mg/m3 approx
                "status": get_aqi_status(int(aqi)),
                "factors": factors
            })
            
    except Exception as e:
        print("Error fetching real data", e)
        # Fallback to simulated if offline
        for z in zones:
            results.append({
                "zone_id": z["id"], "zone_name": z["name"], "lat": z["lat"], "lng": z["lng"],
                "aqi": 100, "pm25": 45.0, "pm10": 80.0, "no2": 35.0, "co": 1.5,
                "status": "Moderate", "factors": {"vehicle_contribution": 50, "factory": 20, "dust": 20, "other": 10}
            })
            
    return results

def get_historical_real_data(city_name="Pune", hours=24):
    city = CITIES.get(city_name, CITIES["Pune"])
    # Just fetch for the city center for historical overview to save API load
    lat = city["lat"]
    lng = city["lng"]
    
    past_days = max(1, hours // 24 + 1)
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lng}&hourly=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide&past_days={past_days}"
    
    history = []
    try:
        res = requests.get(url).json()
        hourly = res["hourly"]
        times = hourly["time"]
        
        # We only want the last `hours` elements up to current time
        cutoff_idx = len(times) - 1
        start_idx = max(0, cutoff_idx - hours)
        
        for i in range(start_idx, cutoff_idx):
            aqi = hourly["european_aqi"][i]
            if aqi is None: aqi = 50
            history.append({
                "timestamp": times[i],
                "aqi": int(aqi),
                "pm25": hourly["pm2_5"][i] if hourly["pm2_5"][i] is not None else 15,
                "pm10": hourly["pm10"][i] if hourly["pm10"][i] is not None else 30,
                "no2": hourly["nitrogen_dioxide"][i] if hourly["nitrogen_dioxide"][i] is not None else 20,
            })
    except Exception as e:
        print("Error fetching historical", e)
        
    return history

def get_heatmap_real_data(city_name="Pune"):
    city = CITIES.get(city_name, CITIES["Pune"])
    center_lat, center_lng = city["lat"], city["lng"]
    points = []
    
    # We generate a realistic spread around the city center using a base AQI since we can't query 150 points live easily
    base_aqi = 100
    try:
        url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={center_lat}&longitude={center_lng}&current=european_aqi"
        data = requests.get(url, timeout=5).json()
        base_aqi = data.get("current", {}).get("european_aqi", 100)
        if base_aqi is None: base_aqi = 100
    except:
        pass
        
    for _ in range(150):
        dlat = np.random.uniform(-0.08, 0.08)
        dlng = np.random.uniform(-0.08, 0.08)
        
        aqi = int(np.random.normal(base_aqi, base_aqi * 0.2))
        aqi = max(10, min(300, aqi))
        
        points.append({
            "lat": round(center_lat + dlat, 5),
            "lng": round(center_lng + dlng, 5),
            "aqi": aqi
        })
    return points
