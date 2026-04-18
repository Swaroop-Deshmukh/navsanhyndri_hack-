import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, TrendingUp, AlertTriangle, Settings, User, Download, Lightbulb, UserCog, Building2, Menu, Globe, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportGenerator from '../components/ReportGenerator';
import heroBg from '../assets/image.png';

function HeroSection() {
  return (
    <div className="relative w-full h-[100dvh] shrink-0 overflow-hidden flex flex-col items-center justify-center">
      {/* Background Image & Overlays */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[20s] ease-linear hover:scale-110" 
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Dark gradient overlay for extreme readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]"></div>
      
      {/* Top Left Logo & Name */}
      <div className="absolute top-6 left-[6.5rem] z-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/30 backdrop-blur-md border border-indigo-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)]">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white tracking-[0.3em] drop-shadow-sm uppercase mt-1">
          GEO BREATH
        </h1>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-6 animate-in zoom-in-95 fade-in duration-1000 delay-300">
        <span className="px-5 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md shadow-xl">
          Actionable Environmental Intelligence
        </span>
        <h2 className="text-6xl md:text-7xl font-black text-white leading-tight tracking-tight mb-8 drop-shadow-2xl">
          Breathe the Data.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Save the City.</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl mb-12 drop-shadow-md">
          At Geo Breath, we fuse real-time spatial telemetry with predictive AI to empower city administrators. 
          Observe hyper-local pollution metrics, forecast ten days into the future, and instantly draft actionable policies to protect citizens before disaster strikes.
        </p>

        {/* Scroll Indicator */}
        <button 
          onClick={() => {
            const container = document.getElementById('main-scroll-container');
            if (container) {
              container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center animate-bounce mt-10 opacity-70 hover:opacity-100 transition-all cursor-pointer outline-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-3">Scroll below</p>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors">
            <ChevronDown className="w-5 h-5 text-indigo-300" />
          </div>
        </button>
      </div>
    </div>
  );
}

export default function MainLayout({ contextData }) {
  const location = useLocation();
  const { citiesData, selectedCity, setSelectedCity, selectedZone, setSelectedZone, activeAlerts, setActiveAlerts } = contextData || {};
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Forecasting', path: '/predictions', icon: TrendingUp },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
    { name: 'Simulation Plan', path: '/suggestions', icon: Lightbulb },
    { name: 'Personalise', path: '/personalise', icon: UserCog },
    { name: 'Govt. City planning', path: '/planning', icon: Building2 },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/map': return 'Geospatial Telemetry';
      case '/predictions': return 'Predictive Analytics';
      case '/emergency': return 'Emergency Protocol';
      case '/suggestions': return 'Master Action Plan';
      case '/personalise': return 'My Air Story';
      case '/planning': return 'Govt. City Planning module';
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
      <aside className={`bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white flex flex-col shadow-2xl z-20 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 backdrop-blur-md border border-indigo-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-[0.2em] drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white uppercase mt-0.5">GEO BREATH</h1>
        </div>

        {/* User Profile Snippet */}
        <div className="mx-4 mb-6 relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50"></div>
          <div className="relative px-4 py-3 flex items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center">
                <User className="text-white w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">City Administrator</p>
              <p className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider truncate">{selectedCity} Ops</p>
            </div>
          </div>
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

      </aside>

      {/* Main Content Area */}
      <div id="main-scroll-container" className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative w-full bg-[#0f172a] custom-scrollbar">
        {/* Global Floating Toggle */}
        <div className="sticky top-0 z-[100] w-full h-0 pointer-events-none">
          <div className="absolute top-5 left-8 pointer-events-auto">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-12 h-12 rounded-xl bg-[#1e293b]/80 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {location.pathname === '/' && <HeroSection />}
        
        {/* Top Header - Dark Mode styled */}
        <header className="sticky top-0 h-[90px] bg-[#1e293b]/95 backdrop-blur-2xl pr-10 pl-[6.5rem] flex items-center justify-between z-50 border-b border-white/5 shrink-0 shadow-sm transition-all duration-500">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-[26px] font-black text-gray-100 tracking-tight drop-shadow-sm">{getPageTitle()}</h2>
              <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Real-time Environmental Telemetry</p>
            </div>
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
        <main id="main-content-area" className="flex-1 px-10 py-8 relative w-full">
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
