import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { getAqiColor } from './AQICards';

export default function WhatIfSimulator() {
  const [factories, setFactories] = useState([5]);
  const [green, setGreen] = useState([2]);
  const [traffic, setTraffic] = useState([3]);

  const aqi = Math.max(0, 100 + (factories[0] * 12) - (green[0] * 8) + (traffic[0] * 15));
  const color = getAqiColor(aqi);
  const percentage = Math.min(100, Math.max(0, (aqi / 300) * 100));

  return (
    <div className="bg-[#1e293b] shadow-xl rounded-[32px] flex flex-col h-full w-full border border-white/5 p-8 relative">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h3 className="flex items-center gap-3 text-2xl font-black text-gray-200 tracking-tight">
           <span className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shadow-inner border border-cyan-500/20 text-2xl">🔬</span> 
           What-If Simulator
        </h3>
        <p className="text-gray-400 font-medium mt-3 ml-[60px]">Adjust urban expansion vectors to evaluate direct environmental drift.</p>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-10">
        
        {/* Sliders Area */}
        <div className="space-y-8 flex-1">
          <div className="space-y-4">
             <div className="flex justify-between items-end text-[13px] font-bold uppercase tracking-wide text-gray-400">
               <span className="flex items-center gap-2"><span className="text-lg">🏭</span> Industrial Output</span>
               <span className="text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 shadow-inner">{factories[0]} Units</span>
             </div>
             <Slider min={0} max={10} step={1} value={factories} onValueChange={setFactories} className="cursor-grab active:cursor-grabbing" />
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end text-[13px] font-bold uppercase tracking-wide text-gray-400">
               <span className="flex items-center gap-2"><span className="text-lg">🌿</span> Green Zone Density</span>
               <span className="text-green-300 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 shadow-inner">{green[0]} Sectors</span>
             </div>
             <Slider min={0} max={10} step={1} value={green} onValueChange={setGreen} className="cursor-grab active:cursor-grabbing" />
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end text-[13px] font-bold uppercase tracking-wide text-gray-400">
               <span className="flex items-center gap-2"><span className="text-lg">🚗</span> Traffic Congestion</span>
               <span className="text-orange-300 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20 shadow-inner">Level {traffic[0]}</span>
             </div>
             <Slider min={1} max={5} step={1} value={traffic} onValueChange={setTraffic} className="cursor-grab active:cursor-grabbing" />
          </div>
        </div>

        {/* Output Gauge Area */}
        <div className="w-full xl:w-72 bg-[#0f172a] rounded-[28px] border border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-inner">
           <div className="absolute top-0 left-0 w-full h-2 shadow-[0_0_15px_currentColor]" style={{ backgroundColor: color, color: color }}></div>
           
           <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.2em] mb-2 text-center leading-tight">
              Projected<br/>Outcome
           </div>
           
           <div className="text-[64px] font-black tracking-tighter my-2 transition-colors duration-500 drop-shadow-md" style={{ color: color }}>
              {aqi}
           </div>
           
           <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 mt-4 shadow-inner relative">
             <div 
               className="h-full rounded-full transition-all duration-700 ease-out absolute left-0 top-0 shadow-[0_0_10px_currentColor]" 
               style={{ width: `${percentage}%`, backgroundColor: color, color: color }}
             />
           </div>
           
           <div className="flex w-full justify-between text-[9px] text-gray-500 mt-2 uppercase font-black px-1 opacity-60">
             <span>Clean</span>
             <span>Hazard</span>
           </div>
        </div>

      </div>
    </div>
  );
}
