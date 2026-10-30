import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Activity, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

export default function HeroSection({ onLaunchConsole }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-sky-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span className="font-mono text-sky-400">Enterprise Financial Architecture</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Zero Floating-Point Error</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.12]">
            The ACID-Compliant <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-white bg-clip-text text-transparent">
              Transaction Ledger
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Engineered with strict pessimistic locking, deadlock-free transfer pipelines, idempotency deduplication, and on-demand mathematical balance reconciliation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onLaunchConsole}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-xl shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Launch Live Ledger Console</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs tracking-wide flex items-center justify-center space-x-2 transition-all"
            >
              <Terminal className="h-4 w-4 text-slate-400" />
              <span>Explore Interactive API</span>
            </a>
          </div>

          {/* Metrics ticker */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/60 max-w-4xl mx-auto">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 text-left">
              <span className="text-[11px] font-mono text-slate-500 block">TEST COVERAGE</span>
              <span className="text-lg font-bold font-mono text-emerald-400">36 / 36 PASSED</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Concurrency stress included</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 text-left">
              <span className="text-[11px] font-mono text-slate-500 block">BALANCE DRIFT</span>
              <span className="text-lg font-bold font-mono text-sky-400">0.0000 DRIFT</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Cryptographic reconciliation</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 text-left">
              <span className="text-[11px] font-mono text-slate-500 block">CONCURRENCY</span>
              <span className="text-lg font-bold font-mono text-indigo-400">MUTUAL LOCK</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pessimistic row protection</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 text-left">
              <span className="text-[11px] font-mono text-slate-500 block">DEADLOCK SAFETY</span>
              <span className="text-lg font-bold font-mono text-purple-400">ORDERED LOCKS</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Coffman cycle elimination</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Ledger Mockup Preview */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-xs text-slate-400">aegis-ledger-core — active-session</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ACID Atomic Isolation: ACTIVE</span>
            </div>
          </div>

          {/* Mock Preview Content */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40">
            {/* Account Card Mock */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Account ID</span>
                <span className="font-mono text-sky-400">9b1deb4d...</span>
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-slate-500">Balance</span>
                <div className="text-3xl font-extrabold font-mono text-white tracking-tight">$1,450.00</div>
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                Holder: <span className="text-slate-200 font-semibold">Nexus Treasury Alpha</span>
              </div>
            </div>

            {/* Live Ledger Stream Mock */}
            <div className="md:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/80">
                <span>REAL-TIME TRANSACTION STREAM</span>
                <span className="text-emerald-400">LATEST-FIRST (DESC)</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">CREDIT</span>
                    <span className="text-slate-300">Stripe Wire Settlement</span>
                  </div>
                  <span className="text-emerald-400 font-bold">+$500.00</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">DEBIT</span>
                    <span className="text-slate-300">AWS Infrastructure Cluster</span>
                  </div>
                  <span className="text-rose-400 font-bold">-$120.00</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">TRANSFER</span>
                    <span className="text-slate-300">Internal Vault Sweep (Atomic)</span>
                  </div>
                  <span className="text-sky-400 font-bold">$250.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
