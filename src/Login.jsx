import React, { useState } from 'react';
import { Lock, User, Terminal, ShieldAlert, Key, RefreshCw } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('AUTHENTICATION FAILED: ALL FIELDS REQUIRED.');
      return;
    }
    setLoading(true);
    setError('');

    // Simulate F1 mainframe validation latency
    setTimeout(() => {
      if (username === 'mercedes_admin' && password === 'petronas_strategy') {
        onLoginSuccess();
      } else {
        setError('ACCESS DENIED: INVALID QUANTUM ENCRYPTION KEYS.');
        setLoading(false);
      }
    }, 1200);
  };

  const loadDemoCredentials = () => {
    setUsername('mercedes_admin');
    setPassword('petronas_strategy');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex items-center justify-center relative font-sans overflow-hidden">
      {/* Telemetry Grid Background */}
      <div className="telemetry-grid-bg"></div>
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ffec]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff553d]/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md p-6 z-10">
        {/* Visor Canopy HUD Card */}
        <div className="telemetry-card rounded-sm bg-[#0e131f]/80 border border-white/10 relative shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
          {/* Subtle 5% Cyan overlay header tint */}
          <div className="absolute inset-0 bg-[#00eefc]/5 pointer-events-none rounded-sm"></div>

          {/* Card Header */}
          <div className="flex flex-col items-center gap-2 border-b border-white/5 pb-6 mb-6 z-10 relative">
            {/* Brand Logo */}
            <div className="font-headline-lg text-xl md:text-2xl font-black italic text-primary bg-primary/10 px-6 py-1.5 skew-x-[-12deg] border-l-4 border-primary flex items-center gap-3 shadow-[0_0_15px_rgba(0,255,236,0.15)]">
              <span className="unskew-content tracking-tighter uppercase font-mono">MERCEDES-AMG</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-mono mt-2">
              APEXOS // SECURED ACCESS GATEWAY
            </span>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5 z-10 relative">
            {/* Username field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-mono flex items-center gap-1.5">
                <User size={12} className="text-cyan-400" />
                Access Identity (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter access ID..."
                className="bg-slate-950/80 border border-slate-800 text-xs py-2 px-3 rounded-sm text-slate-100 font-mono outline-none focus:border-[#00eefc]/50 transition-all placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-mono flex items-center gap-1.5">
                <Key size={12} className="text-cyan-400" />
                Encryption Key (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="bg-slate-955 border border-slate-800 text-xs py-2 px-3 rounded-sm text-slate-100 font-mono outline-none focus:border-[#00eefc]/50 transition-all placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-sm text-[10px] text-[#ff553d] font-mono flex items-center gap-2 animate-pulse">
                <ShieldAlert size={14} className="text-[#ff553d]" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Trigger Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 border text-xs font-black uppercase font-mono tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-slate-900 border-slate-800 text-slate-500' 
                  : 'border-[#00ffec] bg-[#00ffec]/10 text-[#00ffec] hover:bg-[#00ffec] hover:text-black cursor-pointer shadow-[0_0_15px_rgba(0,255,236,0.1)]'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  CONNECTING MAINFRAME...
                </>
              ) : (
                <>
                  <Terminal size={14} />
                  ESTABLISH SECURE LINK
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-6 pt-5 border-t border-white/5 z-10 relative flex flex-col gap-3">
            <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase tracking-widest font-black font-mono">
              <span>Security Bypass Option</span>
              <span>DEV ACCESS ONLY</span>
            </div>
            
            <div className="bg-slate-900/40 border border-white/5 rounded-sm p-3 flex flex-col gap-2">
              <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
                Use the quick-load option below to populate demo credentials for testing the telemetry console.
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500 mb-1">
                <div>User: <span className="text-slate-300 font-bold">mercedes_admin</span></div>
                <div>Pass: <span className="text-slate-300 font-bold">petronas_strategy</span></div>
              </div>

              <button
                type="button"
                onClick={loadDemoCredentials}
                className="w-full py-1.5 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold rounded-sm transition-all"
              >
                LOAD DEMO CREDENTIALS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
