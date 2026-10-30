import React, { useEffect, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import TransactionHistory from './components/TransactionHistory';
import CreateAccountModal from './components/CreateAccountModal';
import TransactionModal from './components/TransactionModal';
import TransferModal from './components/TransferModal';
import AuditModal from './components/AuditModal';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  User,
  Copy,
  Check
} from 'lucide-react';
import { api } from './services/api';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  // Modals state
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Toast / Alert
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Load Accounts
  const loadAccounts = useCallback(async (preferredId = null) => {
    setLoading(true);
    try {
      const list = await api.listAccounts();
      setAccounts(list);
      if (list.length > 0) {
        const targetId = preferredId || selectedAccountId || list[0].id;
        const exists = list.find((a) => a.id === targetId);
        const activeId = exists ? exists.id : list[0].id;
        setSelectedAccountId(activeId);
        setSelectedAccount(list.find((a) => a.id === activeId));
      } else {
        setSelectedAccountId('');
        setSelectedAccount(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  // Load Transactions for active account
  const loadTransactions = useCallback(async () => {
    if (!selectedAccountId) {
      setTransactions([]);
      setTotalRecords(0);
      setTotalPages(1);
      return;
    }
    setTxLoading(true);
    try {
      const data = await api.getTransactions(selectedAccountId, {
        type: filterType,
        page,
        limit: 10,
      });
      setTransactions(data.items);
      setTotalRecords(data.total_records);
      setTotalPages(data.total_pages);
    } catch (err) {
      showToast(err.message || 'Failed to load transactions', 'error');
    } finally {
      setTxLoading(false);
    }
  }, [selectedAccountId, filterType, page]);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      const acc = accounts.find((a) => a.id === selectedAccountId);
      setSelectedAccount(acc || null);
      loadTransactions();
    }
  }, [selectedAccountId, filterType, page, accounts, loadTransactions]);

  const refreshActiveAccount = async () => {
    if (!selectedAccountId) return;
    try {
      const updated = await api.getAccountBalance(selectedAccountId);
      setAccounts((prev) =>
        prev.map((a) => (a.id === selectedAccountId ? { ...a, balance: updated.balance } : a))
      );
      setSelectedAccount((prev) => (prev ? { ...prev, balance: updated.balance } : prev));
      loadTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccountCreated = (newAcc) => {
    showToast(`Account "${newAcc.name}" created with $0.00 initial balance.`);
    loadAccounts(newAcc.id);
  };

  const handleTransactionRecorded = (tx) => {
    showToast(`Transaction of $${parseFloat(tx.amount).toFixed(2)} recorded successfully.`);
    refreshActiveAccount();
  };

  const handleTransferExecuted = (transfer) => {
    showToast(`Atomic transfer of $${parseFloat(transfer.amount).toFixed(2)} executed successfully.`);
    loadAccounts(selectedAccountId);
  };

  const copyId = () => {
    if (selectedAccount) {
      navigator.clipboard.writeText(selectedAccount.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar onRefresh={() => loadAccounts()} />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border flex items-center space-x-2 ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Control Bar: Account Switcher & Create Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                Active Account
              </label>
              {accounts.length > 0 ? (
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-4"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900 text-slate-100">
                      {acc.name} — ${parseFloat(acc.balance).toFixed(2)} ({acc.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-400">No accounts yet</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshActiveAccount()}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs"
              title="Refresh Balance"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4 text-sky-400" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Hero Card: Current Balance & Quick Action Buttons */}
        {selectedAccount ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Current Balance</span>
                  <button
                    onClick={copyId}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{selectedAccount.id.slice(0, 8)}...</span>
                  </button>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
                    ${parseFloat(selectedAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 font-mono">USD</span>
                </div>
                <p className="text-xs text-slate-400">
                  Account Holder: <span className="text-slate-200 font-semibold">{selectedAccount.name}</span> • Created {new Date(selectedAccount.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsTransactionOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 flex items-center space-x-2 transition-all active:scale-95"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Credit / Debit</span>
                </button>

                <button
                  onClick={() => setIsTransferOpen(true)}
                  disabled={accounts.length < 2}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Transfer Money</span>
                </button>

                <button
                  onClick={() => setIsAuditOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 font-medium text-xs flex items-center space-x-2 transition-all active:scale-95"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Audit & Reconcile</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/40">
            <Wallet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No Accounts Found</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              Get started by creating your first account. Initial balance is strictly zero.
            </p>
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg shadow-sky-500/20 inline-flex items-center space-x-2 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create First Account</span>
            </button>
          </div>
        )}

        {/* Transaction History Section */}
        {selectedAccount && (
          <TransactionHistory
            transactions={transactions}
            filterType={filterType}
            setFilterType={setFilterType}
            page={page}
            setPage={setPage}
            totalRecords={totalRecords}
            totalPages={totalPages}
            pageSize={10}
            loading={txLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        AegisLedger v1.0 • Built with Python, FastAPI & React • Fully ACID & Concurrency Safe
      </footer>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onCreated={handleAccountCreated}
      />

      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        account={selectedAccount}
        onRecorded={handleTransactionRecorded}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        currentAccount={selectedAccount}
        onTransferred={handleTransferExecuted}
      />

      <AuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        account={selectedAccount}
      />
    </div>
  );
}

