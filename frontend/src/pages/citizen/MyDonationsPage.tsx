import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface ResourceDonation {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit?: string;
  description?: string;
  status: string;
  ngoNote?: string;
  createdAt: string;
  ngo: { name: string; city: string; state: string };
}

interface MoneyDonation {
  id: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
  ngo: { name: string; city: string; state: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  RECEIVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  COMPLETED:'bg-blue-100 text-blue-700 border-blue-200',
};

const STATUS_ICON: Record<string, string> = {
  PENDING: '⏳', ACCEPTED: '✅', REJECTED: '❌', RECEIVED: '🙌', COMPLETED: '✔️',
};

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍱', CLOTHING: '👕', MEDICAL: '🏥', EDUCATION: '📚',
  FURNITURE: '🪑', ELECTRONICS: '💻', OTHER: '📦',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyDonationsPage() {
  const [tab, setTab] = useState<'resources' | 'money'>('resources');
  const [resources, setResources] = useState<ResourceDonation[]>([]);
  const [money, setMoney] = useState<MoneyDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/donations/resources/mine'),
      api.get('/donations/money/mine'),
    ])
      .then(([r, m]) => {
        setResources(r.data.data);
        setMoney(m.data.data);
      })
      .catch(() => setError('Failed to load your donations.'))
      .finally(() => setLoading(false));
  }, []);

  const totalMoneyDonated = money.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Donations</h1>
            <p className="text-sm text-gray-500 mt-1">Track everything you've given</p>
          </div>
          <Link
            to="/donate"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            + New Donation
          </Link>
        </div>

        {/* Summary strip */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{resources.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Item Donations</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{money.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Money Donations</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-lg font-bold text-orange-500">{fmt(totalMoneyDonated)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Money Given</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {(['resources', 'money'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'resources' ? `📦 Goods (${resources.length})` : `💰 Money (${money.length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* Resources tab */}
        {!loading && !error && tab === 'resources' && (
          resources.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-900 font-semibold mb-1">No item donations yet</p>
              <p className="text-sm text-gray-500 mb-5">Share goods you no longer need with those who do.</p>
              <Link to="/donate/resources" className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">
                Donate Items
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{CATEGORY_ICONS[d.category] ?? '📦'}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{d.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {d.quantity}{d.unit ? ` ${d.unit}` : ''} · {d.ngo.name} · {fmtDate(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {STATUS_ICON[d.status]} {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{d.description}</p>
                  )}
                  {d.ngoNote && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                      <p className="text-xs font-semibold text-orange-700 mb-0.5">NGO Response:</p>
                      <p className="text-xs text-orange-800">{d.ngoNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Money tab */}
        {!loading && !error && tab === 'money' && (
          money.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-gray-900 font-semibold mb-1">No money donations yet</p>
              <p className="text-sm text-gray-500 mb-5">Even a small amount can fund meals, medicines, and more.</p>
              <Link to="/donate/money" className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">
                Donate Money
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {money.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{fmt(d.amount)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">to {d.ngo.name} · {fmtDate(d.createdAt)}</p>
                      {d.message && (
                        <p className="text-xs text-gray-500 mt-1.5 italic">"{d.message}"</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      ✔ {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
