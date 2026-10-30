import React, { useState } from 'react';
import { X, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TransferModal({ isOpen, onClose, accounts, currentAccount, onTransferred }) {
  const [destinationId, setDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !currentAccount) return null;

  const availableDestinations = accounts.filter((a) => a.id !== currentAccount.id);

  function generateRandomReference() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferenceId(`XFER-${Date.now().toString().slice(-4)}-${rand}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!destinationId) {
      setError('Please select a destination account.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (parseFloat(amount) > parseFloat(currentAccount.balance)) {
      setError(`Insufficient funds. Current balance is $${parseFloat(currentAccount.balance).toFixed(2)}.`);
      return;
    }
    if (!description.trim()) {
      setError('Transfer description is required.');
      return;
    }
    if (!referenceId.trim()) {
      setError('Reference ID is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.transferMoney({
        source_account_id: currentAccount.id,
        destination_account_id: destinationId,
        amount: parseFloat(amount),
        reference_id: referenceId.trim(),
        description: description.trim(),
      });
      setAmount('');
      setDescription('');
      setReferenceId('');
      setDestinationId('');
      onTransferred(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Transfer failed.');
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
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Transfer Funds</h3>
            <p className="text-xs text-slate-400">Atomic, deadlock-free transfer between accounts</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Source Account:</span>
            <div className="text-right">
              <span className="font-semibold text-slate-200">{currentAccount.name}</span>
              <span className="ml-2 font-mono text-emerald-400 font-semibold">
                (${parseFloat(currentAccount.balance).toFixed(2)})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination Account <span className="text-rose-400">*</span>
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">-- Choose recipient account --</option>
              {availableDestinations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${parseFloat(acc.balance).toFixed(2)}) - {acc.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Transfer Amount ($) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Transfer Memo / Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Project milestone payment"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Transfer Reference ID <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomReference}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Generate Ref</span>
              </button>
            </div>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. XFER-2026-9901"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Executing Transfer...' : 'Execute Atomic Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
