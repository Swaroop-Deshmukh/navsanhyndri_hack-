import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { getAqiColor } from './AQICards';
import { getHeatmapData } from '../api';

function HeatmapLayer({ heatData }) {
  const map = useMap();
  useEffect(() => {
    if (!heatData || heatData.length === 0) return;
    const points = heatData.map(p => [p.lat, p.lng, p.aqi / 300]);
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 13,
      gradient: { 0.2: '#4c1d95', 0.5: '#f97316', 0.9: '#ef4444' }
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [heatData, map]);
  return null;
}

function MapLegend() {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
      div.style.padding = '12px 16px';
      div.style.borderRadius = '16px';
      div.style.color = '#e2e8f0';
      div.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
      div.style.border = '1px solid rgba(255,255,255,0.1)';
      
      const grades = [0, 50, 100, 150, 200];
      const labels = ['Good', 'Moderate', 'Unhealthy (S.)', 'Unhealthy', 'Hazard'];
      
      let innerHTML = '<strong style="display:block; margin-bottom:12px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">Index Scale</strong>';
      for (let i = 0; i < grades.length; i++) {
        innerHTML +=
          '<div style="display:flex; align-items:center; margin-bottom:8px; font-size:12px; font-weight:700;">' +
          '<i style="background:' + getAqiColor(grades[i] + 1) + '; width:12px; height:12px; display:inline-block; margin-right:12px; border-radius:4px; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.1)"></i> ' +
          '<span>' + labels[i] + '</span></div>';
      }
      div.innerHTML = innerHTML;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map]);
  return null;
}

function MapZoomManager({ zones, selectedZone }) {
   const map = useMap();
   useEffect(() => {
     if (zones && zones.length > 0) {
       if (selectedZone) {
         const target = zones.find(z => z.zone_name === selectedZone);
         if (target) {
           map.flyTo([target.lat, target.lng], 14, { duration: 1.5 });
         }
       } else {
         // calculate center
         const avgLat = zones.reduce((acc, z) => acc + z.lat, 0) / zones.length;
         const avgLng = zones.reduce((acc, z) => acc + z.lng, 0) / zones.length;
         map.flyTo([avgLat, avgLng], 11, { duration: 1.5 });
       }
     }
   }, [zones, selectedZone, map]);
   return null;
}

export default function AQIMap({ zones, selectedCity, selectedZone }) {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getHeatmapData(selectedCity).then(data => { if (isMounted) setHeatmapData(data); });
    return () => { isMounted = false; };
  }, [selectedCity]);

  // Use a dark map tile provider (CartoDB Dark Matter)
  const cartoDarkUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="absolute inset-0 h-full w-full z-0 font-sans bg-[#0f172a]">
      <MapContainer center={[19.076, 72.877]} zoom={12} className="w-full h-full" zoomControl={false}>
        <TileLayer 
          url={cartoDarkUrl}
          attribution='&copy; CARTO'
          crossOrigin="anonymous"
        />
        <HeatmapLayer heatData={heatmapData} />
        <MapLegend />
        <MapZoomManager zones={zones} selectedZone={selectedZone} />
        {zones.map(zone => (
          <CircleMarker
            key={zone.zone_id}
            center={[zone.lat, zone.lng]}
            radius={16}
            pathOptions={{
              color: 'rgba(255,255,255,0.8)',
              fillColor: getAqiColor(zone.aqi),
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-2 min-w-[140px] bg-[#0f172a] rounded-xl text-white shadow-xl -m-[13px] border border-white/10">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Zone Telemetry</div>
                <b className="text-[16px] block mb-2 text-gray-100 leading-tight">{zone.zone_name}</b>
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-2.5 mb-2 border border-white/5">
                   <span className="text-xs font-bold text-gray-400">AQI</span>
                   <strong className="text-xl font-black drop-shadow-md" style={{ color: getAqiColor(zone.aqi) }}>{zone.aqi}</strong>
                </div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between px-1">
                   <span>PM2.5: <span className="text-white">{zone.pm25}</span></span>
                   <span>NO2: <span className="text-white">{zone.no2}</span></span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
