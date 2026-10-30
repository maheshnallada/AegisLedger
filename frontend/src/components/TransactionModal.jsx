import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function TransactionModal({ isOpen, onClose, account, onRecorded }) {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !account) return null;

  function generateRandomReference() {
    const prefix = type.toUpperCase().slice(0, 2);
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferenceId(`${prefix}-${Date.now().toString().slice(-4)}-${rand}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!referenceId.trim()) {
      setError('Reference ID is required for idempotency.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const recorded = await api.addTransaction(account.id, {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        reference_id: referenceId.trim(),
      });
      setAmount('');
      setDescription('');
      setReferenceId('');
      onRecorded(recorded);
      onClose();
    } catch (err) {
      setError(err.message || 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  }

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
          <div className={`p-2.5 rounded-xl border ${
            type === 'credit'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {type === 'credit' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Record Transaction</h3>
            <p className="text-xs text-slate-400">
              Target: <span className="text-slate-200 font-medium">{account.name}</span> (Balance: ${parseFloat(account.balance).toFixed(2)})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                  type === 'credit'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                <span>Credit (Deposit)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                  type === 'debit'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Debit (Withdrawal)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ($) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Salary, Consulting fee, Office supplies"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Reference ID (Idempotency Key) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomReference}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center space-x-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Generate Ref</span>
              </button>
            </div>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. TX-2026-90412"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Must be unique per account. Submitting a duplicate will be safely rejected.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white font-medium text-xs shadow-lg transition-all disabled:opacity-50 ${
                type === 'credit'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {loading ? 'Processing...' : `Submit ${type === 'credit' ? 'Credit' : 'Debit'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

