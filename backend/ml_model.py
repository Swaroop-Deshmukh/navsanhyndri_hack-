import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import datetime

class AQIPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        
    def train(self):
        # Trains on 72 hours of synthetic historical AQI with daily sine wave pattern
        hours = 72
        now = datetime.datetime.now()
        
        X = []
        y = []
        
        for i in range(hours):
            dt = now - datetime.timedelta(hours=hours-i)
            hour = dt.hour
            
            # Feature extraction for time
            sin_hour = np.sin((hour / 24) * 2 * np.pi)
            cos_hour = np.cos((hour / 24) * 2 * np.pi)
            traffic = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
            
            base_aqi = 85
            # Synthetic ground truth
            actual_aqi = base_aqi + sin_hour * 20 + traffic * 25 + np.random.normal(0, 5)
            
            X.append([sin_hour, cos_hour, traffic])
            y.append(actual_aqi)
            
        self.model.fit(X, y)
        self.is_trained = True
        
    def predict(self, hours_ahead):
        if not self.is_trained:
            self.train()
            
        now = datetime.datetime.now()
        predictions = []
        
        for i in range(1, hours_ahead + 1):
            dt = now + datetime.timedelta(hours=i)
            hour = dt.hour
            
            sin_hour = np.sin((hour / 24) * 2 * np.pi)
            cos_hour = np.cos((hour / 24) * 2 * np.pi)
            traffic = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
            
            pred_aqi = self.model.predict([[sin_hour, cos_hour, traffic]])[0]
            pred_aqi = max(0, int(pred_aqi))
            
            predictions.append({
                "timestamp": dt.isoformat(),
                "predicted_aqi": pred_aqi,
                "confidence_high": pred_aqi + 15,
                "confidence_low": max(0, pred_aqi - 15)
            })
            
        return predictions

def get_explanation(aqi):
    # Returns 2-3 plain-English reasons for AQI level
    if aqi < 50:
        return [
            "Air quality is satisfactory and air pollution poses little or no risk.",
            "Great time to enjoy outdoor activities.",
            "Weather patterns and low traffic are keeping the air clear."
        ]
    elif aqi < 100:
        return [
            "Air quality is acceptable, but there may be a moderate health concern for some people.",
            "Consider reducing prolonged or heavy outdoor exertion.",
            "Normal urban emissions are present in the air."
        ]
    elif aqi < 150:
        return [
            "Members of sensitive groups may experience mild health effects.",
            "Traffic congestion and stable weather patterns are trapping pollutants.",
            "The general public should not experience significant effects yet."
        ]
    elif aqi < 200:
        return [
            "Everyone may begin to experience health effects.",
            "High concentration of localized and transient emissions.",
            "Avoid prolonged outdoor exertion, opt for indoor exercises."
        ]
    else:
        return [
            "Health alert: everyone may experience more serious health effects.",
            "Severe accumulation of pollutants likely due to industrial activity or fires.",
            "Stay indoors with filtered air if possible and avoid any outdoor exertion."
        ]

predictor = AQIPredictor()
