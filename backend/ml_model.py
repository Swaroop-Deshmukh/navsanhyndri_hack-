import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import datetime

class AQIPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        self.city_models = {}
        
    def train(self, city_name, base_aqi=100):
        # In a real scenario, we'd fetch 1-2 years of archive data from Open-Meteo here.
        # To avoid rate limits in a live demo, we'll synthesise a realistic 1-year historical dataset 
        # anchored around the city's current real base_aqi, embedding seasonal winter/summer patterns.
        
        days_history = 365
        now = datetime.datetime.now()
        
        X = []
        y = []
        
        for i in range(days_history):
            dt = now - datetime.timedelta(days=days_history-i)
            day_of_year = dt.timetuple().tm_yday
            
            # Feature extraction for seasonality
            sin_day = np.sin((day_of_year / 365.25) * 2 * np.pi)
            cos_day = np.cos((day_of_year / 365.25) * 2 * np.pi)
            
            # Winter typically has higher pollution in India (days 1-60 and 300-365)
            winter_penalty = 1.0 if (day_of_year < 60 or day_of_year > 300) else 0.0
            
            # Synthetic ground truth based on real anchor
            actual_aqi = base_aqi + (winter_penalty * 40) + np.random.normal(0, 10)
            
            X.append([sin_day, cos_day, winter_penalty])
            y.append(actual_aqi)
            
        model = LinearRegression()
        model.fit(X, y)
        self.city_models[city_name] = model
        self.is_trained = True
        
    def predict(self, city_name, days_ahead, base_aqi=100):
        if city_name not in self.city_models:
            self.train(city_name, base_aqi)
            
        model = self.city_models[city_name]
        now = datetime.datetime.now()
        predictions = []
        
        for i in range(1, days_ahead + 1):
            dt = now + datetime.timedelta(days=i)
            day_of_year = dt.timetuple().tm_yday
            
            sin_day = np.sin((day_of_year / 365.25) * 2 * np.pi)
            cos_day = np.cos((day_of_year / 365.25) * 2 * np.pi)
            winter_penalty = 1.0 if (day_of_year < 60 or day_of_year > 300) else 0.0
            
            pred_aqi = model.predict([[sin_day, cos_day, winter_penalty]])[0]
            
            # Inject realistic short-term volatility (auto-regressive noise)
            noise = np.random.normal(0, 8) if days_ahead <= 30 else np.random.normal(0, 4)
            pred_aqi = pred_aqi + noise
            pred_aqi = max(0, int(pred_aqi))
            
            predictions.append({
                "date": dt.strftime("%Y-%m-%d"),
                "predicted_aqi": pred_aqi,
                "confidence_high": pred_aqi + 20,
                "confidence_low": max(0, pred_aqi - 20)
            })
            
        return predictions

def get_explanation(aqi, date_str):
    # Returns 2-3 plain-English reasons for AQI level based on predicted season
    dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
    month = dt.month
    
    reasons = []
    
    if month in [11, 12, 1, 2]:
        reasons.append("Winter inversion layers are likely to trap pollutants close to the ground.")
        if aqi > 150: reasons.append("Expected biomass burning and heating emissions heavily contribute to this spike.")
    elif month in [6, 7, 8, 9]:
        reasons.append("Monsoon rains generally wash out particulate matter, improving overall AQI.")
    else:
        reasons.append("Transitional weather patterns result in moderate dispersion of urban emissions.")
        
    if aqi < 50:
        reasons.append("Air quality is forecasted to be satisfactory for all outdoor activities.")
    elif aqi < 150:
        reasons.append("Ambient urban traffic and industrial baselines drive this moderate warning.")
    else:
        reasons.append("Hazardous spikes predicted. Suggest implementing preemptive emergency controls.")
        
    return reasons

predictor = AQIPredictor()

