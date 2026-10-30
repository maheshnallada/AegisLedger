import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

const SNIPPETS = {
  createAccount: {
    title: 'Create Account',
    curl: `curl -X POST http://localhost:8000/api/v1/accounts \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Nakamoto"}'`,
    python: `import httpx

res = httpx.post("http://localhost:8000/api/v1/accounts", json={
    "name": "Alice Nakamoto"
})
print(res.status_code, res.json())`,
    response: `{
  "id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
  "name": "Alice Nakamoto",
  "balance": "0.0000",
  "created_at": "2026-10-30T16:00:00Z"
}`
  },
  addTransaction: {
    title: 'Post Transaction',
    curl: `curl -X POST http://localhost:8000/api/v1/accounts/1bd6efc7.../transactions \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "credit",
    "amount": 250.00,
    "description": "Direct Deposit",
    "reference_id": "DEP-2026-901"
  }'`,
    python: `import httpx

res = httpx.post("http://localhost:8000/api/v1/accounts/1bd6efc7.../transactions", json={
    "type": "credit",
    "amount": 250.00,
    "description": "Direct Deposit",
    "reference_id": "DEP-2026-901"
})
print(res.json())`,
    response: `{
  "id": "e4f1a2b3-c4d5-6789-0123-abcdef123456",
  "account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
  "type": "credit",
  "amount": "250.0000",
  "description": "Direct Deposit",
  "reference_id": "DEP-2026-901",
  "created_at": "2026-10-30T16:01:00Z"
}`
  },
  atomicTransfer: {
    title: 'Atomic Transfer',
    curl: `curl -X POST http://localhost:8000/api/v1/transfers \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_account_id": "1bd6efc7...",
    "destination_account_id": "2fe7fa12...",
    "amount": 50.00,
    "reference_id": "XFER-9910",
    "description": "Contractor Settlement"
  }'`,
    python: `import httpx

res = httpx.post("http://localhost:8000/api/v1/transfers", json={
    "source_account_id": "1bd6efc7...",
    "destination_account_id": "2fe7fa12...",
    "amount": 50.00,
    "reference_id": "XFER-9910",
    "description": "Contractor Settlement"
})
print(res.json())`,
    response: `{
  "id": "7ab9cd8e-f123-4567-89ab-cdef01234567",
  "source_account_id": "1bd6efc7...",
  "destination_account_id": "2fe7fa12...",
  "amount": "50.0000",
  "reference_id": "XFER-9910",
  "description": "Contractor Settlement",
  "created_at": "2026-10-30T16:02:00Z"
}`
  },
  audit: {
    title: 'Audit & Reconcile',
    curl: `curl http://localhost:8000/api/v1/accounts/1bd6efc7.../audit`,
    python: `import httpx

res = httpx.get("http://localhost:8000/api/v1/accounts/1bd6efc7.../audit")
print(res.json())`,
    response: `{
  "account_id": "1bd6efc7...",
  "cached_balance": "200.0000",
  "total_credits": "250.0000",
  "total_debits": "50.0000",
  "computed_balance": "200.0000",
  "drift": "0.0000",
  "is_reconciled": true,
  "total_transactions": 2
}`
  }
};

export default function ApiPlayground() {
  const [activeSnippetKey, setActiveSnippetKey] = useState('createAccount');
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const snippet = SNIPPETS[activeSnippetKey];
  const code = lang === 'curl' ? snippet.curl : snippet.python;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="py-20 border-t border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <Code2 className="h-3.5 w-3.5" />
            <span>Developer Contracts</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Clean, Predictable REST Contracts
          </h2>
          <p className="text-sm text-slate-400">
            Fully documented via OpenAPI. Test requests with curl, Python, or directly through the Live Console.
          </p>
        </div>

        {/* Playground Box */}
        <div className="max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Top Controls */}
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {Object.entries(SNIPPETS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveSnippetKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeSnippetKey === key
                      ? 'bg-slate-800 text-sky-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="p-0.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center text-xs font-mono">
                <button
                  onClick={() => setLang('curl')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    lang === 'curl' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setLang('python')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    lang === 'python' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy snippet"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950/40">
            {/* Request */}
            <div className="p-5 font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Request ({lang})
              </div>
              <pre className="text-slate-200 leading-relaxed">{code}</pre>
            </div>

            {/* Response */}
            <div className="p-5 font-mono text-xs overflow-x-auto space-y-2 bg-slate-950/80">
              <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-2 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Response (200 / 201)</span>
              </div>
              <pre className="text-sky-300 leading-relaxed">{snippet.response}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
