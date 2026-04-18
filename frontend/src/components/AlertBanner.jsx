import React from 'react';

export default function AlertBanner({ maxAqi }) {
  if (maxAqi <= 100) return null;

  let bgClass = "";
  let textClass = "";
  let icon = "";
  let message = "";
  let glow = "";
  
  if (maxAqi > 200) {
    bgClass = "bg-purple-900/30 border-purple-500/50";
    textClass = "text-purple-300";
    icon = "☠️";
    message = "HAZARDOUS ATMOSPHERE — Stay Indoors and Activate Purifiers";
    glow = "shadow-[0_0_20px_rgba(168,85,247,0.3)]";
  } else if (maxAqi > 150) {
    bgClass = "bg-red-900/30 border-red-500/50";
    textClass = "text-red-300";
    icon = "🚨";
    message = "POLLUTION ALERT — Suspend Outdoor Labor and Activities";
    glow = "shadow-[0_0_20px_rgba(239,68,68,0.3)]";
  } else {
    bgClass = "bg-orange-900/30 border-orange-500/50";
    textClass = "text-orange-300";
    icon = "⚠️";
    message = "UNHEALTHY LEVELS — Sensitive Demographic Risk";
    glow = "shadow-[0_0_20px_rgba(249,115,22,0.3)]";
  }

  return (
    <div className={`border rounded-[20px] px-8 py-5 flex items-center justify-between backdrop-blur-md ${bgClass} ${textClass} animate-in slide-in-from-top-4 fade-in duration-500 ${glow}`}>
      <div className="flex items-center gap-4">
         <span className="text-3xl filter drop-shadow-sm">{icon}</span>
         <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Critical Broadcast</div>
            <span className="font-extrabold text-[15px] tracking-wide">{message}</span>
         </div>
      </div>
      <div className="bg-black/40 px-4 py-2 rounded-xl text-xl font-black shadow-inner border border-white/10">
         AQI {maxAqi}
      </div>
    </div>
  );
}
