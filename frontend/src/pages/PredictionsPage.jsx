import React from 'react';
import PredictionGraph from '../components/PredictionGraph';
import WhatIfSimulator from '../components/WhatIfSimulator';

export default function PredictionsPage() {
  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto pb-10">
       <div className="h-[500px] fade-in-up fade-in-up-1">
          <PredictionGraph />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 fade-in-up fade-in-up-2">
          <div className="w-full">
             <WhatIfSimulator />
          </div>
          <div className="bg-[#1e293b] rounded-3xl p-8 border border-white/5 shadow-xl flex flex-col justify-center">
             <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner border border-blue-500/20">
                📈
             </div>
             <h3 className="text-2xl font-black text-gray-200 mb-3 tracking-tight">Predictive Engine</h3>
             <p className="text-gray-400 text-lg leading-relaxed mb-6 font-medium">
               The platform utilizes an advanced auto-regressive model pre-trained on simulated time-series urban atmospheric data and live API feeds. 
               We encode seasonal and spatial features to establish robust forecasting patterns out to 1 year.
             </p>
             <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest border-l-4 border-indigo-500 pl-4 py-1">
                Accuracy confidence ± 15 AQI points
             </p>
          </div>
       </div>
    </div>
  );
}
