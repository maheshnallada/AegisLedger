const API_BASE = '/api/v1';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error?.message || data?.detail || res.statusText || 'Request failed';
    const errorCode = data?.error?.code || 'API_ERROR';
    const err = new Error(errorMsg);
    err.code = errorCode;
    err.status = res.status;
    err.details = data?.error?.details || {};
    throw err;
  }
  return data;
}

export const api = {
  // Health
  async getHealth() {
    const res = await fetch('/health');
    return handleResponse(res);
  },

  // Accounts
  async createAccount(name) {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  async listAccounts() {
    const res = await fetch(`${API_BASE}/accounts`);
    return handleResponse(res);
  },

  async getAccount(accountId) {
    const res = await fetch(`${API_BASE}/accounts/${accountId}`);
    return handleResponse(res);
  },

  async getAccountBalance(accountId) {
    const res = await fetch(`${API_BASE}/accounts/${accountId}/balance`);
    return handleResponse(res);
  },

  async reconcileAccount(accountId) {
    const res = await fetch(`${API_BASE}/accounts/${accountId}/audit`);
    return handleResponse(res);
  },

  // Transactions
  async addTransaction(accountId, { type, amount, description, reference_id }) {
    const res = await fetch(`${API_BASE}/accounts/${accountId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        amount: parseFloat(amount),
        description,
        reference_id,
      }),
    });
    return handleResponse(res);
  },

  async getTransactions(accountId, { type = '', page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    const res = await fetch(`${API_BASE}/accounts/${accountId}/transactions?${params.toString()}`);
    return handleResponse(res);
  },

  // Transfers
  async transferMoney({ source_account_id, destination_account_id, amount, reference_id, description }) {
    const res = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_account_id,
        destination_account_id,
        amount: parseFloat(amount),
        reference_id,
        description,
      }),
    });
    return handleResponse(res);
  },
};
