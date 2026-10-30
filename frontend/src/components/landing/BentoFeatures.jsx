import React from 'react';
import { Layers, ShieldCheck, Hash, Key, Cpu, RefreshCw } from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="invariants" className="py-20 border-t border-slate-800/80 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Guarantees & Invariants</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Financial Rigor by Design
          </h2>
          <p className="text-sm text-slate-400">
            Built to survive edge cases, network retries, and high-contention traffic without manual intervention.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: Precision */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 w-fit">
              <Hash className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Arbitrary-Precision Arithmetic</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Standard IEEE 754 floats accumulate micro-cents errors (<code className="text-slate-300 font-mono">0.1 + 0.2 = 0.30000000000000004</code>). AegisLedger uses Python <code className="text-sky-300 font-mono">Decimal</code> and SQL <code className="text-sky-300 font-mono">NUMERIC(18, 4)</code>.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800">
              Tolerance: ±0.00000000 (Zero Drift)
            </div>
          </div>

          {/* Bento Card 2: Idempotency */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Idempotency & Replay Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Every transaction requires a unique <code className="text-indigo-300 font-mono">reference_id</code> per account. Replaying an identical transaction returns HTTP 409 Conflict without altering account balance.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-sky-400 border border-slate-800">
              Constraint: UNIQUE (account_id, reference_id)
            </div>
          </div>

          {/* Bento Card 3: Immutability */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Strict Append-Only Log</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Once committed, transactions are physically immutable. There are no <code className="text-rose-300 font-mono">PUT</code>, <code className="text-rose-300 font-mono">PATCH</code>, or <code className="text-rose-300 font-mono">DELETE</code> routes for transaction history in the API.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-indigo-400 border border-slate-800">
              Auditability: Non-destructive event sourcing
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
