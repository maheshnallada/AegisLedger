import React, { useState } from 'react';
import { Lock, ArrowRightLeft, ShieldCheck, Database, GitMerge, Check, AlertTriangle } from 'lucide-react';

export default function ArchitectureSection() {
  const [activeTab, setActiveTab] = useState('locking');

  return (
    <section id="architecture" className="py-20 border-t border-slate-800/80 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
            <Database className="h-3.5 w-3.5" />
            <span>Distributed Systems Design</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How AegisLedger Prevents System Failure
          </h2>
          <p className="text-sm text-slate-400">
            Financial software cannot rely on optimistic assumptions. We built defensive barriers against concurrency corruption, deadlock cycles, and balance drift.
          </p>

          {/* Selector Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('locking')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'locking'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Double-Spending Defense
            </button>
            <button
              onClick={() => setActiveTab('deadlock')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'deadlock'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Deadlock Elimination
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'reconciliation'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Self-Reconciliation
            </button>
          </div>
        </div>

        {/* Tab Content Panes */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
          {activeTab === 'locking' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Mutual Exclusion & Pessimistic Row Locking</h3>
                  <p className="text-xs text-slate-400">Tested with 10 concurrent debit threads in parallel</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <div className="text-rose-400 font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Naive Implementation (Vulnerable)</span>
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed">
                    Two parallel debits of $80 arrive on an account with $100 balance. Both threads read balance = $100 simultaneously. Both pass validation and deduct $80. Result: Balance drops to -$60 (Fatal double-spend).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                    <Check className="h-4 w-4" />
                    <span>AegisLedger Protocol (Protected)</span>
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed">
                    Pessimistic row locking acquires exclusive lock. Thread 1 updates balance to $20. Thread 2 evaluates against the mutated state, is immediately rejected with 400 Insufficient Funds. Zero overdraft possible.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800">
                <span className="text-slate-500">SQL Invariant:</span> SELECT ... FOR UPDATE; UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance &gt;= :amt;
              </div>
            </div>
          )}

          {activeTab === 'deadlock' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Deterministic Lock Ordering in Cross-Account Transfers</h3>
                  <p className="text-xs text-slate-400">Eliminating Coffman Circular Wait Conditions</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <p>
                  When Account A transfers to Account B while Account B simultaneously transfers to Account A, standard locking algorithms produce a database deadlock where both transactions freeze waiting on each other's lock.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[12px]">
                  <div className="text-sky-400 font-semibold">Mathematical Order Function:</div>
                  <code className="text-emerald-400 block">
                    first_id, second_id = sorted([source_id, destination_id])
                  </code>
                  <div className="text-slate-400 text-[11px]">
                    Locks are always acquired on min(ID_A, ID_B) first, then max(ID_A, ID_B). This mathematically eliminates cyclic dependencies.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">On-Demand Mathematical Ledger Reconciliation</h3>
                  <p className="text-xs text-slate-400">Continuous Proof of Zero Balance Drift</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <p>
                  In AegisLedger, the cached balance column is an optimization for $O(1)$ fast reads, but the single source of truth is always the append-only ledger history.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[12px] space-y-2">
                  <div className="text-slate-400 text-[11px]">Audit Proof Formula:</div>
                  <div className="text-emerald-400 font-semibold">
                    Computed Balance = SUM(Valid Credits) - SUM(Valid Debits)
                  </div>
                  <div className="text-sky-400 font-semibold">
                    Drift = Cached Balance - Computed Balance == 0.0000
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
