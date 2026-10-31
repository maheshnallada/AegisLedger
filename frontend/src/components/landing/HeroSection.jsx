import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Activity,
  CheckCircle2,
  ChevronRight,
  Terminal,
  Zap,
  Sparkles,
  RefreshCw,
  Server
} from 'lucide-react';

export default function HeroSection({ onLaunchConsole }) {
  // Interactive mini simulation state for the hero preview
  const [demoBalance, setDemoBalance] = useState(1250.0);
  const [demoStatus, setDemoStatus] = useState('Idle (Awaiting command)');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const simulateDebit = () => {
    if (demoBalance < 150) {
      setDemoStatus('Rejected: 400 Insufficient Funds');
      return;
    }
    setDemoStatus('Processing: Pessimistic Row Lock Acquired...');
    setTimeout(() => {
      setDemoBalance((prev) => prev - 150.0);
      setDemoStatus('Success: 201 Created (Ref: SIM-TX-902)');
      setAuditResult(null);
    }, 400);
  };

  const simulateCredit = () => {
    setDemoStatus('Processing: Atomic Credit Committing...');
    setTimeout(() => {
      setDemoBalance((prev) => prev + 300.0);
      setDemoStatus('Success: 201 Created (Ref: SIM-TX-903)');
      setAuditResult(null);
    }, 400);
  };

  const simulateAudit = () => {
    setIsAuditing(true);
    setDemoStatus('Reconciling: Sum(Credits) - Sum(Debits)...');
    setTimeout(() => {
      setIsAuditing(false);
      setAuditResult({
        drift: '0.0000',
        reconciled: true,
        credits: '1,550.0000',
        debits: '300.0000'
      });
      setDemoStatus('Audit Complete: Mathematical Integrity 100%');
    }, 500);
  };

  // Determine current host for docs link (works seamlessly on EC2 public IP or localhost)
  const docsUrl = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000/docs`
    : 'http://localhost:8000/docs';

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Ambient background glow & grid lines */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-sky-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-sky-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 font-semibold">AWS + Supabase Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-sans">Zero Floating-Point Error</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.12]">
            High-Integrity, ACID-Compliant <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-white bg-clip-text text-transparent">
              Transaction Ledger
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Engineered with pessimistic row locking, deadlock-free transfers ($\min(\text{ID}_A, \text{ID}_B)$), idempotency deduplication, and on-demand mathematical balance reconciliation.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onLaunchConsole}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-xl shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Launch Live Ledger Console</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs tracking-wide flex items-center justify-center space-x-2 transition-all backdrop-blur-sm"
            >
              <Terminal className="h-4 w-4 text-sky-400" />
              <span>Explore Interactive Swagger API</span>
            </a>
          </div>

          {/* Quantitative Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/60 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-left backdrop-blur-sm">
              <span className="text-[11px] font-mono text-slate-500 block">TEST COVERAGE</span>
              <span className="text-lg font-bold font-mono text-emerald-400">36 / 36 PASSED</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Concurrency stress included</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-left backdrop-blur-sm">
              <span className="text-[11px] font-mono text-slate-500 block">PRECISION GUARANTEE</span>
              <span className="text-lg font-bold font-mono text-sky-400">NUMERIC(18, 4)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Arbitrary Decimal arithmetic</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-left backdrop-blur-sm">
              <span className="text-[11px] font-mono text-slate-500 block">CONCURRENCY</span>
              <span className="text-lg font-bold font-mono text-indigo-400">SELECT FOR UPDATE</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pessimistic row locking</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-left backdrop-blur-sm">
              <span className="text-[11px] font-mono text-slate-500 block">DEADLOCK DEFENSE</span>
              <span className="text-lg font-bold font-mono text-purple-400">ORDERED LOCKS</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Coffman cycle elimination</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Ledger Mockup Preview */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Terminal Title Bar */}
          <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-xs text-slate-400">
                aegis-ledger-core — live-simulation-sandbox
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ACID Atomic Isolation: ACTIVE</span>
            </div>
          </div>

          {/* Interactive Simulation Controls Bar */}
          <div className="px-5 py-3 bg-slate-900/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Interactive Quick-Test:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={simulateDebit}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-mono text-[11px] transition-all cursor-pointer"
              >
                - Debit $150.00
              </button>
              <button
                onClick={simulateCredit}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-mono text-[11px] transition-all cursor-pointer"
              >
                + Credit $300.00
              </button>
              <button
                onClick={simulateAudit}
                disabled={isAuditing}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 font-mono text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Verify Audit Drift</span>
              </button>
            </div>
          </div>

          {/* Mock Preview Content */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40">
            {/* Account Card Mock */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Account ID (UUID)</span>
                <span className="font-mono text-[10px] text-sky-400">PROD-PRIMARY</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 truncate bg-slate-950 p-2 rounded-lg border border-slate-800">
                1bd6efc7-dc33-42e8-842a-1eccf214c497
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Current Balance</span>
                <span className="text-2xl font-bold font-mono text-white">
                  ${demoBalance.toFixed(4)}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1.5">
                <Lock className="h-3 w-3 text-indigo-400" />
                <span>Row Lock: Pessimistic Guard</span>
              </div>
            </div>

            {/* Live Pipeline Monitor Mock */}
            <div className="md:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Execution Journal & Status</span>
                <span className="text-emerald-400 font-mono text-[11px]">PostgreSQL 15 (Supabase)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                <div className="flex items-center space-x-2 text-sky-400 text-[11px]">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  <span>{demoStatus}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Transaction strategy resolved via StrategyFactory. Non-negative constraint enforced.
                </div>
              </div>

              {auditResult && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                  <span>Reconciliation: Mathematical Drift = {auditResult.drift}</span>
                  <span className="font-bold">STATUS: RECONCILED</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
                <span>Idempotency: UNIQUE(account_id, reference_id)</span>
                <button
                  onClick={onLaunchConsole}
                  className="text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                >
                  <span>Open Full Dashboard</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
