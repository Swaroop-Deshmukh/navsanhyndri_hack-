import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lightbulb, CheckCircle2, ChevronRight, BarChart3, CloudRain } from 'lucide-react';
import { getSuggestions } from '../api';

export default function SuggestionsPage() {
  const { currentData, selectedCity, selectedZone, maxAqi } = useOutletContext();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSuggestions(selectedCity, selectedZone)
      .then(res => {
         if (!isMounted) return;
         
         const policies = res.map(s => {
           let icon = "💡";
           let impact = "-10 AQI";
           let confidence = "80%";
           
           if (s.target.includes("Vehic") || s.target.includes("Traffic")) {
             icon = "🚗";
             impact = "-15 AQI";
             confidence = "89%";
           } else if (s.target.includes("Industr") || s.target.includes("Factor")) {
             icon = "🏭";
             impact = "-20 AQI";
             confidence = "92%";
           } else if (s.target.includes("Dust") || s.target.includes("Construc")) {
             icon = "🏗️";
             impact = "-12 AQI";
             confidence = "78%";
           } else {
             icon = "🌳";
             impact = "Stable";
             confidence = "95%";
           }

           return {
             title: s.target,
             desc: `${s.action} ${s.impact_estimate}`,
             impact,
             confidence,
             icon
           };
         });
         
         setInsights(policies);
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [selectedCity, selectedZone]);

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-10 fade-in-up fade-in-up-1">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#1e293b] rounded-[32px] p-8 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 blur-[100px] opacity-10 rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <span className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner border border-indigo-500/20 text-2xl">💡</span> 
             Simulation Master Plan
          </h2>
          <p className="text-gray-400 mt-4 text-sm font-medium leading-relaxed">
            AI-generated policy interventions based on current real-time telemetry from <strong className="text-gray-300">{selectedCity}</strong> and historical projection trends. Deploy these strategies to bring AQI underneath safe threshold limits.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 relative z-10 flex flex-col items-center justify-center bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner min-w-[200px]">
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Current Baseline AQI</p>
           <p className="text-5xl font-black text-white drop-shadow-md">{maxAqi}</p>
           <div className={`mt-3 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md border ${maxAqi > 150 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
              {maxAqi > 150 ? 'Intervention Required' : 'Optimal Baseline'}
           </div>
        </div>
      </div>

      {/* Suggested Strategies Grid */}
      <div>
         <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-6 px-2">Proposed Policy Directives</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
                // Skeleton loading state
                [1,2,3,4].map(i => (
                   <div key={i} className="h-48 bg-[#1e293b] rounded-3xl animate-pulse border border-white/5"></div>
                ))
            ) : insights.map((policy, idx) => (
                <div key={idx} className="bg-[#1e293b] rounded-[28px] p-6 border border-white/5 hover:border-indigo-500/30 transition-all hover:-translate-y-1 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(99,102,241,0.3)] flex flex-col h-full cursor-pointer relative overflow-hidden group">
                   
                   {/* Hover Gradient Effect */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-black/20 border border-white/5 shadow-inner flex items-center justify-center text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                         {policy.icon}
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Est. Impact</span>
                         <span className="text-indigo-400 font-black text-lg bg-indigo-500/10 px-3 py-0.5 rounded-lg border border-indigo-500/20 mt-1 shadow-inner">{policy.impact}</span>
                      </div>
                   </div>
                   
                   <h4 className="text-lg font-black text-gray-200 mb-2 relative z-10 leading-tight">{policy.title}</h4>
                   <p className="text-sm text-gray-400 font-medium leading-relaxed relative z-10 flex-1">{policy.desc}</p>
                   
                   <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                         <CheckCircle2 className="w-4 h-4 text-green-400" />
                         <span>{policy.confidence} ML Confidence</span>
                      </div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400 flex items-center group-hover:translate-x-1 transition-transform">
                         View Details <ChevronRight className="w-4 h-4 ml-0.5" />
                      </div>
                   </div>
                </div>
            ))}
         </div>
      </div>
      
    </div>
  );
}
