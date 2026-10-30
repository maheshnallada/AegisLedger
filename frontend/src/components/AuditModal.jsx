import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AuditModal({ isOpen, onClose, account }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && account) {
      loadAudit();
    }
  }, [isOpen, account]);

  async function loadAudit() {
    setLoading(true);
    setError('');
    try {
      const data = await api.reconcileAccount(account.id);
      setAudit(data);
    } catch (err) {
      setError(err.message || 'Audit failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Mathematical Ledger Audit</h3>
            <p className="text-xs text-slate-400">
              Audit for: <span className="text-slate-200 font-medium">{account.name}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
            <p className="text-xs">Computing append-only ledger transaction sums...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        ) : audit ? (
          <div className="space-y-4">
            {audit.is_reconciled ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">100% Mathematically Reconciled</h4>
                  <p className="text-xs text-emerald-400/80">
                    The materialized account balance matches the exact transactional sum (zero drift).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-300">Balance Drift Detected!</h4>
                  <p className="text-xs text-rose-400/80">
                    Cached balance deviates from the immutable transaction ledger sum.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Cached Balance:</span>
                <span className="text-base font-mono font-bold text-white">
                  ${parseFloat(audit.cached_balance).toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Computed Sum:</span>
                <span className="text-base font-mono font-bold text-sky-400">
                  ${parseFloat(audit.computed_balance).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Valid Credits:</span>
                <span className="font-mono text-emerald-400">+${parseFloat(audit.total_credits).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Valid Debits:</span>
                <span className="font-mono text-rose-400">-${parseFloat(audit.total_debits).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span>Total Ledger Entries:</span>
                <span className="font-mono text-slate-200">{audit.total_transactions} txs</span>
              </div>
              <div className="flex justify-between text-slate-300 font-semibold pt-2 border-t border-slate-800">
                <span>Audit Drift:</span>
                <span className="font-mono text-emerald-400">${parseFloat(audit.drift).toFixed(4)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={loadAudit}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Re-verify</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

