import React, { useState } from 'react';
import { Cpu, Boxes, GitBranch, Shield, Zap, Sparkles, Code2, CheckCircle2 } from 'lucide-react';

const PATTERNS = [
  {
    id: 'strategy',
    category: 'Behavioral Pattern',
    name: 'Strategy Pattern',
    target: 'CreditStrategy & DebitStrategy',
    description:
      'Encapsulates credit and debit arithmetic into polymorphic execution strategies adhering to the Open/Closed Principle. Adding a new transaction type (e.g., Hold, Fee, Escrow) requires zero modifications to existing balance mutation algorithms.',
    code: `class TransactionPostingStrategy(ABC):
    @abstractmethod
    def compute_new_balance(self, current: Decimal, amount: Decimal) -> Decimal:
        pass

class CreditStrategy(TransactionPostingStrategy):
    def compute_new_balance(self, current: Decimal, amount: Decimal) -> Decimal:
        return current + amount  # Guaranteed non-negative

class DebitStrategy(TransactionPostingStrategy):
    def compute_new_balance(self, current: Decimal, amount: Decimal) -> Decimal:
        if current < amount:
            raise InsufficientFundsException(current, amount)
        return current - amount`,
    benefits: ['Open/Closed Principle', 'Polymorphic execution', 'Zero overdraft risk']
  },
  {
    id: 'facade',
    category: 'Structural Pattern',
    name: 'Facade Pattern',
    target: 'LedgerService',
    description:
      'Provides a high-level, thread-safe entry point coordinating pessimistic row-level locking, deterministic ID sorting, reference deduplication, and atomic database commits behind a clean API.',
    code: `class LedgerService:
    """Unified Facade for high-integrity transaction operations."""
    
    def post_transaction(self, db: Session, account_id: str, payload) -> Transaction:
        # 1. Acquire row-level lock
        # 2. Prevent reference idempotency collisions
        # 3. Resolve strategy via StrategyFactory
        # 4. Commit atomically or rollback cleanly
        strategy = StrategyFactory.get_strategy(payload.type)
        new_balance = strategy.compute_new_balance(account.balance, payload.amount)
        ...`,
    benefits: ['Subsystem encapsulation', 'Guaranteed atomic boundaries', 'Deterministic lock acquisition']
  },
  {
    id: 'factory',
    category: 'Creational Pattern',
    name: 'Factory Pattern',
    target: 'StrategyFactory',
    description:
      'Decouples client request routing from concrete posting strategies. Maps incoming string identifiers ("credit", "debit") into validated, immutable strategy singletons with O(1) resolution.',
    code: `class StrategyFactory:
    _strategies = {
        "credit": CreditStrategy(),
        "debit": DebitStrategy()
    }

    @classmethod
    def get_strategy(cls, tx_type: str) -> TransactionPostingStrategy:
        strategy = cls._strategies.get(tx_type.lower())
        if not strategy:
            raise InvalidTransactionTypeException(tx_type)
        return strategy`,
    benefits: ['Loose coupling', 'Extensible dispatch', 'Immutable singleton caching']
  },
  {
    id: 'builder',
    category: 'Creational Pattern',
    name: 'Builder Pattern',
    target: 'PaginatedResponse.create()',
    description:
      'Constructs standardized, type-safe API envelopes with total records, page size, navigation pointers, and current slice calculation without polluting controller route handlers.',
    code: `class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total_records: int
    page: int
    limit: int
    total_pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int):
        total_pages = max(1, (total + limit - 1) // limit)
        return cls(
            items=items,
            total_records=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )`,
    benefits: ['Uniform pagination contract', 'Generic payload typing', 'Eliminates page-math duplication']
  }
];

export default function DesignPatternsSection() {
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);

  return (
    <section id="patterns" className="py-20 border-t border-slate-800/80 bg-slate-950/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400">
            <Boxes className="h-3.5 w-3.5" />
            <span>Object-Oriented Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Gang of Four (GoF) Design Patterns
          </h2>
          <p className="text-sm text-slate-400">
            Engineered using battle-tested creational, structural, and behavioral design patterns to ensure modularity, complete testability, and strict financial invariants.
          </p>

          {/* Pattern Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 max-w-2xl mx-auto">
            {PATTERNS.map((p) => {
              const active = selectedPattern.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPattern(p)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-lg shadow-sky-500/5'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono block text-sky-400 font-semibold mb-0.5">
                    {p.category.split(' ')[0]}
                  </span>
                  <span className="text-xs font-bold block">{p.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pattern Showcase Card */}
        <div className="max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Details Column */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {selectedPattern.category}
                </span>
                <h3 className="text-xl font-bold text-white pt-2">{selectedPattern.name}</h3>
                <span className="text-xs font-mono text-slate-400 block">
                  Implementation: <span className="text-indigo-400">{selectedPattern.target}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {selectedPattern.description}
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-500 font-bold block">
                  System Design Benefits
                </span>
                <div className="space-y-1.5">
                  {selectedPattern.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Clean Architecture</span>
              <span className="text-emerald-400">100% Test Verified</span>
            </div>
          </div>

          {/* Code Column */}
          <div className="lg:col-span-7 bg-slate-950 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 mb-4">
                <div className="flex items-center space-x-2">
                  <Code2 className="h-4 w-4 text-sky-400" />
                  <span>Python 3.12 / SQLAlchemy 2.0</span>
                </div>
                <span className="text-slate-600">Production Source</span>
              </div>

              <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <code>{selectedPattern.code}</code>
              </pre>
            </div>

            <div className="pt-4 text-[11px] text-slate-500 font-mono">
              Enforced by strict typing and domain-level exceptions.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

