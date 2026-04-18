import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useOutletContext } from 'react-router-dom';

export default function PollutantChart() {
  const { historyData } = useOutletContext();
  const loading = !historyData;

  const data = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    const timeGroups = {};
    historyData.forEach(d => {
      const key = d.timestamp;
      if (!timeGroups[key]) {
        timeGroups[key] = { timestamp: key, count: 0, aqi: 0, pm25: 0, pm10: 0, no2: 0 };
      }
      timeGroups[key].count++;
      timeGroups[key].aqi   += d.aqi;
      timeGroups[key].pm25  += d.pm25;
      timeGroups[key].pm10  += d.pm10;
      timeGroups[key].no2   += d.no2;
    });
    return Object.values(timeGroups)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(g => ({
        time:     new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        AQI:      Math.round(g.aqi   / g.count),
        'PM2.5':  Math.round((g.pm25 / g.count) * 10) / 10,
        PM10:     Math.round((g.pm10 / g.count) * 10) / 10,
        NO2:      Math.round((g.no2  / g.count) * 10) / 10,
      }));
  }, [historyData]);

  return (
    <div className="bg-[#1e293b] shadow-xl rounded-[32px] flex flex-col h-full w-full border border-white/5 p-6 relative">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest">Telemetry History</h3>
          <p className="text-xs text-gray-400 font-medium">Real-time aggregate trends</p>
        </div>
        <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Last 24 Hours</span>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 font-medium text-sm text-center px-4 tracking-wide">No historical data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} minTickGap={30} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', padding: '12px 16px' }}
                itemStyle={{ fontSize: 13, fontWeight: '600' }}
                labelStyle={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="AQI"    stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="PM2.5"  stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="PM10"   stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="NO2"    stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
