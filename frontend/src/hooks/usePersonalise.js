import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutUser } from '../lib/firebase';

// ─────────────────────────────────────────────
// AQI → PM2.5 μg/m³ approximate conversion
// ─────────────────────────────────────────────
function aqiToPm25(aqi) {
  if (aqi <= 50)  return (aqi / 50) * 12;
  if (aqi <= 100) return 12 + ((aqi - 50) / 50) * 23.4;
  if (aqi <= 150) return 35.4 + ((aqi - 100) / 50) * 19.6;
  if (aqi <= 200) return 55 + ((aqi - 150) / 50) * 95;
  if (aqi <= 300) return 150 + ((aqi - 200) / 100) * 100;
  return 250 + ((aqi - 300) / 100) * 250;
}

// 1 cigarette ≈ PM2.5 of 22 μg/m³ for 1 hour
function pm25ToCigarettes(pm25Ugm3, hours) {
  return (pm25Ugm3 / 22) * hours;
}

// ─────────────────────────────────────────────
// Demo GPS route — Pune city loop
// ─────────────────────────────────────────────
const DEMO_ROUTES = {
  Pune: [
    { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar', aqi: 142 },
    { lat: 18.5308, lng: 73.8475, name: 'FC Road',      aqi: 98  },
    { lat: 18.5523, lng: 73.8347, name: 'Aundh',        aqi: 65  },
    { lat: 18.5642, lng: 73.8219, name: 'Pimple Saudagar', aqi: 79 },
    { lat: 18.5595, lng: 73.7801, name: 'Hinjewadi IT Park', aqi: 48 },
    { lat: 18.5424, lng: 73.7930, name: 'Wakad',        aqi: 55  },
    { lat: 18.5256, lng: 73.8112, name: 'Baner',        aqi: 72  },
    { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar', aqi: 142 }, // loop back
  ],
  Mumbai: [
    { lat: 19.0760, lng: 72.8777, name: 'Bandra',       aqi: 178 },
    { lat: 19.0544, lng: 72.8378, name: 'Dharavi',      aqi: 215 },
    { lat: 19.0728, lng: 72.8826, name: 'Worli',        aqi: 162 },
    { lat: 19.0896, lng: 72.8656, name: 'Andheri',      aqi: 132 },
    { lat: 19.1197, lng: 72.9050, name: 'Goregaon',     aqi: 110 },
    { lat: 19.0760, lng: 72.8777, name: 'Bandra',       aqi: 178 },
  ],
  Delhi: [
    { lat: 28.6139, lng: 77.2090, name: 'Connaught Place', aqi: 280 },
    { lat: 28.6562, lng: 77.2410, name: 'Model Town',   aqi: 310 },
    { lat: 28.5918, lng: 77.0500, name: 'Dwarka',       aqi: 195 },
    { lat: 28.5355, lng: 77.3910, name: 'Noida Sec 18', aqi: 250 },
    { lat: 28.6139, lng: 77.2090, name: 'Connaught Place', aqi: 280 },
  ],
};

const FALLBACK_ROUTE = DEMO_ROUTES['Pune'];

// Health-condition AQI thresholds for personalised alerts
export const CONDITION_THRESHOLDS = {
  asthma:  { warn: 75,  danger: 100, label: 'Asthma' },
  copd:    { warn: 60,  danger: 80,  label: 'COPD'   },
  heart:   { warn: 100, danger: 150, label: 'Heart Disease' },
  diabetes:{ warn: 125, danger: 175, label: 'Diabetes' },
  healthy: { warn: 150, danger: 200, label: 'Healthy Adult' },
};

export function getConditionAlert(conditions, aqi) {
  let alerts = [];
  conditions.forEach(cond => {
    const threshold = CONDITION_THRESHOLDS[cond];
    if (!threshold) return;
    if (aqi >= threshold.danger) {
      alerts.push({
        level: 'danger',
        label: threshold.label,
        message: `🚨 DANGER for ${threshold.label}: AQI ${aqi} is critical! Avoid outdoor exposure immediately.`,
      });
    } else if (aqi >= threshold.warn) {
      alerts.push({
        level: 'warn',
        label: threshold.label,
        message: `⚠️ Warning for ${threshold.label}: AQI ${aqi} may affect your ${cond === 'heart' ? 'cardiovascular system' : 'respiratory system'}. Limit time outdoors.`,
      });
    }
  });
  return alerts;
}

// ─────────────────────────────────────────────
// Weekly mock data
// ─────────────────────────────────────────────
export function generateWeeklyData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    cigs: parseFloat((Math.random() * 8 + 1).toFixed(1)),
    avoided: parseFloat((Math.random() * 3).toFixed(1)),
  }));
}

// ─────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────
export default function usePersonalise(selectedCity) {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile]         = useState(null);  // Firestore health profile
  const [profileLoading, setProfileLoading] = useState(false);

  const [isTracking, setIsTracking]   = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentPointIdx, setCurrentPointIdx] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [totalCigs, setTotalCigs]     = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const [weeklyData] = useState(generateWeeklyData);
  const intervalRef  = useRef(null);
  const notifIdRef   = useRef(0);

  // ── Auth listener (safe — works even without Firebase configured) ──
  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        setProfileLoading(true);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setProfile(snap.data());
        } catch (e) {
          console.warn('[Firebase] Profile fetch error:', e);
        } finally {
          setProfileLoading(false);
        }
      }
    });
    return unsub;
  }, []);

  // ── Route init when city changes ──
  useEffect(() => {
    const route = DEMO_ROUTES[selectedCity] || FALLBACK_ROUTE;
    setRoutePoints(route);
    setCurrentPointIdx(0);
    setNotifications([]);
    setTotalCigs(0);
    setTotalMinutes(0);
  }, [selectedCity]);

  // ── Start / stop demo tracking ──
  const startTracking = useCallback(() => {
    setIsTracking(true);
    setCurrentPointIdx(0);
    setNotifications([]);
    setTotalCigs(0);
    setTotalMinutes(0);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isTracking || routePoints.length === 0) return;

    const STEP_SECONDS = 3; // advance one waypoint every 3 seconds (demo speed)

    intervalRef.current = setInterval(() => {
      setCurrentPointIdx(prev => {
        const next = prev + 1;
        if (next >= routePoints.length) {
          clearInterval(intervalRef.current);
          setIsTracking(false);
          return prev;
        }

        const point = routePoints[next];
        const exposureHours = STEP_SECONDS / 3600;
        const pm25 = aqiToPm25(point.aqi);
        const cigs = pm25ToCigarettes(pm25, exposureHours);

        setTotalCigs(c  => parseFloat((c + cigs).toFixed(3)));
        setTotalMinutes(m => m + (STEP_SECONDS / 60));

        // Build notification
        let notif;
        if (point.aqi >= 200) {
          notif = { level: 'danger', emoji: '🚨', text: `Toxic air at ${point.name}! Equivalent to ${(cigs * 60).toFixed(1)} cigarettes/hour.` };
        } else if (point.aqi >= 150) {
          notif = { level: 'warn',   emoji: '⚠️', text: `Unhealthy air at ${point.name} (AQI ${point.aqi}) — limit exposure.` };
        } else if (point.aqi > 100) {
          notif = { level: 'info',   emoji: '😷', text: `Moderate pollution at ${point.name} (AQI ${point.aqi}).` };
        } else {
          notif = { level: 'good',   emoji: '✅', text: `Clean air at ${point.name} (AQI ${point.aqi}) — great zone!` };
        }

        notif.id   = ++notifIdRef.current;
        notif.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        notif.zone = point.name;
        notif.aqi  = point.aqi;

        setNotifications(n => [notif, ...n].slice(0, 12));

        return next;
      });
    }, STEP_SECONDS * 1000);

    return () => clearInterval(intervalRef.current);
  }, [isTracking, routePoints]);

  // ── Firestore: save health profile ──
  const saveProfile = useCallback(async (data) => {
    if (!user || !db) return;
    const profileData = { ...data, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid), profileData);
    setProfile(profileData);
  }, [user]);

  // ── Auth actions ──
  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Google sign-in failed:', e);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const currentPoint = routePoints[currentPointIdx] || null;

  // Leaderboard (static demo friends)
  const leaderboard = [
    { name: 'You',       avatar: '🧑', cigs: parseFloat(weeklyData.reduce((s, d) => s + d.cigs, 0).toFixed(1)), highlight: true },
    { name: 'Ram',       avatar: '👨', cigs: 24.8 },
    { name: 'Priya',     avatar: '👩', cigs: 19.2 },
    { name: 'Arjun',     avatar: '🧔', cigs: 31.5 },
    { name: 'Sneha',     avatar: '👱‍♀️', cigs: 14.3 },
    { name: 'City Avg',  avatar: '🏙️', cigs: 35.0, isBenchmark: true },
  ].sort((a, b) => a.cigs - b.cigs);

  return {
    // Auth
    user, authLoading, profile, profileLoading,
    handleGoogleSignIn, handleSignOut, saveProfile,
    // Tracking
    isTracking, startTracking, stopTracking,
    routePoints, currentPointIdx, currentPoint,
    notifications, totalCigs, totalMinutes,
    // Data
    weeklyData, leaderboard,
  };
}
