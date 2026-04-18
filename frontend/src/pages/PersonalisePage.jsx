import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Navigation, BarChart2, Trophy, User, Play, Square,
  LogIn, LogOut, Wind, Cigarette, AlertCircle, CheckCircle2,
  ChevronRight, Heart, Activity, Shield, Loader2, Sparkles
} from 'lucide-react';
import usePersonalise, { getConditionAlert, CONDITION_THRESHOLDS } from '../hooks/usePersonalise';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function cigColor(cigs) {
  if (cigs < 2) return 'text-green-400';
  if (cigs < 5) return 'text-yellow-400';
  if (cigs < 10) return 'text-orange-400';
  return 'text-red-400';
}

function notifStyle(level) {
  return {
    danger: 'border-red-500/40 bg-red-500/10 text-red-300',
    warn:   'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
    info:   'border-blue-500/40 bg-blue-500/10 text-blue-300',
    good:   'border-green-500/40 bg-green-500/10 text-green-300',
  }[level] || 'border-white/10 bg-white/5 text-gray-300';
}

function aqiLabel(aqi) {
  if (aqi <= 50)  return { text: 'Good',       color: 'text-green-400'  };
  if (aqi <= 100) return { text: 'Moderate',   color: 'text-yellow-400' };
  if (aqi <= 150) return { text: 'Unhealthy',  color: 'text-orange-400' };
  if (aqi <= 200) return { text: 'Very Unhealthy', color: 'text-red-400' };
  return              { text: 'Hazardous',    color: 'text-purple-400' };
}

const CONDITIONS = [
  { id: 'asthma',   label: 'Asthma',        icon: '🫁', desc: 'Alerts from AQI 75' },
  { id: 'copd',     label: 'COPD',          icon: '💨', desc: 'Alerts from AQI 60' },
  { id: 'heart',    label: 'Heart Disease', icon: '❤️', desc: 'Alerts from AQI 100' },
  { id: 'diabetes', label: 'Diabetes',      icon: '🩸', desc: 'Alerts from AQI 125' },
  { id: 'healthy',  label: 'Healthy Adult', icon: '💪', desc: 'Alerts from AQI 150' },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

// ── Mini AQI progress bar ──
function AqiBar({ aqi }) {
  const pct = Math.min((aqi / 500) * 100, 100);
  const col  = aqi <= 50 ? '#22c55e' : aqi <= 100 ? '#eab308' : aqi <= 150 ? '#f97316' : '#ef4444';
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: col }} />
    </div>
  );
}

// ── Tab button ──
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-indigo-600/40 text-white border border-indigo-500/40 shadow-lg shadow-indigo-900/30'
          : 'text-indigo-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Section wrapper ──
function Section({ children, className = '' }) {
  return (
    <div className={`bg-[#1e293b] rounded-[28px] border border-white/5 shadow-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Journey Tab
// ─────────────────────────────────────────────
function JourneyTab({ hook, profile }) {
  const {
    isTracking, startTracking, stopTracking,
    routePoints, currentPointIdx, currentPoint,
    notifications, totalCigs, totalMinutes,
  } = hook;

  const conditionAlerts = profile?.conditions && currentPoint
    ? getConditionAlert(profile.conditions, currentPoint.aqi)
    : [];

  return (
    <div className="space-y-6">
      {/* Top stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Cigarette Exposure',
            value: totalCigs.toFixed(2),
            unit: 'cigarettes',
            icon: '🚬',
            color: cigColor(totalCigs),
          },
          {
            label: 'Distance Tracked',
            value: `${Math.min(currentPointIdx * 0.8, 10).toFixed(1)} km`,
            unit: 'route',
            icon: '📍',
            color: 'text-blue-400',
          },
          {
            label: 'Time Exposed',
            value: `${Math.round(totalMinutes)} min`,
            unit: 'on route',
            icon: '⏱️',
            color: 'text-purple-400',
          },
        ].map((stat) => (
          <Section key={stat.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xl">{stat.icon}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/5 ${stat.color}`}>
                {stat.unit}
              </span>
            </div>
            <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
          </Section>
        ))}
      </div>

      {/* Route map (visual timeline) + controls */}
      <Section>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-white">Demo Route Tracker</h3>
              <p className="text-xs text-gray-500 mt-0.5">Simulated GPS journey with real-time AQI sampling</p>
            </div>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isTracking
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                  : 'bg-indigo-600 border border-indigo-500/40 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/40'
              }`}
            >
              {isTracking ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Start Demo</>}
            </button>
          </div>

          {/* Route waypoints timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-white/5" />
            <div
              className="absolute left-5 top-4 w-0.5 bg-indigo-500/50 transition-all duration-700"
              style={{ height: `${(currentPointIdx / Math.max(routePoints.length - 1, 1)) * 100}%` }}
            />
            <div className="space-y-2 pl-12">
              {routePoints.map((pt, i) => {
                const label = aqiLabel(pt.aqi);
                const isPast    = i < currentPointIdx;
                const isCurrent = i === currentPointIdx && isTracking;
                return (
                  <div
                    key={i}
                    className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                      isCurrent ? 'bg-indigo-500/15 border border-indigo-500/30' :
                      isPast    ? 'opacity-50' : 'opacity-30'
                    }`}
                  >
                    {/* Dot */}
                    <div
                      className={`absolute -left-[2.85rem] w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCurrent ? 'border-indigo-400 bg-indigo-400 scale-125 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]' :
                        isPast    ? 'border-green-500 bg-green-500' : 'border-white/20 bg-[#1e293b]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-200 truncate">{pt.name}</span>
                        {isCurrent && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">YOU ARE HERE</span>}
                      </div>
                      <AqiBar aqi={pt.aqi} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${label.color}`}>{pt.aqi}</div>
                      <div className={`text-[10px] font-bold ${label.color} opacity-70`}>{label.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Personalised condition alerts */}
      {conditionAlerts.length > 0 && (
        <div className="space-y-2">
          {conditionAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-2xl border font-medium text-sm ${
                alert.level === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notification feed */}
      <Section>
        <div className="p-6">
          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4">Live Exposure Alerts</h3>
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <Navigation className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Press Start Demo to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all font-medium ${notifStyle(n.level)}`}
                >
                  <span className="text-lg shrink-0">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug">{n.text}</p>
                    <p className="text-[10px] mt-1 opacity-50 font-bold">{n.time} · AQI {n.aqi} · {n.zone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Summary Tab
// ─────────────────────────────────────────────
function SummaryTab({ weeklyData }) {
  const total        = weeklyData.reduce((s, d) => s + d.cigs, 0).toFixed(1);
  const totalAvoided = weeklyData.reduce((s, d) => s + d.avoided, 0).toFixed(1);
  const maxCigs      = Math.max(...weeklyData.map(d => d.cigs));

  const tips = [
    { icon: '🏞️', title: 'Route through Aundh Park', saving: '40%', desc: 'Switching your morning commute via the park corridor reduces PM2.5 exposure by ~40% (saves ~2.1 cigs/day).' },
    { icon: '⏰', title: 'Shift commute to 7–8 AM', saving: '25%', desc: 'Peak traffic AQI hits between 9–10 AM. Leaving earlier keeps you in cleaner air and saves ~1.2 cigs.' },
    { icon: '🚇', title: 'Take Metro on Corridor 3', saving: '60%', desc: 'Public transport reduces your personal exposure even on polluted routes — saves ~3.4 cigs a week.' },
  ];

  return (
    <div className="space-y-6">
      {/* Weekly summary header */}
      <div className="grid grid-cols-2 gap-4">
        <Section className="p-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">This Week's Exposure</p>
          <p className="text-5xl font-black text-red-400">{total}</p>
          <p className="text-sm text-gray-400 mt-1 font-medium">cigarette equivalents</p>
          <p className="text-xs text-gray-600 mt-3 font-medium italic">City average this week: 35.0 🏙️</p>
        </Section>
        <Section className="p-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Exposure Avoided</p>
          <p className="text-5xl font-black text-green-400">{totalAvoided}</p>
          <p className="text-sm text-gray-400 mt-1 font-medium">cigarettes saved by clean routes</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Great effort this week!</span>
          </div>
        </Section>
      </div>

      {/* 7-day bar chart */}
      <Section>
        <div className="p-6">
          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-6">7-Day Exposure Chart</h3>
          <div className="flex items-end gap-3 h-36">
            {weeklyData.map((d) => {
              const pct    = (d.cigs / maxCigs) * 100;
              const avoide = (d.avoided / maxCigs) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className={`text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity ${cigColor(d.cigs)}`}>
                    {d.cigs}
                  </span>
                  <div className="w-full relative flex gap-1 items-end h-28">
                    {/* avoided (green overlay) */}
                    <div
                      className="flex-1 bg-green-500/20 rounded-t-lg border border-green-500/20 transition-all duration-700"
                      style={{ height: `${avoide}%` }}
                      title={`Avoided: ${d.avoided} cigs`}
                    />
                    {/* exposed */}
                    <div
                      className={`flex-1 rounded-t-lg transition-all duration-700 ${
                        d.cigs < 3 ? 'bg-green-500/60 border border-green-500/30' :
                        d.cigs < 6 ? 'bg-yellow-500/60 border border-yellow-500/30' :
                        'bg-red-500/60 border border-red-500/30'
                      }`}
                      style={{ height: `${pct}%` }}
                      title={`Exposed: ${d.cigs} cigs`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <div className="w-3 h-3 rounded bg-red-500/60" /> Exposure
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <div className="w-3 h-3 rounded bg-green-500/40" /> Avoided
            </div>
          </div>
        </div>
      </Section>

      {/* Route improvement tips */}
      <div>
        <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4 px-1">Smart Route Recommendations</h3>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <Section key={i}>
              <div className="p-5 flex items-start gap-4 group hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {tip.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-gray-200">{tip.title}</h4>
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-black">
                      Save {tip.saving}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{tip.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Leaderboard Tab
// ─────────────────────────────────────────────
function LeaderboardTab({ leaderboard }) {
  return (
    <div className="space-y-6">
      <Section>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">🏆</div>
            <div>
              <h3 className="text-lg font-black text-white">Weekly Clean Air Leaderboard</h3>
              <p className="text-xs text-gray-500 font-medium">Lower cigarette-equivalents = better air. You're among friends!</p>
            </div>
          </div>

          <div className="space-y-2">
            {leaderboard.map((person, rank) => {
              const isYou = person.highlight;
              const isBenchmark = person.isBenchmark;
              return (
                <div
                  key={person.name}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isYou
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-900/20'
                      : isBenchmark
                      ? 'bg-white/[0.02] border-white/5 border-dashed'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    rank === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    rank === 1 ? 'bg-gray-400/10 text-gray-400' :
                    rank === 2 ? 'bg-orange-500/10 text-orange-400' :
                    'bg-white/5 text-gray-500'
                  }`}>
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                  </div>

                  {/* Avatar */}
                  <div className={`text-2xl w-10 h-10 rounded-full flex items-center justify-center ${
                    isYou ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5'
                  }`}>
                    {person.avatar}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${isYou ? 'text-indigo-300' : isBenchmark ? 'text-gray-400' : 'text-gray-200'}`}>
                      {person.name}
                      {isYou && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">You</span>}
                      {isBenchmark && <span className="ml-2 text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">city avg</span>}
                    </p>
                    {/* cigarette bar */}
                    <div className="mt-1 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isYou ? 'bg-indigo-400' : isBenchmark ? 'bg-gray-500' :
                          person.cigs < 20 ? 'bg-green-500' : person.cigs < 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((person.cigs / 40) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${cigColor(person.cigs / 7)}`}>{person.cigs}</p>
                    <p className="text-[10px] text-gray-600 font-bold">cigs/week</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Fun fact card */}
      <Section>
        <div className="p-5 flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-200 mb-1">Did you know?</p>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              The average person in a metro city inhales air equivalent to <strong className="text-white">35 cigarettes per week</strong> just from outdoor pollution. 
              Taking clean routes and timing your commute can cut this by up to <strong className="text-green-400">60%</strong>.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Health Profile / Auth Tab
// ─────────────────────────────────────────────
function ProfileTab({ hook }) {
  const { user, authLoading, profile, profileLoading, handleGoogleSignIn, handleSignOut, saveProfile } = hook;

  const [step, setStep] = useState('idle'); // 'idle' | 'form' | 'done'
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'prefer-not-to-say',
    conditions: [],
    smoker: false,
  });
  const [saving, setSaving] = useState(false);

  const toggleCondition = (id) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(id)
        ? prev.conditions.filter(c => c !== id)
        : [...prev.conditions, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile(formData);
      setStep('done');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="space-y-6">
        <Section>
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl mx-auto mb-5">🔐</div>
            <h3 className="text-2xl font-black text-white mb-2">Personalise Your AQI Experience</h3>
            <p className="text-sm text-gray-400 font-medium max-w-md mx-auto leading-relaxed mb-8">
              Sign in to unlock personalised air quality alerts tailored to your health conditions, track your exposure history, and compete on the clean air leaderboard.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-3 bg-white text-gray-900 font-black text-sm px-7 py-3.5 rounded-2xl hover:bg-gray-100 transition-all shadow-xl shadow-white/10 active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>
            <p className="text-xs text-gray-600 mt-4 font-medium">
              New user? After signing in you'll complete a quick health profile form.
            </p>
          </div>
        </Section>

        {/* Feature preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Heart className="w-5 h-5 text-red-400" />, title: 'Health-aware alerts', desc: 'Condition-specific thresholds for asthma, COPD, heart disease & more.' },
            { icon: <Activity className="w-5 h-5 text-blue-400" />, title: 'Exposure history', desc: 'Week-over-week cigarette exposure dashboard personalised to your routes.' },
            { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'Safe zone guidance', desc: 'Real-time routing advice to keep your exposure below your personal danger threshold.' },
          ].map((f, i) => (
            <Section key={i} className="p-5">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h4 className="text-sm font-black text-gray-200 mb-1">{f.title}</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.desc}</p>
            </Section>
          ))}
        </div>
      </div>
    );
  }

  // Signed in but no profile → show form
  if (!profile && step !== 'done') {
    return (
      <div className="space-y-6">
        <Section>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + user.uid}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-indigo-400/30"
              />
              <div>
                <p className="font-black text-sm text-white">{user.displayName || 'Welcome!'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 font-bold transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-lg font-black text-white">Complete Your Health Profile</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-6">Your data is stored securely and used only to personalise AQI alerts for you.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Age</label>
                  <input
                    required
                    type="number"
                    min="1" max="120"
                    value={formData.age}
                    onChange={e => setFormData(p => ({ ...p, age: e.target.value }))}
                    placeholder="Your age"
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Gender</label>
                <div className="flex gap-2 flex-wrap">
                  {['male', 'female', 'non-binary', 'prefer-not-to-say'].map(g => (
                    <button
                      key={g} type="button"
                      onClick={() => setFormData(p => ({ ...p, gender: g }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        formData.gender === g
                          ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                          : 'bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      {g.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health conditions */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Health Conditions <span className="text-gray-600 normal-case font-medium">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.map(c => {
                    const selected = formData.conditions.includes(c.id);
                    return (
                      <button
                        key={c.id} type="button"
                        onClick={() => toggleCondition(c.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'bg-indigo-600/20 border-indigo-500/40 shadow-inner'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <p className={`text-sm font-black ${selected ? 'text-indigo-300' : 'text-gray-300'}`}>{c.label}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{c.desc}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smoker toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-black text-gray-200">Current Smoker?</p>
                  <p className="text-xs text-gray-500 font-medium">Affects your exposure thresholds</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, smoker: !p.smoker }))}
                  className={`relative w-12 h-6 rounded-full border transition-all duration-300 ${
                    formData.smoker ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                    formData.smoker ? 'bg-red-400 left-6' : 'bg-gray-500 left-0.5'
                  }`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/40 active:scale-95 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Health Profile & Personalise'}
              </button>
            </form>
          </div>
        </Section>
      </div>
    );
  }

  // Signed in + has profile
  const displayProfile = profile || {};
  const conditionLabels = (displayProfile.conditions || []).map(id => CONDITIONS.find(c => c.id === id)?.label).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Section>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + user.uid}
              alt="avatar"
              className="w-14 h-14 rounded-full border-2 border-indigo-400/40"
            />
            <div>
              <p className="font-black text-lg text-white">{displayProfile.name || user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email} · Age {displayProfile.age}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 font-bold transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
        <div className="p-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Your Health Conditions</p>
          <div className="flex flex-wrap gap-2">
            {conditionLabels.length > 0
              ? conditionLabels.map(label => (
                  <span key={label} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                    {label}
                  </span>
                ))
              : <span className="text-gray-500 text-sm font-medium">No conditions selected</span>
            }
          </div>
          {displayProfile.smoker && (
            <p className="text-xs text-red-400 font-bold mt-3 flex items-center gap-1.5">
              🚬 Marked as current smoker — thresholds adjusted accordingly
            </p>
          )}
        </div>
      </Section>

      {/* Active personalised thresholds */}
      <div>
        <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4 px-1">Your Personalised Alert Thresholds</h3>
        <div className="space-y-3">
          {(displayProfile.conditions || ['healthy']).map(id => {
            const threshold = CONDITION_THRESHOLDS[id];
            if (!threshold) return null;
            return (
              <Section key={id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CONDITIONS.find(c => c.id === id)?.icon || '❤️'}</span>
                    <div>
                      <p className="text-sm font-black text-gray-200">{threshold.label}</p>
                      <p className="text-xs text-gray-500 font-medium">Personalised alert thresholds</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-xs text-yellow-400 font-black">{threshold.warn}</p>
                      <p className="text-[10px] text-gray-600 font-bold">⚠️ Warn</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-red-400 font-black">{threshold.danger}</p>
                      <p className="text-[10px] text-gray-600 font-bold">🚨 Danger</p>
                    </div>
                  </div>
                </div>
              </Section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function PersonalisePage() {
  const { selectedCity, currentData } = useOutletContext();
  const hook = usePersonalise(selectedCity);
  const [activeTab, setActiveTab] = useState('journey');

  const tabs = [
    { id: 'journey',     label: 'My Journey',     icon: Navigation },
    { id: 'summary',     label: 'Weekly Summary',  icon: BarChart2  },
    { id: 'leaderboard', label: 'Leaderboard',     icon: Trophy     },
    { id: 'profile',     label: 'Health Profile',  icon: Shield     },
  ];

  return (
    <div className="space-y-6 w-full max-w-[1100px] mx-auto pb-10 fade-in-up fade-in-up-1">

      {/* Page header */}
      <div className="relative bg-[#1e293b] rounded-[32px] p-8 border border-white/5 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600 blur-[120px] opacity-10 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-600 blur-[100px] opacity-8 rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl border border-purple-500/20">🌬️</span>
              Your Air Story
            </h2>
            <p className="text-gray-400 mt-3 text-sm font-medium leading-relaxed max-w-lg">
              Track your personal pollution exposure in real-time, get condition-specific health alerts, and compete with friends on the Clean Air Leaderboard.
            </p>
          </div>
          {hook.user && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-black text-indigo-300">Personalised mode active</span>
            </div>
          )}
        </div>
      </div>

      {!hook.user || !hook.profile ? (
        <ProfileTab hook={hook} />
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-2 flex-wrap bg-[#1e293b] p-2 rounded-2xl border border-white/5">
            {tabs.map(t => (
              <TabBtn
                key={t.id}
                active={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                icon={t.icon}
                label={t.label}
              />
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'journey'     && <JourneyTab     hook={hook} profile={hook.profile} />}
          {activeTab === 'summary'     && <SummaryTab     weeklyData={hook.weeklyData} />}
          {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={hook.leaderboard} />}
          {activeTab === 'profile'     && <ProfileTab     hook={hook} />}
        </>
      )}
    </div>
  );
}
