import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface Account {
  balance: number;
  totalRaised: number;
  totalSpent: number;
  currency: string;
}

interface MoneyDonation {
  id: string;
  amount: number;
  message?: string;
  createdAt: string;
  citizen: { firstName: string; lastName: string };
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
}

interface Overview {
  ngo: { id: string; name: string };
  account: Account;
  recentDonations: MoneyDonation[];
  recentExpenses: Expense[];
  donationCount: number;
}

const EXPENSE_CATEGORIES = [
  'OPERATIONS', 'SUPPLIES', 'TRANSPORT', 'SALARIES',
  'MEDICAL', 'FOOD', 'EDUCATION', 'INFRASTRUCTURE', 'OTHER',
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function NGOAccountsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  // Full history
  const [history, setHistory] = useState<{ donations: MoneyDonation[]; expenses: Expense[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'OPERATIONS', description: '' });
  const [expenseError, setExpenseError] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState('');

  const fetchOverview = () => {
    setLoading(true);
    api.get('/donations/account')
      .then(r => setOverview(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchHistory = () => {
    setHistoryLoading(true);
    api.get('/donations/account/history')
      .then(r => setHistory(r.data.data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchOverview(); }, []);

  const handleTabChange = (t: 'overview' | 'history') => {
    setTab(t);
    if (t === 'history' && !history) fetchHistory();
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSuccess('');
    const amt = parseFloat(expenseForm.amount);
    if (!expenseForm.amount || isNaN(amt) || amt <= 0) {
      setExpenseError('Enter a valid positive amount');
      return;
    }
    if (!expenseForm.description.trim()) {
      setExpenseError('Description is required');
      return;
    }
    setSubmittingExpense(true);
    try {
      await api.post('/donations/account/expenses', {
        amount: amt,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
      });
      setExpenseSuccess(`Expense of ${fmt(amt)} recorded successfully.`);
      setExpenseForm({ amount: '', category: 'OPERATIONS', description: '' });
      fetchOverview();
      if (tab === 'history') fetchHistory();
    } catch (err: any) {
      setExpenseError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-32">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const acct = overview?.account;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 pt-14 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-400 text-sm mb-1">{overview?.ngo.name}</p>
          <h1 className="text-3xl font-extrabold mb-1">Financial Accounts</h1>
          <p className="text-slate-400 text-sm">Track incoming donations and manage expenditures</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 pb-12">

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Balance</p>
            <p className={`text-3xl font-extrabold ${(acct?.balance ?? 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {fmt(acct?.balance ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Available to spend</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Raised</p>
            <p className="text-3xl font-extrabold text-orange-500">{fmt(acct?.totalRaised ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">from {overview?.donationCount ?? 0} donations</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Spent</p>
            <p className="text-3xl font-extrabold text-slate-600">{fmt(acct?.totalSpent ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">across all operations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-xs">
          { (['overview', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent donations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Recent Donations</h2>
              {overview?.recentDonations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2 font-mono text-lg font-bold">↓</div>
                  <p className="text-sm text-gray-400">No donations received yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overview?.recentDonations.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {d.citizen.firstName} {d.citizen.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{fmtDate(d.createdAt)}</p>
                        {d.message && <p className="text-xs text-gray-500 italic mt-0.5">"{d.message}"</p>}
                      </div>
                      <span className="text-sm font-bold text-green-600">+{fmt(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Record expense form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Record Expense</h2>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white text-gray-900 transition-all"
                    />
                  </div>
                  {acct && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Available balance: <span className="font-semibold text-green-600">{fmt(acct.balance)}</span>
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white text-gray-900 transition-all"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description *</label>
                  <textarea
                    rows={2}
                    value={expenseForm.description}
                    onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What was this expense for?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none bg-white text-gray-900 transition-all"
                  />
                </div>

                {expenseError && <p className="text-xs text-red-500 font-medium">{expenseError}</p>}
                {expenseSuccess && <p className="text-xs text-green-600 font-medium">{expenseSuccess}</p>}

                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  {submittingExpense ? 'Recording…' : 'Record Expense'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          historyLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {[
                  ...(history?.donations ?? []).map(d => ({
                    id: d.id,
                    type: 'donation' as const,
                    amount: d.amount,
                    label: `${d.citizen.firstName} ${d.citizen.lastName}`,
                    sub: d.message ? `"${d.message}"` : 'Donation Received',
                    date: d.createdAt,
                  })),
                  ...(history?.expenses ?? []).map(e => ({
                    id: e.id,
                    type: 'expense' as const,
                    amount: e.amount,
                    label: e.category.charAt(0) + e.category.slice(1).toLowerCase(),
                    sub: e.description,
                    date: e.createdAt,
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(item => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === 'donation' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {item.type === 'donation' ? (
                            <span className="text-xs font-bold font-mono">IN</span>
                          ) : (
                            <span className="text-xs font-bold font-mono">OUT</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.sub} · {fmtDate(item.date)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${item.type === 'donation' ? 'text-green-600' : 'text-red-500'}`}>
                        {item.type === 'donation' ? '+' : '-'}{fmt(item.amount)}
                      </span>
                    </div>
                  ))
                }
                {(!history?.donations.length && !history?.expenses.length) && (
                  <div className="text-center py-12 text-gray-400 text-sm">No transactions yet.</div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}