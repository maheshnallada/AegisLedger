import React from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Filter, Receipt } from 'lucide-react';

export default function TransactionHistory({
  transactions,
  filterType,
  setFilterType,
  page,
  setPage,
  totalRecords,
  totalPages,
  pageSize,
  loading,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header and Filter Tabs */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Ledger Activity</h3>
            <p className="text-xs text-slate-400">
              Sorted in latest-first order • {totalRecords} total {totalRecords === 1 ? 'record' : 'records'}
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          <button
            onClick={() => { setFilterType(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === ''
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setFilterType('credit'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              filterType === 'credit'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <ArrowDownRight className="h-3 w-3" />
            <span>Credits</span>
          </button>
          <button
            onClick={() => { setFilterType('debit'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              filterType === 'debit'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <ArrowUpRight className="h-3 w-3" />
            <span>Debits</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800/80">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Reference ID</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  Loading ledger entries...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  No transactions recorded for this filter.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type.toLowerCase() === 'credit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {isCredit ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        <span className="capitalize">{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {tx.reference_id}
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-semibold text-right whitespace-nowrap ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isCredit ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing page <span className="font-semibold text-slate-200">{page}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalPages || 1}</span> ({totalRecords} records)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono px-2 text-slate-200">{page}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
