import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import { TreePine, Factory, Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GovtLoginPage from './GovtLoginPage';

// --- Simulator Path Setup ---
const KEY_POINTS = [
  [28.6139, 77.2090], [28.6180, 77.2100], [28.6200, 77.2100], 
  [28.6300, 77.1800], [28.6400, 77.1600], [28.6600, 77.1500], 
  [28.6400, 77.1800], [28.6100, 77.2200], [28.5800, 77.2500], 
  [28.5900, 77.2300], [28.6139, 77.2090]  
];

function interpolatePath(points, steps) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i+1];
    for (let j = 0; j < steps; j++) {
      const lat = p1[0] + (p2[0] - p1[0]) * (j / steps);
      const lng = p1[1] + (p2[1] - p1[1]) * (j / steps);
      result.push([lat, lng]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

const PREDEFINED_PATH = interpolatePath(KEY_POINTS, 30);
const SCALE = 700;

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: '<div class="user-marker flex items-center justify-center" style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 15px #3b82f6;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// --- Map Interaction Handler ---
const MapEventsHandler = ({
  mode, setMode, 
  trees, setTrees, 
  factories, setFactories,
  setPromptPos, setPromptType, setInputValue
}) => {
  useMapEvents({
    click: (e) => {
      if (mode === 'add_tree') {
        setPromptPos({ lat: e.latlng.lat, lng: e.latlng.lng });
        setPromptType('tree');
        setInputValue('50');
      } else if (mode === 'add_factory') {
        setPromptPos({ lat: e.latlng.lat, lng: e.latlng.lng });
        setPromptType('factory');
        setInputValue('100');
      }
    }
  });

  return null;
};

export default function PlanningPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('govt_auth') === 'true');

  if (!isAuthenticated) {
    return <GovtLoginPage onLogin={() => {
      sessionStorage.setItem('govt_auth', 'true');
      setIsAuthenticated(true);
    }} />;
  }

  return <PlanningDashboard />;
}

function PlanningDashboard() {
  const [mode, setMode] = useState('idle'); 
  const [trees, setTrees] = useState([]);
  const [factories, setFactories] = useState([]);
  const [aqi, setAqi] = useState(50);
  const [baseAqi, setBaseAqi] = useState(50);

  const [promptType, setPromptType] = useState(null);
  const [promptPos, setPromptPos] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Simulator State
  const [demoPosition, setDemoPosition] = useState(PREDEFINED_PATH[0]);
  const [exposure, setExposure] = useState(0);
  const [cigarettes, setCigarettes] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [liveLocalAqi, setLiveLocalAqi] = useState(50);
  const pathIndexRef = useRef(0);

  useEffect(() => {
    fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.6139&longitude=77.2090&current=us_aqi')
      .then(res => res.json())
      .then(data => {
        if (data && data.current && data.current.us_aqi) {
          setBaseAqi(data.current.us_aqi);
          setLiveLocalAqi(data.current.us_aqi);
          setAqi(data.current.us_aqi);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Calculate generic regional AQI
  useEffect(() => {
    let currentAqi = baseAqi; 
    factories.forEach(f => {
      let factoryPollution = f.emission * 0.4; 
      trees.forEach(t => {
        const dLat = (f.lat - t.lat) * 111;
        const dLng = (f.lng - t.lng) * 111;
        const distSq = dLat*dLat + dLng*dLng; 
        const mitigation = (t.density * 0.5) / Math.max(1, distSq * 0.2);
        factoryPollution -= mitigation;
      });
      if (factoryPollution > 0) {
        currentAqi += factoryPollution;
      }
    });

    trees.forEach(t => {
      currentAqi -= t.density * 0.05;
    });

    setAqi(Math.max(0, Math.round(currentAqi)));
  }, [trees, factories, baseAqi]);


  // Simulator Tracking Math
  const calculatePointAQI = (lat, lng) => {
    let ptAqi = baseAqi;
    factories.forEach(f => {
       const dLat = (lat - f.lat) * 111;
       const dLng = (lng - f.lng) * 111;
       const distSq = dLat*dLat + dLng*dLng;
       ptAqi += f.emission / Math.max(0.5, distSq * 0.8);
    });
    trees.forEach(t => {
       const dLat = (lat - t.lat) * 111;
       const dLng = (lng - t.lng) * 111;
       const distSq = dLat*dLat + dLng*dLng;
       ptAqi -= (t.density * 0.8) / Math.max(0.2, distSq * 2);
    });
    return Math.max(0, ptAqi);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      pathIndexRef.current += 1;
      if (pathIndexRef.current >= PREDEFINED_PATH.length) {
        pathIndexRef.current = 0; 
      }
      
      const newPos = PREDEFINED_PATH[pathIndexRef.current];
      setDemoPosition(newPos);

      const localAqi = calculatePointAQI(newPos[0], newPos[1]);
      setLiveLocalAqi(Math.round(localAqi));

      setExposure(prev => {
        const newExposure = prev + (localAqi * 0.1);
        setCigarettes(newExposure / SCALE);
        return newExposure;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, factories, trees, baseAqi]);


  const getAqiStatus = (val) => {
    if (val <= 50) return { text: 'Good', border: 'border-green-500', textCol: 'text-green-400', bg: 'bg-green-500/20' };
    if (val <= 100) return { text: 'Moderate', border: 'border-yellow-500', textCol: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (val <= 200) return { text: 'Poor', border: 'border-orange-500', textCol: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { text: 'Severe', border: 'border-red-500', textCol: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const status = getAqiStatus(aqi);

  const handlePlaceEntity = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && promptPos) {
      if (promptType === 'tree') {
        setTrees(prev => [...prev, { id: Date.now(), lat: promptPos.lat, lng: promptPos.lng, density: val, selected: false }]);
      } else if (promptType === 'factory') {
        setFactories(prev => [...prev, { id: Date.now(), lat: promptPos.lat, lng: promptPos.lng, emission: val }]);
      }
    }
    setPromptPos(null);
    setPromptType(null);
    setMode('idle');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      
      {/* 1. Sidebar Control Panel */}
      <div className="w-[300px] shrink-0 flex flex-col gap-6">
        <div className="bg-[#1e293b]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">UrbanScale Sandbox</h2>
          <p className="text-gray-400 text-sm font-medium mb-6">Interactive planning & exposure tracker prototype.</p>
          
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Environment Blueprinting</h3>
          <div className="flex flex-col gap-3">
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 transition-all font-semibold shadow-inner ${mode === 'add_tree' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}`}
              onClick={() => setMode('add_tree')}
            >
              <TreePine size={18} className={mode === 'add_tree' ? 'text-green-400' : 'text-gray-400'} />
              Add Green Cover
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 transition-all font-semibold shadow-inner ${mode === 'add_factory' ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}`}
              onClick={() => setMode('add_factory')}
            >
              <Factory size={18} className={mode === 'add_factory' ? 'text-red-400' : 'text-gray-400'} />
              Industrial Zone
            </button>
          </div>
        </div>

        <div className="bg-[#1e293b]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex-1 flex flex-col">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 mt-2">Exposure Tracker Demo</h3>
          <p className="text-gray-400 text-xs font-medium mb-5 leading-tight">Watch a synthetic commuter navigate through your custom city layout and observe their localized AQI exposure.</p>
          
          <div className="flex flex-col gap-3 mt-auto">
            {!isRunning ? (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg transition-all"
                onClick={() => setIsRunning(true)}
              >
                <Play size={18} /> Start Demo
              </button>
            ) : (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold transition-all"
                onClick={() => setIsRunning(false)}
              >
                <Pause size={18} /> Pause Demo
              </button>
            )}

            <button 
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold transition-all"
              onClick={() => {
                setIsRunning(false);
                pathIndexRef.current = 0;
                setDemoPosition(PREDEFINED_PATH[0]);
                setExposure(0);
                setCigarettes(0);
                setLiveLocalAqi(baseAqi);
              }}
            >
              <RotateCcw size={18} /> Reset Tracker
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Map */}
      <div className="flex-1 bg-[#1e293b] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {mode !== 'idle' && (
          <div className="absolute top-4 left-4 z-[400] bg-indigo-900/90 text-indigo-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border border-indigo-400 shadow-xl backdrop-blur-md">
            <AlertTriangle size={16} className="text-indigo-300"/> Click anywhere on the map to place a {promptType === 'add_tree' ? 'Greenspace' : 'Factory'}.
          </div>
        )}

        {isRunning && (
         <div className={`absolute top-4 right-1/2 translate-x-1/2 z-[400] px-6 py-3 rounded-full font-bold shadow-xl backdrop-blur-xl border flex items-center gap-3 transition-colors duration-300 ${liveLocalAqi > 200 ? 'bg-red-500/90 border-red-400 text-white' : 'bg-gray-900/90 border-white/20 text-gray-100'}`}>
            {liveLocalAqi > 200 ? <AlertTriangle size={18} /> : <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>}
            <span>Local Point AQI: {liveLocalAqi}</span>
            {liveLocalAqi > 200 && <span className="ml-2 pl-3 border-l border-white/30 text-red-200">Wear a Mask!</span>}
          </div>
        )}

        <MapContainer 
          center={[28.6139, 77.2090]} 
          zoom={12} 
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full z-10 custom-map-style"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapEventsHandler 
            mode={mode} setMode={setMode}
            trees={trees} setTrees={setTrees}
            factories={factories} setFactories={setFactories}
            setPromptPos={setPromptPos}
            setPromptType={setPromptType} setInputValue={setInputValue}
          />
          
          {trees.map(t => (
            <Circle
              key={t.id}
              center={[t.lat, t.lng]}
              radius={Math.max(100, t.density * 15)} 
              pathOptions={{
                color: t.selected ? '#eab308' : '#22c55e', 
                fillColor: t.selected ? '#eab308' : '#22c55e', 
                fillOpacity: 0.25,
                weight: t.selected ? 2 : 0, 
              }}
            />
          ))}

          {factories.map(f => (
            <Circle
              key={f.id}
              center={[f.lat, f.lng]}
              radius={Math.max(200, f.emission * 10)} 
              pathOptions={{
                color: '#ef4444', 
                fillColor: '#ef4444', 
                fillOpacity: 0.35,
                weight: 0, 
              }}
            />
          ))}

          <Marker position={demoPosition} icon={userIcon} />
        </MapContainer>
      </div>

      {/* 3. Real-Time Stats Panel */}
      <div className="w-[320px] shrink-0 bg-[#1e293b]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Regional Impact</h2>
          <p className="text-gray-400 text-xs font-medium mb-4">Calculated systemic AQI levels</p>
          
          <div className={`p-5 rounded-2xl border ${status.border} ${status.bg} flex flex-col items-center justify-center`}>
            <span className={`text-4xl font-black ${status.textCol}`}>{aqi}</span>
            <span className={`text-sm font-bold uppercase tracking-widest mt-1 ${status.textCol}`}>{status.text}</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 font-medium">Green Cover Units</span>
            <span className="text-white font-black">{trees.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 font-medium">Industrial Zones</span>
            <span className="text-white font-black">{factories.length}</span>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mt-auto">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Live Personal Exposure</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-red-500/10 pb-2">
              <span className="text-red-200/80 font-medium tracking-tight">Cumulative AQI</span>
              <span className="text-red-100 font-black">{exposure.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-200/80 font-medium tracking-tight">Inhaled Equivalent</span>
              <span className="text-red-500 font-black text-base">{cigarettes.toFixed(2)} Cigs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Value Input Modal */ }
      {promptPos && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#000000]/70 backdrop-blur-sm px-4">
          <div className="bg-[#1e293b] border border-white/10 shadow-2xl rounded-3xl p-6 w-[400px] animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-2">
              {promptType === 'tree' ? 'Plant Green Cover' : 'Establish Industrial Zone'}
            </h3>
            <p className="text-sm text-gray-400 mb-5 text-balance">
              {promptType === 'tree' ? 'Enter the anticipated tree density/acre (e.g. 10, 50, 100):' : 'Enter the expected emission output value for this site (10-500):'}
            </p>
            <input 
              type="number" 
              className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6 transition-all"
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button 
                className="px-5 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                onClick={() => { setPromptPos(null); setPromptType(null); setMode('idle'); }}
              >
                Cancel
              </button>
              <button 
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${promptType === 'tree' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                onClick={handlePlaceEntity}
              >
                Confirm Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
