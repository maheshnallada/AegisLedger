import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2, Globe } from 'lucide-react';

export default function ApiPlayground() {
  const [selectedSnippet, setSelectedSnippet] = useState('createAccount');
  const [selectedLang, setSelectedLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  // Compute live host dynamically so commands match the user's EC2 IP or localhost
  const host = typeof window !== 'undefined' ? `${window.location.hostname}:8000` : 'localhost:8000';
  const origin = typeof window !== 'undefined' ? `http://${host}` : 'http://localhost:8000';

  const SNIPPETS = {
    createAccount: {
      title: 'Create Account',
      curl: `curl -X POST ${origin}/api/v1/accounts \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Nakamoto"}'`,
      python: `import httpx

res = httpx.post("${origin}/api/v1/accounts", json={
    "name": "Alice Nakamoto"
})
print(res.status_code, res.json())`,
      javascript: `const res = await fetch("${origin}/api/v1/accounts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice Nakamoto" })
});
const data = await res.json();
console.log(data);`,
      response: `{
  "id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
  "name": "Alice Nakamoto",
  "balance": "0.0000",
  "created_at": "2026-10-30T16:00:00Z"
}`
    },
    addTransaction: {
      title: 'Post Transaction',
      curl: `curl -X POST ${origin}/api/v1/accounts/1bd6efc7.../transactions \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "credit",
    "amount": 250.00,
    "description": "Direct Deposit",
    "reference_id": "DEP-2026-901"
  }'`,
      python: `import httpx

res = httpx.post("${origin}/api/v1/accounts/1bd6efc7.../transactions", json={
    "type": "credit",
    "amount": 250.00,
    "description": "Direct Deposit",
    "reference_id": "DEP-2026-901"
})
print(res.json())`,
      javascript: `const res = await fetch("${origin}/api/v1/accounts/1bd6efc7.../transactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "credit",
    amount: 250.00,
    description: "Direct Deposit",
    reference_id: "DEP-2026-901"
  })
});
const data = await res.json();
console.log(data);`,
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
      curl: `curl -X POST ${origin}/api/v1/transfers \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_account_id": "1bd6efc7...",
    "destination_account_id": "2fe7fa12...",
    "amount": 50.00,
    "reference_id": "XFER-9910",
    "description": "Contractor Settlement"
  }'`,
      python: `import httpx

res = httpx.post("${origin}/api/v1/transfers", json={
    "source_account_id": "1bd6efc7...",
    "destination_account_id": "2fe7fa12...",
    "amount": 50.00,
    "reference_id": "XFER-9910",
    "description": "Contractor Settlement"
})
print(res.json())`,
      javascript: `const res = await fetch("${origin}/api/v1/transfers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    source_account_id: "1bd6efc7...",
    destination_account_id: "2fe7fa12...",
    amount: 50.00,
    reference_id: "XFER-9910",
    description: "Contractor Settlement"
  })
});
const data = await res.json();
console.log(data);`,
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
      curl: `curl ${origin}/api/v1/accounts/1bd6efc7.../audit`,
      python: `import httpx

res = httpx.get("${origin}/api/v1/accounts/1bd6efc7.../audit")
print(res.json())`,
      javascript: `const res = await fetch("${origin}/api/v1/accounts/1bd6efc7.../audit");
const data = await res.json();
console.log(data);`,
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

  const currentSnippet = SNIPPETS[selectedSnippet];
  const codeToDisplay = currentSnippet[selectedLang];

  const handleCopy = () => {
    navigator.clipboard.writeText(codeToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="py-20 border-t border-slate-800/80 bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400">
            <Terminal className="h-3.5 w-3.5" />
            <span>Developer Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            RESTful API Specification
          </h2>
          <p className="text-sm text-slate-400">
            Clean, resource-oriented endpoints returning RFC 7807 error envelopes and standardized pagination structures.
          </p>

          {/* Endpoint selection tabs */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {Object.keys(SNIPPETS).map((key) => {
              const active = selectedSnippet === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSnippet(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {SNIPPETS[key].title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code + Response Split Card */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Request code panel */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white font-mono uppercase">Request Payload</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    HTTP/1.1
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedLang('curl')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      selectedLang === 'curl' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setSelectedLang('python')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      selectedLang === 'python' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setSelectedLang('javascript')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      selectedLang === 'javascript' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ml-2"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code snippet */}
              <pre className="mt-4 p-4 rounded-xl bg-slate-950 font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed border border-slate-800/60">
                <code>{codeToDisplay}</code>
              </pre>
            </div>

            <div className="pt-4 text-[11px] font-mono text-slate-500">
              * Live host auto-detected for your deployed server.
            </div>
          </div>

          {/* Response payload panel */}
          <div className="lg:col-span-5 bg-slate-950 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white font-mono uppercase">200 / 201 Response</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>application/json</span>
                </span>
              </div>

              <pre className="mt-4 p-4 rounded-xl bg-slate-900/50 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed border border-slate-800/60">
                <code>{currentSnippet.response}</code>
              </pre>
            </div>

            <div className="pt-4 text-[11px] font-mono text-slate-500 border-t border-slate-900">
              Decimal serialization: exact numeric string.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
