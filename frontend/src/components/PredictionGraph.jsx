import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { getPredictionData } from "../api";
import { Loader2 } from "lucide-react";
import { useOutletContext } from 'react-router-dom';

export default function PredictionGraph() {
  const { selectedCity } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastPeriod, setForecastPeriod] = useState(60); 
  const [finalAqi, setFinalAqi] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getPredictionData(selectedCity, forecastPeriod)
      .then(res => {
        if (!isMounted) return;
        const formatted = res.predictions.map(p => {
          const dateObj = new Date(p.date || p.timestamp);
          return {
            time: forecastPeriod <= 30 
              ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
              : dateObj.toLocaleDateString([], { month: 'short', year: 'numeric' }),
            PredictedAQI: p.predicted_aqi,
            ConfHigh: p.confidence_high,
            ConfLow: p.confidence_low,
          };
        });
        
        if (formatted.length > 0) {
            setFinalAqi(formatted[formatted.length - 1].PredictedAQI);
        }

        // Aggregate by month for longer horizons to keep chart readable
        if (forecastPeriod > 90) {
           const monthly = {};
           formatted.forEach(f => {
              if (!monthly[f.time]) monthly[f.time] = { time: f.time, PredictedAQI: 0, ConfHigh: 0, ConfLow: 0, count: 0 };
              monthly[f.time].PredictedAQI += f.PredictedAQI;
              monthly[f.time].ConfHigh += f.ConfHigh;
              monthly[f.time].ConfLow += f.ConfLow;
              monthly[f.time].count += 1;
           });
           const aggregated = Object.values(monthly).map(m => ({
               time: m.time,
               PredictedAQI: Math.round(m.PredictedAQI / m.count),
               ConfHigh: Math.round(m.ConfHigh / m.count),
               ConfLow: Math.round(m.ConfLow / m.count)
           }));
           setData(aggregated);
        } else {
           setData(formatted);
        }
      })
      .catch(err => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [selectedCity, forecastPeriod]);

  return (
    <div className="bg-[#1e293b] shadow-xl rounded-[32px] flex flex-col h-full w-full border border-white/5 p-6 relative">
      <div className="mb-6 flex flex-wrap justify-between items-center border-b border-white/10 pb-4 gap-4">
        <div>
          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest">{forecastPeriod}-Day Horizon</h3>
          <p className="text-xs text-gray-400 font-medium">Auto-Regressive Forecasting Model</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full max-w-[300px]">
           <div className="flex justify-between w-full text-xs font-bold text-gray-400 mb-1">
              <span>1 Day</span>
              <span className="text-indigo-400">{forecastPeriod} Days</span>
              <span>1 Year</span>
           </div>
           <input 
             type="range" 
             min="1" max="365" 
             value={forecastPeriod} 
             onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
             className="w-full accent-indigo-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
           />
           {finalAqi !== null && (
             <div className="text-xs font-bold text-gray-300 mt-1 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                Exact Count after {forecastPeriod} days: <span className="text-[14px] text-white font-black">{finalAqi} AQI</span>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm font-semibold">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#fde68a" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} minTickGap={40} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', padding: '12px 16px' }}
                itemStyle={{ fontSize: 13, fontWeight: '600' }}
                labelStyle={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value, name) => {
                  if (name === 'ConfHigh') return [value, 'Upper Bound'];
                  if (name === 'ConfLow')  return [value, 'Lower Bound'];
                  return [value, 'Predicted AQI'];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }} iconType="circle" />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4"
                label={{ position: 'insideTopLeft', value: 'Moderate Risk', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="4 4"
                label={{ position: 'insideTopLeft', value: 'High Risk', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
              
              {/* Upper band */}
              <Area type="monotone" dataKey="ConfHigh" stroke="none" strokeWidth={0}
                fill="url(#confGrad)" fillOpacity={1} dot={false} legendType="none" />
              {/* Lower band cutoff strictly colored solid dark bg */}
              <Area type="monotone" dataKey="ConfLow" stroke="none" strokeWidth={0}
                fill="#1e293b" fillOpacity={1} dot={false} legendType="none" />
              {/* Main signal */}
              <Area type="monotone" dataKey="PredictedAQI" stroke="#f59e0b" strokeWidth={3}
                fill="url(#aqiGrad)" fillOpacity={1} dot={false} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
