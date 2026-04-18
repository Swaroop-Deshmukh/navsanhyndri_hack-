import React, { useState, useEffect } from 'react';
import { simulateEvent, getSuggestions } from "../api";
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { Loader2, AlertTriangle, Radio, Activity, Zap } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const EVENT_CONFIG = {
  factory_leak: { label: 'Petrochemical Leak', emoji: '💥', duration: 'Est. 18 hrs', color: '#ef4444' },
  wildfire:     { label: 'Suburban Wildfire',  emoji: '🔥', duration: 'Est. 4 days', color: '#f97316' },
  traffic_jam:  { label: 'Gridlock Protocol',  emoji: '🚦', duration: 'Est. 2 hrs', color: '#eab308' },
};

function EventMiniMap({ radiusKm, center = [19.076, 72.877] }) {
  const cartoDarkUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  return (
    <div className="bg-[#0f172a] rounded-[20px] border border-white/5 overflow-hidden h-[180px] relative shadow-inner">
      <MapContainer center={center} zoom={11} className="w-full h-full z-0" zoomControl={false} dragging={false} scrollWheelZoom={false} attributionControl={false}>
        <TileLayer url={cartoDarkUrl} crossOrigin="anonymous" />
        {radiusKm > 0 && (
          <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3, weight: 2 }} />
        )}
      </MapContainer>
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 shadow-sm px-3 py-1.5 text-[11px] font-bold text-gray-300 rounded-lg uppercase tracking-wider z-10">
        Blast Radius: {radiusKm} km
      </div>
    </div>
  );
}

export default function EmergencySimulator() {
  const contextData = useOutletContext();
  const { selectedCity, selectedZone, setActiveAlerts, currentData } = contextData || {};
  
  const [eventData, setEventData] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Automated Emergency State
  const [automatedAlert, setAutomatedAlert] = useState(null);
  const [liveFeeds, setLiveFeeds] = useState([]);

  // Base initialization of feeds
  useEffect(() => {
     setLiveFeeds([
        { id: '1', time: 'Just now', msg: `Regional sensors operating at nominal baseline. System armed.`, severity: 'low' },
     ]);
     setAutomatedAlert(null);
     clearEvent();
  }, [selectedCity]);

  // Monitor real-time AQI for automatic triggers
  useEffect(() => {
    if (!currentData || currentData.length === 0) return;
    
    // Check if any zone crossed the hazard threshold (AQI > 150)
    const dangerousZone = currentData.find(z => z.aqi > 150);
    
    if (dangerousZone && !automatedAlert && !eventData) {
       triggerAutomatedAlert(dangerousZone);
    }
  }, [currentData]);

  const triggerAutomatedAlert = (zone) => {
    setAutomatedAlert({
       zone_name: zone.zone_name,
       aqi: zone.aqi,
       lat: zone.lat,
       lng: zone.lng,
       pm25: zone.pm25
    });
    
    setLiveFeeds(prev => [
       { id: Date.now(), time: 'Just now', msg: `CRITICAL DETECT: AQI reached ${zone.aqi} in ${zone.zone_name}. Generating priority alert!`, severity: 'critical' },
       ...prev.slice(0, 5)
    ]);
  };

  // Demo Hackathon Button: Inject fake spike
  const injectDemoSpike = () => {
     const dummyZone = {
       zone_name: `${selectedCity} Central Plaza`,
       aqi: 285,
       lat: currentData?.[0]?.lat || 18.5204,
       lng: currentData?.[0]?.lng || 73.8567,
       pm25: 140
     };
     triggerAutomatedAlert(dummyZone);
  };

  const generateAutoPlan = async () => {
    if (loading || !automatedAlert) return;
    setLoading(true);
    try {
      // Simulate calling backend for AI Suggestions
      const suggestions = await getSuggestions(selectedCity, automatedAlert.zone_name);
      
      const plan = suggestions && suggestions.length > 0 
        ? suggestions[0].action 
        : "Deploy emergency anti-smog guns and restrict heavy commercial traffic immediately.";

      const newEvent = { 
         emoji: '🌫️', 
         label: 'Automated Response Plan', 
         duration: 'Est. 24 hrs', 
         color: '#ef4444',
         aqi_spike: automatedAlert.aqi - 100,
         affected_radius_km: 8.0,
         recommendation: plan,
         center: [automatedAlert.lat, automatedAlert.lng]
      };
      
      setEventData(newEvent);
      setActiveType('automated');
      setAutomatedAlert(null); // transition state

      if (contextData?.setActiveAlerts) {
         contextData.setActiveAlerts(prev => [
           { id: Date.now(), type: 'emergency', title: `Smart Dispatch Activated`, desc: `Forces deployed to ${automatedAlert.zone_name}.`, autoDismiss: 7000 },
           ...prev
         ]);
      }
    } catch (err) {
      console.error('Plan generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (type) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await simulateEvent(type, selectedCity, selectedZone);
      const newEvent = { ...res, ...EVENT_CONFIG[type], type, center: [currentData?.[0]?.lat || 19.0, currentData?.[0]?.lng || 72.8] };
      setEventData(newEvent);
      setActiveType(type);
      setAutomatedAlert(null); // Override any pending automated alert
      
      setLiveFeeds(prev => [
         { id: Date.now(), time: 'Just now', msg: `MANUAL OVERRIDE: ${EVENT_CONFIG[type].label} triggered. Response protocol initiated.`, severity: 'critical' },
         ...prev.slice(0, 4)
      ]);

      if (contextData?.setActiveAlerts) {
         contextData.setActiveAlerts(prev => [
           { id: Date.now(), type: 'emergency', title: `${EVENT_CONFIG[type].label} Protocol Activated`, desc: newEvent.recommendation, autoDismiss: 8000 },
           ...prev
         ]);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearEvent = () => {
    setEventData(null);
    setActiveType(null);
    setAutomatedAlert(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
       
       {/* Live Automated Feeds */}
       <div className="w-full lg:w-1/3 bg-[#1e293b] rounded-[32px] border border-white/5 p-6 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <Radio className="w-40 h-40 text-blue-500" />
          </div>
          <div className="mb-6 relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
             <div>
                <h3 className="text-xl font-black text-gray-200 tracking-tight flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></span> Live Alerts Feed
                </h3>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-1">Automated Array</p>
             </div>
             
             {/* Developer Demo Button */}
             <button onClick={injectDemoSpike} className="bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md">
               <Zap className="w-3 h-3" /> Force Spike
             </button>
             
          </div>
          <div className="flex-1 space-y-4 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
             {liveFeeds.map(feed => (
                <div key={feed.id} className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors">
                   <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-inner border border-white/5 ${
                         feed.severity === 'critical' ? 'bg-purple-500/20 text-purple-400' :
                         feed.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                         feed.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' : 
                         'bg-green-500/20 text-green-400'
                      }`}>
                         {feed.severity}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{feed.time}</span>
                   </div>
                   <p className="text-sm text-gray-300 font-medium leading-relaxed">{feed.msg}</p>
                </div>
             ))}
          </div>
       </div>

       {/* Simulator Display HUD */}
       <div className={`flex-1 bg-[#1e293b] shadow-xl rounded-[32px] p-6 sm:p-8 border transition-all duration-700 flex flex-col xl:flex-row gap-8 ${
           eventData || automatedAlert ? 'border-red-500/30 shadow-[0_0_50px_-15px_rgba(239,68,68,0.2)]' : 'border-white/5'
       }`}>
         
         {/* Control Panel */}
         <div className="w-full xl:w-1/3 flex flex-col border-b xl:border-b-0 xl:border-r border-white/10 pb-8 xl:pb-0 xl:pr-8">
            <div className="text-[10px] font-black text-red-400 shadow-inner px-3 py-1.5 rounded-lg border border-red-500/20 uppercase tracking-widest mb-4 bg-red-900/20 w-fit">Restricted Access</div>
            <h3 className="text-2xl font-black text-gray-200 mb-6 leading-tight">Simulation<br/>Dispatch Overrides</h3>
            
            <div className="flex flex-col gap-3 flex-1 justify-center">
               {Object.entries(EVENT_CONFIG).map(([type, cfg]) => (
                 <button
                   key={type}
                   onClick={() => handleSimulate(type)}
                   disabled={loading || automatedAlert}
                   className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 border hover:-translate-y-1 ${
                      activeType === type 
                         ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                         : 'border-white/10 hover:border-white/20 bg-black/20 text-gray-400 hover:text-gray-200'
                   } disabled:opacity-30 disabled:hover:translate-y-0`}
                 >
                   <span className="text-2xl">{cfg.emoji}</span>
                   <span className="flex-1 text-left">{cfg.label}</span>
                   {loading && activeType === type && <Loader2 className="w-5 h-5 animate-spin text-red-500 shrink-0" />}
                 </button>
               ))}
            </div>
         </div>

         {/* Results HUD */}
         <div className="w-full xl:w-2/3 flex flex-col justify-center">
            
            {/* STATE 1: System caught a real-time spike and is awaiting your command */}
            {automatedAlert && !eventData && (
              <div className="bg-red-500/10 rounded-[28px] border border-red-500/30 p-8 flex flex-col items-center justify-center text-center animate-in zoom-in fade-in duration-300">
                  <div className="w-20 h-20 bg-red-500 text-white flex items-center justify-center rounded-3xl text-4xl mb-4 shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse">
                     🚨
                  </div>
                  <h3 className="text-2xl font-black text-red-100 tracking-tight">Hazardous Air Quality Detected</h3>
                  <p className="text-red-300 mt-2 font-bold bg-red-900/40 px-4 py-1.5 rounded-full border border-red-500/20 inline-block mb-6">
                    {automatedAlert.zone_name} is recording AQI {automatedAlert.aqi}
                  </p>
                  <p className="text-gray-400 text-sm font-medium max-w-md mb-8">
                    Automated sensors have picked up dangerous particulate matter levels. It is highly recommended to generate a mitigation strategy immediately to counteract the hazard.
                  </p>
                  <button 
                    onClick={generateAutoPlan}
                    disabled={loading}
                    className="flex justify-center items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-sm px-8 py-4 rounded-xl w-full shadow-lg hover:shadow-red-500/30 hover:to-red-400 transition-all active:scale-95 border border-red-400/50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                    {loading ? "Generating Protocol..." : "Generate Action Plan"}
                  </button>
              </div>
            )}
            
            {/* STATE 2: Event actively showing (Manual Override or Resolved Auto-Plan) */}
            {eventData && !automatedAlert && (
               <div className="bg-red-900/10 rounded-[28px] border border-red-500/20 p-6 animate-in zoom-in-95 fade-in duration-500 relative overflow-hidden shadow-inner flex flex-col h-full justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 blur-[100px] opacity-10 rounded-full pointer-events-none"></div>
                  
                  <div className="flex flex-wrap justify-between items-start mb-6 z-10 relative gap-4">
                     <div>
                       <h4 className="text-2xl font-black text-red-400 drop-shadow-md flex items-center gap-3">
                          {eventData.emoji} {eventData.label}
                       </h4>
                       <p className="text-red-300 font-bold mt-1 tracking-wide text-sm">{eventData.duration}</p>
                     </div>
                     <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5 shadow-inner text-center shrink-0">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact Spike</p>
                        <p className="text-2xl font-black text-red-500">+{eventData.aqi_spike}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative flex-1">
                     <EventMiniMap radiusKm={eventData.affected_radius_km} center={eventData.center} />
                     
                     <div className="flex flex-col justify-between bg-black/20 rounded-[20px] p-6 border border-white/5 shadow-inner">
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Generated Directive</p>
                          <p className="text-[13px] font-semibold text-gray-300 leading-relaxed text-balance">
                             {eventData.recommendation}
                          </p>
                        </div>
                        <button onClick={clearEvent} className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-widest border border-white/10 hover:border-white/30 hover:shadow-md">
                          Recall Scenario
                        </button>
                     </div>
                  </div>
               </div>
            )}
            
            {/* STATE 3: Nothing happening */}
            {!eventData && !automatedAlert && (
               <div className="h-full border-2 border-dashed border-white/10 rounded-[28px] flex flex-col items-center justify-center p-12 text-center bg-black/10">
                  <div className="w-16 h-16 bg-white/5 text-gray-500 flex items-center justify-center rounded-2xl text-2xl mb-4 border border-white/10 shadow-inner">
                     <AlertTriangle className="w-8 h-8" />
                  </div>
                  <p className="text-gray-300 font-bold text-lg tracking-tight">System Idle</p>
                  <p className="text-gray-500 font-medium text-sm mt-2 max-w-sm">The Environment Array is continuously monitoring live telemetry. Select a manual override protocol or await a system alarm.</p>
               </div>
            )}
            
         </div>
       </div>

    </div>
  );
}
