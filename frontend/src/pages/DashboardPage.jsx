import React, { useEffect, useRef, useMemo, Suspense } from 'react';
import AQICards from '../components/AQICards';
import PollutantChart from '../components/PollutantChart';
import FactorsBarChart from '../components/FactorsBarChart';
import ExplainabilityCard from '../components/ExplainabilityCard';
import AlertBanner from '../components/AlertBanner';
import { useOutletContext, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { getAqiColor } from '../components/AQICards';
import { ExternalLink } from 'lucide-react';

// Lightweight mini-map for dashboard snapshot (no heatmap, no heavy plugins)
function RegionalSnapshot({ zones, selectedCity }) {
  // Compute center dynamically from zones
  const center = useMemo(() => {
    if (!zones || zones.length === 0) return [20.5937, 78.9629]; // India center
    const avgLat = zones.reduce((s, z) => s + (z.lat || 0), 0) / zones.length;
    const avgLng = zones.reduce((s, z) => s + (z.lng || 0), 0) / zones.length;
    return [avgLat || 20.5937, avgLng || 78.9629];
  }, [zones]);

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-white/5 shadow-xl overflow-hidden flex flex-col min-h-[340px]">
      <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Regional Snapshot</p>
          <h3 className="text-lg font-black text-gray-100 mt-0.5">{selectedCity} — Zone Overview</h3>
        </div>
        <Link to="/map" className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          Full View <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex-1 relative z-0 min-h-[260px]">
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
            style={{ height: '260px', background: '#0f172a' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              crossOrigin="anonymous"
            />
            {zones.map(zone => (
              <CircleMarker
                key={zone.zone_id}
                center={[zone.lat, zone.lng]}
                radius={14}
                pathOptions={{
                  color: 'rgba(255,255,255,0.6)',
                  fillColor: getAqiColor(zone.aqi),
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Tooltip permanent={false} direction="top">
                  <span className="font-bold text-xs">{zone.zone_name}: AQI {zone.aqi}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm font-bold">
            Loading Zone Data...
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentData, maxAqi, selectedCity, selectedZone } = useOutletContext();

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-10">
      <div className="fade-in-up fade-in-up-1">
        <AlertBanner maxAqi={maxAqi} />
      </div>

      <div className="fade-in-up fade-in-up-2">
        <AQICards zones={currentData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up fade-in-up-3">
        <div className="lg:col-span-2 flex flex-col min-h-[400px]">
          <PollutantChart />
        </div>
        <div className="lg:col-span-1 flex flex-col min-h-[400px]">
          <FactorsBarChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-up fade-in-up-4">
        {/* Real embedded mini-map */}
        <RegionalSnapshot zones={currentData} selectedCity={selectedCity} />

        <div className="flex flex-col min-h-[340px]">
          <ExplainabilityCard currentAqi={maxAqi} />
        </div>
      </div>
    </div>
  );
}
