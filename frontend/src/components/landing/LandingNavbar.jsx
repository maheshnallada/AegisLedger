import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Menu, X, Terminal, Cpu } from 'lucide-react';
import { api } from '../../services/api';

export default function LandingNavbar({ onLaunchConsole }) {
  const [health, setHealth] = useState({ status: 'checking' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch {
        setHealth({ status: 'offline' });
      }
    }
    check();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white font-sans">AegisLedger</span>
              <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Core v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-400">
          <a href="#architecture" className="hover:text-slate-100 transition-colors">
            Architecture
          </a>
          <a href="#invariants" className="hover:text-slate-100 transition-colors">
            Core Guarantees
          </a>
          <a href="#api" className="hover:text-slate-100 transition-colors">
            API Sandbox
          </a>
          <a href="#concurrency" className="hover:text-slate-100 transition-colors">
            Concurrency & Locking
          </a>
        </nav>

        {/* Right CTA & Health Pill */}
        <div className="hidden sm:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                health.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </span>
            <span className="text-slate-300 font-mono capitalize">
              {health.status === 'healthy' ? 'API Online' : 'Offline'}
            </span>
          </div>

          <button
            onClick={onLaunchConsole}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>Launch Console</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-3 text-xs">
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 py-1"
          >
            Architecture
          </a>
          <a
            href="#invariants"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 py-1"
          >
            Core Guarantees
          </a>
          <a
            href="#api"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 py-1"
          >
            API Sandbox
          </a>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchConsole();
              }}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-medium text-center flex items-center justify-center space-x-2"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
