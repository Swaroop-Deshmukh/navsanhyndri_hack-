import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getCurrentData, getCities, getHistoryData } from "./api";
import { Loader2 } from "lucide-react";

import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import PredictionsPage from "./pages/PredictionsPage";
import EmergencyPage from "./pages/EmergencyPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import PersonalisePage from "./pages/PersonalisePage";

export default function App() {
  const [currentData, setCurrentData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Pune");
  const [selectedZone, setSelectedZone] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    getCities()
      .then(res => { if (res && res.length > 0) setCitiesData(res); })
      .catch(err => console.log('City fetch error', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch current and history in parallel for speed
        const [curr, hist] = await Promise.all([
          getCurrentData(selectedCity, selectedZone),
          getHistoryData(selectedCity, 24),
        ]);
        if (!isMounted) return;
        setCurrentData(curr);
        setHistoryData(hist);
        setFetchError(null);
      } catch (err) {
        console.error('Error fetching data', err);
        if (isMounted) setFetchError('Cannot reach backend.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    setLoading(true);
    fetchData();
    const iv = setInterval(fetchData, 30000); // 30s polling (was 10s – reduces rate limit risk)
    return () => { isMounted = false; clearInterval(iv); };
  }, [selectedCity, selectedZone]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 bg-[#1e293b] rounded-3xl shadow-xl flex items-center justify-center border border-white/5 relative overflow-hidden">
           <Loader2 className="w-10 h-10 animate-spin text-[#3b82f6] relative z-10" />
        </div>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing Telemetry...</p>
      </div>
    );
  }

  const maxAqi = currentData.length > 0 ? Math.max(...currentData.map(z => z.aqi)) : 0;

  const contextData = { 
    currentData,
    historyData,
    maxAqi, 
    fetchError,
    citiesData,
    selectedCity,
    setSelectedCity,
    selectedZone,
    setSelectedZone,
    activeAlerts,
    setActiveAlerts
  };

  return (
    <BrowserRouter>
      {fetchError && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-red-900 border-b border-red-700 text-center py-2 text-sm font-bold text-red-200 shadow-sm">
          ⚠️ Network disconnected. Displaying cached simulation data.
        </div>
      )}
      <Routes>
        <Route path="/" element={<MainLayout contextData={contextData} />}>
           <Route index element={<DashboardPage />} />
           <Route path="map" element={<MapPage />} />
           <Route path="predictions" element={<PredictionsPage />} />
           <Route path="emergency" element={<EmergencyPage />} />
           <Route path="suggestions" element={<SuggestionsPage />} />
           <Route path="personalise" element={<PersonalisePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
