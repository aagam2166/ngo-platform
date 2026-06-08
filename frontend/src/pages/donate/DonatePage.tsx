import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface NGO {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string;
  account?: { totalRaised: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function DonatePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/donations/ngos')
      .then(r => setNgos(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = ngos.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      {/* Clean Hero Header with Subtle Gradients */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200/60 py-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-transparent to-amber-50/30 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-3">
           Discover the Joy of Giving
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Support verified organizations with essential physical goods or monetary funding. Every single contribution makes an impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link
              to="/donate/resources"
              className="flex-1 bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l-7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              Donate Goods
            </Link>
            <Link
              to="/donate/money"
              className="flex-1 border border-slate-200 bg-white text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 00 0 4h4a2 2 0 0 1 0 4H8"/></svg>
              Donate Money
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Step Cards Structure */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            { 
              title: 'Choose an NGO', 
              desc: 'Browse verified organizations operating within targeted sectors.',
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            },
            { 
              title: 'Select Contribution', 
              desc: 'Coordinate direct physical item delivery batches or secure payouts.',
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            },
            { 
              title: 'Track Real Impact', 
              desc: 'Get confirmation timelines directly from your dashboard histories.',
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            },
          ].map((s, idx) => (
            <div key={s.title} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/50">
                {s.icon}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Action Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verified Partner NGOs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Direct deployment nodes evaluated under systemic compliance checks</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by center or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs bg-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-full sm:w-60 transition-all placeholder:text-slate-400 text-slate-700"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center text-slate-400 text-sm font-medium">
            No matching registered organizations found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(ngo => (
              <div key={ngo.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-300/80">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">{ngo.name}</h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z"/></svg>
                        {ngo.city}, {ngo.state}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide border border-emerald-200/50">
                      Verified
                    </span>
                  </div>
                  {ngo.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mt-3 line-clamp-2">{ngo.description}</p>
                  )}
                </div>
                
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {ngo.account && ngo.account.totalRaised > 0 ? (
                    <p className="text-xs text-orange-600 font-semibold tracking-tight">
                      {fmt(ngo.account.totalRaised)} metrics raised
                    </p>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/donate/resources?ngoId=${ngo.id}`}
                      className="text-center text-xs font-bold bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Goods
                    </Link>
                    <Link
                      to={`/donate/money?ngoId=${ngo.id}`}
                      className="text-center text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      Money
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Trailing Tracker */}
        {user && (
          <div className="mt-12 text-center">
            <Link
              to="/my-donations"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600 font-semibold transition-colors tracking-tight uppercase"
            >
              <span>View my donation distribution history</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}