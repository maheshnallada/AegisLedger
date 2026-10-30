import React from 'react';
import { ShieldCheck, Terminal, Cpu } from 'lucide-react';

export default function LandingFooter({ onLaunchConsole }) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">AegisLedger</span>
              <p className="text-slate-400 text-[11px]">ACID Transaction Ledger Architecture</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">FastAPI</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Python 3.12</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">SQLAlchemy 2.0</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">React 18 + Vite</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Docker</span>
          </div>

          <button
            onClick={onLaunchConsole}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-semibold transition-colors"
          >
            Launch Live Console →
          </button>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] font-mono gap-2">
          <div>
            AegisLedger Core • Fully verified with 36/36 automated integration & concurrency stress tests.
          </div>
          <div className="flex items-center space-x-4">
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              Interactive OpenAPI
            </a>
            <a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              ReDoc
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
