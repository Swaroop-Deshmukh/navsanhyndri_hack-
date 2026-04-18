import React, { useState } from 'react';
import { Lock, Shield, User, Key, AlertTriangle } from 'lucide-react';

export default function GovtLoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    // Demo credentials: admin / gov-admin-2026
    setTimeout(() => {
      if (username === 'admin' && password === 'gov-admin-2026') {
        onLogin();
      } else {
        setError('Invalid credentials. Please try demo: admin / gov-admin-2026');
        setIsLoggingIn(false);
      }
    }, 800);
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-140px)] animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#1e293b]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150px] bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-white text-center tracking-tight mb-2">Govt. Access Portal</h2>
          <p className="text-gray-400 text-sm font-medium text-center mb-8">
            Restricted access for authorized city planners and officials only.
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Username / ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  placeholder="Enter planner ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password / PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  placeholder="Enter access code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !username || !password}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Secure Login
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-xs text-gray-400 mb-1">Demo Credentials:</p>
            <p className="text-sm font-semibold text-gray-200">User: <span className="text-blue-400">admin</span></p>
            <p className="text-sm font-semibold text-gray-200">Pass: <span className="text-blue-400">gov-admin-2026</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
