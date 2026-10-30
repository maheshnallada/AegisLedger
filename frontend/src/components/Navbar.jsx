import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowLeft, Terminal } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ onRefresh, onBackToLanding }) {
  const [health, setHealth] = useState({ status: 'checking', service: '' });

  useEffect(() => {
    async function check() {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline' });
      }
    }
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Product Overview</span>
            </button>
          )}

          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">AegisLedger</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Console
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                health.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </span>
            <span className="text-slate-300 font-medium capitalize">
              {health.status === 'healthy' ? 'API Online' : health.status}
            </span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-sky-400 transition-colors font-mono hidden md:inline-block"
          >
            OpenAPI Docs ↗
          </a>
        </div>
      </div>
    </header>
  );
}
