import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, TrendingUp, AlertTriangle, Settings, User, Download, Lightbulb, UserCog } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportGenerator from '../components/ReportGenerator';

export default function MainLayout({ contextData }) {
  const location = useLocation();
  const { citiesData, selectedCity, setSelectedCity, selectedZone, setSelectedZone, activeAlerts, setActiveAlerts } = contextData || {};

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Forecasting', path: '/predictions', icon: TrendingUp },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
    { name: 'Simulation Plan', path: '/suggestions', icon: Lightbulb },
    { name: 'Personalise', path: '/personalise', icon: UserCog },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/map': return 'Geospatial Telemetry';
      case '/predictions': return 'Predictive Analytics';
      case '/emergency': return 'Emergency Protocol';
      case '/suggestions': return 'Master Action Plan';
      case '/personalise': return 'My Air Story';
      default: return 'Control Center';
    }
  };

  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);

  const handleExportPdf = () => {
    setIsGeneratingReport(true);
  };

  React.useEffect(() => {
    if (!activeAlerts || activeAlerts.length === 0) return;
    const timers = activeAlerts.map(alert =>
      setTimeout(() => {
        setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, alert.autoDismiss || 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [activeAlerts, setActiveAlerts]);

  const currentCityObj = citiesData?.find(c => c.name === selectedCity);
  const zonesForCity = currentCityObj ? currentCityObj.zones : [];

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans overflow-hidden text-gray-200">

      {/* Global Toast Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="fixed top-6 right-1/2 translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="bg-red-500/90 text-white p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.5)] border border-red-400 backdrop-blur-md animate-in slide-in-from-top-10 fade-in duration-300 pointer-events-auto">
              <div className="flex items-center gap-3 mb-1">
                <AlertTriangle className="w-5 h-5 text-red-100" />
                <h4 className="font-black tracking-wide">{alert.title}</h4>
              </div>
              <p className="text-sm font-medium text-red-100 leading-tight ml-8">{alert.desc}</p>
            </div>
          ))}
        </div>
      )}
      {/* Sidebar - Matching Reference 1 deep blue/purple UI */}
      <aside className="w-[280px] bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white flex flex-col shadow-2xl z-20 hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10">
            <span className="text-2xl">🌍</span>
          </div>
          <h1 className="text-2xl font-black tracking-wide drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">AQI Pulse</h1>
        </div>

        {/* User Profile Snippet */}
        <div className="px-8 py-6 flex flex-col items-center border-b border-white/5 mb-6 bg-white/5 mx-4 rounded-3xl backdrop-blur-sm shadow-inner">
          <div className="w-16 h-16 rounded-full bg-white/20 p-1 mb-3">
            <div className="w-full h-full rounded-full bg-[#1e293b] border-[2px] border-indigo-400 flex items-center justify-center overflow-hidden">
              <User className="text-indigo-200 w-8 h-8" />
            </div>
          </div>
          <p className="font-bold text-md mt-1 tracking-tight text-gray-100">System Admin</p>
          <p className="text-xs text-indigo-200 font-medium">{selectedCity} Operations</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-semibold text-[14px] ${isActive
                  ? 'bg-blue-600/40 shadow-lg backdrop-blur-lg translate-x-2 border border-blue-500/30 text-white'
                  : 'hover:bg-white/5 text-indigo-200 hover:translate-x-1'
                }`
              }
            >
              <item.icon className="w-[20px] h-[20px]" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-2xl p-5 backdrop-blur-md border border-white/5 shadow-inner">
            <p className="text-sm font-bold mb-1 text-gray-200">Hackathon 2025</p>
            <p className="text-xs text-indigo-300 font-medium opacity-80">Powered by Central Government</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full bg-[#0f172a]">
        {/* Top Header - Dark Mode styled */}
        <header className="h-[90px] bg-[#1e293b]/90 backdrop-blur-xl px-10 flex items-center justify-between z-10 border-b border-white/5 shrink-0 shadow-sm">
          <div>
            <h2 className="text-[26px] font-black text-gray-100 tracking-tight drop-shadow-sm">{getPageTitle()}</h2>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Real-time Environmental Telemetry</p>
          </div>

          <div className="flex items-center gap-6">
            {/* City Selector */}
            <div className="flex items-center gap-3 bg-[#0f172a] rounded-xl px-4 py-2 border border-white/10 shadow-inner">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region</span>
              <select
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none pr-2"
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setSelectedZone(""); }}
              >
                {citiesData?.map(c => (
                  <option key={c.name} value={c.name} className="bg-[#1e293b]">{c.name}</option>
                ))}
              </select>
            </div>

            {/* Zone Selector */}
            <div className="flex items-center gap-3 bg-[#0f172a] rounded-xl px-4 py-2 border border-white/10 shadow-inner">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zone</span>
              <select
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none max-w-[150px]"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="" className="bg-[#1e293b]">All Zones</option>
                {zonesForCity?.map(z => (
                  <option key={z} value={z} className="bg-[#1e293b]">{z}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30 rounded-xl px-5 py-2.5 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Export PDF</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main id="main-content-area" className="flex-1 overflow-x-hidden overflow-y-auto px-10 py-8 relative w-full custom-scrollbar">
          <Outlet context={contextData} />
        </main>
      </div>

      {/* Professional Report Generator Overlay */}
      {isGeneratingReport && (
        <ReportGenerator contextData={contextData} onClose={() => setIsGeneratingReport(false)} />
      )}
    </div>
  );
}
