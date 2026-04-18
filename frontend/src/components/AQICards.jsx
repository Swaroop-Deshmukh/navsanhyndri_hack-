import React from 'react';
import useCountUp from '../hooks/useCountUp';

export const getAqiColor = (aqi) => {
  if (aqi < 50) return "#10b981"; // Emerald green
  if (aqi < 100) return "#f59e0b"; // Amber (Moderate)
  if (aqi < 150) return "#f97316"; // Orange (Sens.)
  if (aqi < 200) return "#ef4444"; // Red (Unhealthy)
  return "#8b5cf6"; // Purple (Hazardous)
};

export const getAqiLabel = (aqi) => {
  if (aqi < 50) return "Good";
  if (aqi < 100) return "Moderate";
  if (aqi < 150) return "Unhealthy (Sens.)";
  if (aqi < 200) return "Unhealthy";
  return "Hazardous";
};

function AnimatedMetricCard({ title, value, unit, subtext, color, gradient }) {
  const displayed = useCountUp(value);
  return (
    <div className={`bg-gradient-to-br ${gradient} shadow-xl rounded-[24px] overflow-hidden relative border border-white/10 transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-${color.replace('#', '')}/20 duration-300 text-white`}>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[13px] font-extrabold text-white/70 uppercase tracking-widest">{title}</p>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md shadow-inner">
             <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></span>
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4 drop-shadow-md">
          <span className="text-[44px] font-black leading-none">{displayed}</span>
          <span className="text-sm font-bold text-white/60 mb-1.5">{unit}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
          <span className="text-[13px] font-bold text-white/80 truncate">{subtext}</span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 bg-black/20 text-white shadow-inner">
             Status
          </span>
        </div>
      </div>
      {/* Decorative background flair */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}

export default function AQICards({ zones }) {
  if (!zones || zones.length === 0) return null;

  const avgAqi = Math.round(zones.reduce((acc, z) => acc + z.aqi, 0) / zones.length);
  const maxPm25Zone = [...zones].sort((a, b) => b.pm25 - a.pm25)[0];
  const maxPm10Zone = [...zones].sort((a, b) => b.pm10 - a.pm10)[0];
  const maxNo2Zone = [...zones].sort((a, b) => b.no2 - a.no2)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnimatedMetricCard title="Region Avg AQI" value={avgAqi} unit="AQI" subtext={getAqiLabel(avgAqi)} color={getAqiColor(avgAqi)} gradient="from-[#1e293b] to-[#0f172a]" />
      <AnimatedMetricCard title="Peak PM 2.5" value={Math.round(maxPm25Zone.pm25)} unit="µg/m³" subtext={maxPm25Zone.zone_name} color="#f59e0b" gradient="from-[#451a03] to-[#1e293b]" />
      <AnimatedMetricCard title="Peak PM 10" value={Math.round(maxPm10Zone.pm10)} unit="µg/m³" subtext={maxPm10Zone.zone_name} color="#06b6d4" gradient="from-[#083344] to-[#1e293b]" />
      <AnimatedMetricCard title="Peak NO₂" value={Math.round(maxNo2Zone.no2)} unit="ppb" subtext={maxNo2Zone.zone_name} color="#ec4899" gradient="from-[#4c1d95] to-[#1e293b]" />
    </div>
  );
}
