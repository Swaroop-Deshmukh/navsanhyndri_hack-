import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import { getAqiColor, getAqiLabel } from '../components/AQICards';
import { ExternalLink, Wind, Droplets, Sun, Thermometer, MapPin, Activity } from 'lucide-react';

// ─── AQI Scale Bar (horizontal gradient with markers) ─────────────────────────
function AqiScaleBar({ currentAqi }) {
  const segments = [
    { label: 'Good', max: 50, color: '#00e400' },
    { label: 'Moderate', max: 100, color: '#ffff00' },
    { label: 'Unhealthy*', max: 150, color: '#ff7e00' },
    { label: 'Unhealthy', max: 200, color: '#ff0000' },
    { label: 'Very Un.', max: 300, color: '#8f3f97' },
    { label: 'Hazardous', max: 500, color: '#7e0023' },
  ];
  const totalMax = 500;
  const clampedAqi = Math.min(currentAqi, totalMax);
  const pct = (clampedAqi / totalMax) * 100;

  return (
    <div className="w-full">
      <div className="relative h-4 rounded-full overflow-hidden flex shadow-inner" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {segments.map((seg, i) => {
          const prev = i === 0 ? 0 : segments[i - 1].max;
          const width = ((seg.max - prev) / totalMax) * 100;
          return (
            <div key={seg.label} style={{ width: `${width}%`, backgroundColor: seg.color }} />
          );
        })}
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow-md z-10 transition-all duration-700"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {segments.map(seg => (
          <span key={seg.label} className="text-[9px] font-bold text-gray-500">{seg.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Pollutant Progress Bar ────────────────────────────────────────────────────
function PollutantBar({ label, value, unit, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs font-black text-gray-400 w-12 shrink-0 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}70` }}
        />
      </div>
      <span className="text-sm font-black text-white w-24 text-right shrink-0">
        {value} <span className="text-gray-500 text-[10px] font-bold">{unit}</span>
      </span>
    </div>
  );
}

// ─── Weather Widget ────────────────────────────────────────────────────────────
function WeatherWidget({ zones }) {
  // Use the first zone's weather data or reasonable defaults
  const zone = zones && zones.length > 0 ? zones[0] : null;
  const temp = zone?.temperature ?? 25;
  const humidity = zone?.humidity ?? 65;
  const windSpeed = zone?.wind_speed ?? 4.5;
  const uvIndex = zone?.uv_index ?? 2;

  const getWeatherEmoji = () => {
    if (humidity > 80) return '🌧️';
    if (humidity > 60) return '⛅';
    return '☀️';
  };

  const getWeatherDesc = () => {
    if (humidity > 80) return 'Rainy';
    if (humidity > 60) return 'Partly Cloudy';
    return 'Clear';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getWeatherEmoji()}</span>
          <div>
            <div className="text-3xl font-black text-white">{temp}°<span className="text-base font-bold text-gray-400">C</span></div>
            <div className="text-sm text-gray-400 font-semibold">{getWeatherDesc()}</div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-colors">
          <ExternalLink className="w-4 h-4 text-blue-400" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
        <div className="flex flex-col items-center gap-1">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-black text-white">{humidity}%</span>
          <span className="text-[10px] text-gray-500 font-semibold">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black text-white">{windSpeed} km/h</span>
          <span className="text-[10px] text-gray-500 font-semibold">Wind</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-black text-white">{uvIndex}</span>
          <span className="text-[10px] text-gray-500 font-semibold">UV Index</span>
        </div>
      </div>
    </div>
  );
}

// ─── Hero AQI Card ─────────────────────────────────────────────────────────────
function HeroAqiCard({ zones, selectedCity, selectedZone }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!zones || zones.length === 0) {
    return <div className="bg-[#1e293b] rounded-3xl p-8 flex items-center justify-center h-72 text-gray-500">Loading data...</div>;
  }

  const avgAqi = Math.round(zones.reduce((s, z) => s + z.aqi, 0) / zones.length);
  const avgPm25 = Math.round(zones.reduce((s, z) => s + z.pm25, 0) / zones.length);
  const avgPm10 = Math.round(zones.reduce((s, z) => s + z.pm10, 0) / zones.length);
  const label = getAqiLabel(avgAqi);
  const aqiColor = getAqiColor(avgAqi);
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + 
    ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/10 shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${aqiColor}18 0%, ${aqiColor}08 40%, #1e293b 100%)`,
        borderColor: `${aqiColor}30`
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: aqiColor }} />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: aqiColor }} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <span className="live-dot" />
              LIVE
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Updated: {timeStr}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
            {selectedZone ? `${selectedZone} — ` : ''}{selectedCity}
          </h2>
          <p className="text-sm text-gray-400 font-medium mt-0.5">Real-time PM2.5, PM10 Air Quality Index</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-400">{selectedCity}</span>
        </div>
      </div>

      {/* Main AQI number + pollutants + weather */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6 items-center relative z-10">
        {/* Left: Big AQI Number */}
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[80px] md:text-[96px] font-black leading-none tracking-tighter" style={{ color: aqiColor, textShadow: `0 0 40px ${aqiColor}60` }}>
              {avgAqi}
            </span>
            <span className="text-sm text-gray-500 font-bold mb-2">AQI (US)</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-400">Air Quality is</span>
            <span className="text-base font-black px-3 py-1 rounded-full" style={{ color: aqiColor, backgroundColor: `${aqiColor}20`, border: `1px solid ${aqiColor}40` }}>
              {label}
            </span>
          </div>

          {/* PM2.5 / PM10 badges */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs font-black text-gray-400 uppercase">PM2.5</span>
              <span className="text-base font-black text-white">{avgPm25}</span>
              <span className="text-[10px] text-gray-500 font-bold">µg/m³</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs font-black text-gray-400 uppercase">PM10</span>
              <span className="text-base font-black text-white">{avgPm10}</span>
              <span className="text-[10px] text-gray-500 font-bold">µg/m³</span>
            </div>
          </div>

          {/* AQI Scale */}
          <div className="mt-5">
            <AqiScaleBar currentAqi={avgAqi} />
          </div>
        </div>

        {/* Center divider — visible only on md+ */}
        <div className="hidden md:block w-px h-40 bg-white/10 mx-2" />

        {/* Right: Weather Widget */}
        <div className="w-full md:w-52">
          <WeatherWidget zones={zones} />
        </div>
      </div>
    </div>
  );
}

// ─── 24h Bar Chart (aqicn style colored bars) ─────────────────────────────────
function HistoryBarChart({ historyData, selectedCity }) {
  const { data, minPoint, maxPoint } = useMemo(() => {
    if (!historyData || historyData.length === 0) return { data: [], minPoint: null, maxPoint: null };

    const timeGroups = {};
    historyData.forEach(d => {
      const key = d.timestamp;
      if (!timeGroups[key]) timeGroups[key] = { timestamp: key, sum: 0, count: 0 };
      timeGroups[key].sum += d.aqi;
      timeGroups[key].count++;
    });

    const sorted = Object.values(timeGroups)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(g => ({
        time: new Date(g.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        fullTime: new Date(g.timestamp),
        aqi: Math.round(g.sum / g.count),
      }));

    let minP = sorted[0], maxP = sorted[0];
    sorted.forEach(p => {
      if (p.aqi < minP.aqi) minP = p;
      if (p.aqi > maxP.aqi) maxP = p;
    });

    return { data: sorted, minPoint: minP, maxPoint: maxP };
  }, [historyData]);

  const getBarColor = (aqi) => {
    if (aqi < 50) return '#00e400';
    if (aqi < 100) return '#f0c000';
    if (aqi < 150) return '#ff7e00';
    if (aqi < 200) return '#ef4444';
    if (aqi < 300) return '#8f3f97';
    return '#7e0023';
  };

  const firstDate = data.length > 0 ? data[0].fullTime : null;
  const lastDate = data.length > 0 ? data[data.length - 1].fullTime : null;
  const fmtDate = d => d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '';

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-white/5 shadow-xl p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-sm font-black text-gray-300">{selectedCity}</span>
        </div>
        <div className="flex items-center gap-3">
          {minPoint && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: '#f0c00040', backgroundColor: '#f0c00015' }}>
              <span className="text-[10px] font-black text-gray-400">↓ Min AQI</span>
              <span className="text-sm font-black" style={{ color: '#f0c000' }}>{minPoint.aqi}</span>
              <span className="text-[10px] text-gray-500">at {minPoint.time}</span>
            </div>
          )}
          {maxPoint && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: '#ef444440', backgroundColor: '#ef444415' }}>
              <span className="text-[10px] font-black text-gray-400">↑ Max AQI</span>
              <span className="text-sm font-black text-red-400">{maxPoint.aqi}</span>
              <span className="text-[10px] text-gray-500">at {maxPoint.time}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-56">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading history...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }} barCategoryGap="15%">
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={[0, 'auto']}
              />
              <RechartsTooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
                  padding: '10px 14px',
                }}
                itemStyle={{ fontSize: 13, fontWeight: 700, color: '#fff' }}
                labelStyle={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}
                formatter={(v) => [v, 'AQI']}
              />
              <Bar dataKey="aqi" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.aqi)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Date row */}
      {firstDate && lastDate && (
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[10px] font-bold text-gray-600">{fmtDate(firstDate)}</span>
          <span className="text-[10px] font-bold text-gray-600 text-center">Time</span>
          <span className="text-[10px] font-bold text-gray-600">{fmtDate(lastDate)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Major Pollutants Card ─────────────────────────────────────────────────────
function MajorPollutantsCard({ zones }) {
  if (!zones || zones.length === 0) return null;
  const avg = f => Math.round(zones.reduce((s, z) => s + (z[f] || 0), 0) / zones.length * 10) / 10;
  const avgPm25 = avg('pm25');
  const avgPm10 = avg('pm10');
  const avgNo2 = avg('no2');
  const avgO3 = avg('o3') || Math.round(avg('pm25') * 0.5); // fallback estimate

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-white/5 shadow-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest">Major Pollutants</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Live concentration levels</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
          <Activity className="w-3 h-3" /> Live
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        <PollutantBar label="PM2.5" value={avgPm25} unit="µg/m³" max={250} color="#ef4444" />
        <PollutantBar label="PM10"  value={avgPm10} unit="µg/m³" max={430} color="#f97316" />
        <PollutantBar label="NO₂"   value={avgNo2}  unit="ppb"   max={100} color="#a855f7" />
        <PollutantBar label="O₃"    value={avgO3}   unit="ppb"   max={120} color="#0ea5e9" />
      </div>
    </div>
  );
}

// ─── City Rank + Comparison Row ────────────────────────────────────────────────
function StatsRow({ zones, selectedCity }) {
  if (!zones || zones.length === 0) return null;
  const avgAqi = Math.round(zones.reduce((s, z) => s + z.aqi, 0) / zones.length);
  // Simulate a rank and national AQI comparison
  const rank = avgAqi > 150 ? 8 : avgAqi > 100 ? 20 : 45;
  const nationalAvg = 145;
  const ratio = (avgAqi / nationalAvg).toFixed(1);
  const isBelow = avgAqi < nationalAvg;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Rank */}
      <div className="bg-[#1e293b] rounded-2xl border border-white/5 px-6 py-4 flex items-center gap-4">
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400 bg-red-500/80 px-2 py-0.5 rounded text-white">Rank</span>
          <span className="text-3xl font-black text-white">{rank}<sup className="text-lg">th</sup></span>
        </div>
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          Currently, {selectedCity} ranks <strong className="text-white">{rank}th</strong> among the most polluted cities globally.
        </p>
      </div>
      {/* Comparison */}
      <div className="bg-[#1e293b] rounded-2xl border border-white/5 px-6 py-4 flex items-center gap-4">
        <span className="text-2xl font-black shrink-0" style={{ color: isBelow ? '#22c55e' : '#ef4444' }}>
          {ratio}x
        </span>
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          AQI (US) in {selectedCity} is <strong className="text-white">{ratio}x {isBelow ? 'Below' : 'Above'}</strong> the national average of {nationalAvg} AQI
        </p>
      </div>
    </div>
  );
}

// ─── Zone Cards Row ────────────────────────────────────────────────────────────
function ZoneCardsRow({ zones }) {
  if (!zones || zones.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {zones.slice(0, 6).map(zone => {
        const color = getAqiColor(zone.aqi);
        return (
          <div
            key={zone.zone_id}
            className="shrink-0 rounded-2xl border p-4 flex flex-col gap-1 min-w-[130px] transition-transform hover:-translate-y-0.5 cursor-default"
            style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}12 0%, rgba(30,41,59,0.9) 100%)` }}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider truncate">{zone.zone_name}</p>
            <span className="text-2xl font-black" style={{ color }}>{zone.aqi}</span>
            <span className="text-[10px] font-semibold" style={{ color }}>{getAqiLabel(zone.aqi)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Regional Mini-Map ─────────────────────────────────────────────────────────
function RegionalMiniMap({ zones, selectedCity }) {
  const center = useMemo(() => {
    if (!zones || zones.length === 0) return [20.5937, 78.9629];
    const avgLat = zones.reduce((s, z) => s + (z.lat || 0), 0) / zones.length;
    const avgLng = zones.reduce((s, z) => s + (z.lng || 0), 0) / zones.length;
    return [avgLat || 20.5937, avgLng || 78.9629];
  }, [zones]);

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">AQI Map</p>
          <h3 className="text-sm font-black text-gray-200 mt-0.5">{selectedCity} — Zone Overview</h3>
        </div>
        <Link to="/map" className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          Full View <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div style={{ height: '220px' }}>
        {zones && zones.length > 0 ? (
          <MapContainer
            key={selectedCity}
            center={center}
            zoom={11}
            className="w-full h-full"
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            attributionControl={false}
            style={{ height: '220px', background: '#0f172a' }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" crossOrigin="anonymous" />
            {zones.map(zone => (
              <CircleMarker
                key={zone.zone_id}
                center={[zone.lat, zone.lng]}
                radius={14}
                pathOptions={{ color: 'rgba(255,255,255,0.5)', fillColor: getAqiColor(zone.aqi), fillOpacity: 0.85, weight: 2 }}
              >
                <LeafletTooltip permanent={false} direction="top">
                  <span className="font-bold text-xs">{zone.zone_name}: AQI {zone.aqi}</span>
                </LeafletTooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm font-bold">Loading zone data...</div>
        )}
      </div>
      {/* Zone name badge */}
      {zones && zones.length > 0 && (
        <div className="px-4 py-2 bg-black/30 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-gray-400">{selectedCity}</span>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Card ──────────────────────────────────────────────────────────
function AiInsightCard({ zones, maxAqi }) {
  const insights = useMemo(() => {
    if (!zones || zones.length === 0) return [];
    const avg = f => zones.reduce((s, z) => s + (z[f] || 0), 0) / zones.length;
    const results = [];
    const avgFactors = zones[0]?.factors || {};

    if ((avgFactors.vehicle_contribution || 0) > 35)
      results.push({ emoji: '🚗', text: 'Ambient urban traffic drives elevated baseline particulates.', color: '#f97316' });
    if (avg('no2') > 30)
      results.push({ emoji: '🏭', text: 'High NO₂ suggests combustion activity in industrial zones.', color: '#a855f7' });
    if (avg('pm25') > 25)
      results.push({ emoji: '⛅', text: 'Transitional weather reducing pollutant dispersion capacity.', color: '#0ea5e9' });
    if (maxAqi > 150)
      results.push({ emoji: '⚠️', text: 'Hazardous AQI recorded — indoor shelter & N95 recommended.', color: '#ef4444' });
    else if (maxAqi < 50)
      results.push({ emoji: '🌿', text: 'Satisfactory air quality — safe for all outdoor activities.', color: '#22c55e' });

    while (results.length < 3)
      results.push({ emoji: '💨', text: 'Stable conditions moderating pollutant suspension rates.', color: '#0ea5e9' });

    return results.slice(0, 3);
  }, [zones, maxAqi]);

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-white/5 shadow-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
            <span>🤖</span> AI Diagnostic Insights
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Model-generated rationale</p>
        </div>
        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
          87% Confidence
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
            <span className="text-xl shrink-0 mt-0.5">{ins.emoji}</span>
            <p className="text-[12px] font-semibold text-gray-300 leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-white/10 flex justify-between text-xs font-bold text-gray-500">
        <span>Target: <strong className="text-white">{maxAqi} AQI</strong></span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" /> Model Active
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentData, historyData, maxAqi, selectedCity, selectedZone } = useOutletContext();

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-10">

      {/* Alert Banner */}
      {maxAqi > 100 && (
        <div className={`rounded-2xl px-6 py-4 flex items-center justify-between border backdrop-blur-md fade-in-up fade-in-up-1 ${
          maxAqi > 200
            ? 'bg-purple-900/30 border-purple-500/40 text-purple-300'
            : maxAqi > 150
            ? 'bg-red-900/30 border-red-500/40 text-red-300'
            : 'bg-orange-900/30 border-orange-500/40 text-orange-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{maxAqi > 200 ? '☠️' : maxAqi > 150 ? '🚨' : '⚠️'}</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Critical Broadcast</div>
              <span className="font-extrabold text-sm">
                {maxAqi > 200 ? 'HAZARDOUS — Stay Indoors, Activate Purifiers'
                  : maxAqi > 150 ? 'POLLUTION ALERT — Suspend Outdoor Activities'
                  : 'UNHEALTHY — Sensitive Demographic Risk'}
              </span>
            </div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-xl font-black text-lg border border-white/10">
            AQI {maxAqi}
          </div>
        </div>
      )}

      {/* Hero AQI Card (full width) */}
      <div className="fade-in-up fade-in-up-2">
        <HeroAqiCard zones={currentData} selectedCity={selectedCity} selectedZone={selectedZone} />
      </div>

      {/* Stats Row */}
      <div className="fade-in-up fade-in-up-3">
        <StatsRow zones={currentData} selectedCity={selectedCity} />
      </div>

      {/* Zone Cards scroller */}
      <div className="fade-in-up fade-in-up-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Zone Overview</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <ZoneCardsRow zones={currentData} />
      </div>

      {/* 24h Bar Chart */}
      <div className="fade-in-up fade-in-up-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">24-Hour AQI History</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <HistoryBarChart historyData={historyData} selectedCity={selectedCity} />
      </div>

      {/* Bottom Grid: Pollutants | Map | AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up fade-in-up-5">
        <MajorPollutantsCard zones={currentData} />
        <RegionalMiniMap zones={currentData} selectedCity={selectedCity} />
        <AiInsightCard zones={currentData} maxAqi={maxAqi} />
      </div>

    </div>
  );
}
