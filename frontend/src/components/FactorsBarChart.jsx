import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useOutletContext } from 'react-router-dom';

export default function FactorsBarChart() {
  const { currentData, selectedZone } = useOutletContext();

  const chartData = useMemo(() => {
    if (!currentData || currentData.length === 0) return [];
    
    // Average the factors across currentData
    let aggregates = {
      vehicle_contribution: 0,
      factory: 0,
      dust: 0,
      other: 0
    };
    
    currentData.forEach(d => {
      const factors = d.factors || { vehicle_contribution: 40, factory: 20, dust: 20, other: 20 };
      aggregates.vehicle_contribution += factors.vehicle_contribution;
      aggregates.factory += factors.factory;
      aggregates.dust += factors.dust;
      aggregates.other += factors.other;
    });
    
    const count = currentData.length;
    return [
      { name: 'Vehicles', value: Math.round(aggregates.vehicle_contribution / count), color: '#3b82f6' },
      { name: 'Industry', value: Math.round(aggregates.factory / count), color: '#ef4444' },
      { name: 'Dust', value: Math.round(aggregates.dust / count), color: '#eab308' },
      { name: 'Other', value: Math.round(aggregates.other / count), color: '#8b5cf6' }
    ];
  }, [currentData]);

  if (chartData.length === 0) {
      return (
        <div className="bg-[#1e293b] rounded-3xl p-6 shadow-xl border border-white/5 h-full flex items-center justify-center">
            <p className="text-gray-400">Awaiting factor telemetry...</p>
        </div>
      );
  }

  return (
    <div className="bg-[#1e293b] rounded-3xl p-6 shadow-xl border border-white/5 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-[14px] font-black uppercase tracking-widest text-indigo-300">Pollutant Source Analysis</h3>
        <p className="text-xs text-gray-400 font-medium">Breakdown of primary contributing factors</p>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}
              formatter={(value) => [`${value}%`, 'Contribution']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
