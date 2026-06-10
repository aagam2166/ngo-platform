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
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200/70',
  ACCEPTED:  'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  REJECTED:  'bg-rose-50 text-rose-700 border-rose-200/70',
  RECEIVED:  'bg-teal-50 text-teal-700 border-teal-200/70',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200/70',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  FOOD: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  CLOTHING: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 7.57V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3.57L3.62 3.46A1 1 0 0 0 2 4.34v13.82a1 1 0 0 0 .62.92L8 21.23V18a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3.23l5.38-2.13a1 1 0 0 0 .62-.92V4.34a1 1 0 0 0-1.62-.88z"/>
    </svg>
  ),
  MEDICAL: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/>
      <path d="M15 13 9 7"/>
      <path d="m18 2 4 4a2.12 2.12 0 1 1-3 3l-4-4a2.12 2.12 0 1 1 3-3z"/>
    </svg>
  ),
  EDUCATION: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/>
      <path d="M6 6h10M6 10h10"/>
    </svg>
  ),
  OTHER: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l-7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
    </svg>
  )
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
        setResources(r.data.data || []);
        setMoney(m.data.data || []);
      })
      .catch(() => setError('Failed to load your donations.'))
      .finally(() => setLoading(false));
  }, []);

  const totalMoneyDonated = money.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Donations</h1>
            <p className="text-sm text-slate-500 mt-1">Track and manage your platform contributions</p>
          </div>
          <Link
            to="/donate"
            className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm text-center"
          >
            + New Donation
          </Link>
        </div>

        {/* Stat Cards Strip */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Item Donations</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight mt-2">{resources.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Money Contributions</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight mt-2">{money.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Contributed</p>
              <p className="text-2xl font-bold text-orange-600 tracking-tight mt-2.5">{fmt(totalMoneyDonated)}</p>
            </div>
          </div>
        )}

        {/* Tab Switcher Segment */}
        <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl mb-6 border border-slate-200/30">
          {(['resources', 'money'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === t 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'resources' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l-7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <span>Goods ({resources.length})</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/></svg>
                  <span>Money ({money.length})</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Loading Spinner Block */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error Block */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 font-medium">{error}</div>
        )}

        {/* Goods List Tab */}
        {!loading && !error && tab === 'resources' && (
          resources.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l-7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <p className="text-slate-900 font-bold mb-1">No item donations recorded</p>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">Share resource goods you no longer need with partner centers.</p>
              <Link to="/donate" className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm inline-block">
                Donate Items
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {resources.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 transition-all hover:border-slate-300/80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                        {CATEGORY_ICONS[d.category] ?? CATEGORY_ICONS.OTHER}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{d.itemName}</p>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {d.quantity}{d.unit ? ` ${d.unit}` : ''} <span className="text-slate-300 mx-1">|</span> {d.ngo.name} <span className="text-slate-300 mx-1">|</span> {fmtDate(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${STATUS_STYLES[d.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {d.status.toLowerCase()}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-slate-500 mt-3 pl-0 sm:pl-14 border-l-0 sm:border-l-2 border-slate-100 leading-relaxed">{d.description}</p>
                  )}
                  {d.ngoNote && (
                    <div className="mt-4 ml-14 p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl">
                      <p className="text-xs font-bold text-orange-800 tracking-tight">NGO Remarks</p>
                      <p className="text-xs text-orange-700/90 mt-1 leading-relaxed">{d.ngoNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Money List Tab */}
        {!loading && !error && tab === 'money' && (
          money.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/></svg>
              </div>
              <p className="text-slate-900 font-bold mb-1">No monetary contributions</p>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">Small funds can reliably provide essential community provisions.</p>
              <Link to="/donate" className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm inline-block">
                Donate Money
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {money.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 transition-all hover:border-slate-300/80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/></svg>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-base leading-none tracking-tight">{fmt(d.amount)}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          to {d.ngo.name} <span className="text-slate-300 mx-1">|</span> {fmtDate(d.createdAt)}
                        </p>
                        {d.message && (
                          <p className="text-xs text-slate-500 mt-2.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg inline-block italic">
                            "{d.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${STATUS_STYLES[d.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {d.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}