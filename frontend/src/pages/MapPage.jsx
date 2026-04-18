import React from 'react';
import AQIMap from '../components/AQIMap';
import { useOutletContext } from 'react-router-dom';

export default function MapPage() {
  const { currentData, selectedCity, selectedZone } = useOutletContext();
  
  return (
    <div className="h-[calc(100vh-160px)] w-full max-w-[1800px] mx-auto rounded-[32px] overflow-hidden shadow-2xl border border-white/5 relative fade-in-up fade-in-up-1 bg-[#1e293b]">
       <AQIMap zones={currentData} selectedCity={selectedCity} selectedZone={selectedZone} />
       
       {/* Floating UI panel on the map referencing dark premium style */}
       <div className="absolute top-8 left-8 z-[400] w-[340px] bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
             <h3 className="font-extrabold text-gray-200 text-lg tracking-tight">Active Regions</h3>
             <span className="bg-blue-900/50 text-blue-300 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider shadow-inner">{currentData.length} Locations</span>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
             {currentData.map(z => (
                <div key={z.zone_id} className="flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 shadow-inner backdrop-blur-md cursor-default">
                   <div>
                     <p className="text-[15px] font-bold text-gray-300 leading-tight">{z.zone_name}</p>
                     <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">PM2.5: {z.pm25}</p>
                   </div>
                   <div 
                     className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-xl relative overflow-hidden" 
                     style={{
                         backgroundColor: z.aqi > 200 ? '#a855f7' : z.aqi > 150 ? '#ef4444' : (z.aqi > 100 ? '#f59e0b' : '#22c55e'),
                         boxShadow: `0 0 15px ${z.aqi > 200 ? '#a855f750' : z.aqi > 150 ? '#ef444450' : (z.aqi > 100 ? '#f59e0b50' : '#22c55e50')}`
                     }}
                   >
                     {z.aqi}
                     <div className="absolute inset-0 bg-white opacity-20"></div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
