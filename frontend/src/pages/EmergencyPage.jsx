import React from 'react';
import EmergencySimulator from '../components/EmergencySimulator';

export default function EmergencyPage() {
  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col overflow-hidden fade-in-up fade-in-up-1 pb-10">
       <div className="w-full mb-8 pl-2 border-b border-white/5 pb-6">
         <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Emergency Operations Center</h2>
         <p className="text-gray-400 mt-3 text-lg font-medium max-w-3xl">
           Monitor automated live telemetry feeds or manually dispatch synthetic urban crises to evaluate system response and mitigation tactics.
         </p>
       </div>
       <div className="flex-1 w-full">
         <EmergencySimulator />
       </div>
    </div>
  );
}
