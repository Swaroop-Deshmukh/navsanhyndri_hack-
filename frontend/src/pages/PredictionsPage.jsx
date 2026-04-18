import React from 'react';
import PredictionGraph from '../components/PredictionGraph';
import WhatIfSimulator from '../components/WhatIfSimulator';
import ExactDatePrediction from '../components/ExactDatePrediction';

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
          <div className="w-full">
             <ExactDatePrediction />
          </div>
       </div>
    </div>
  );
}
