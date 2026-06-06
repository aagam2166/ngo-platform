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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-400 text-white px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-4xl font-extrabold mb-3">Give What You Can</h1>
          <p className="text-orange-100 text-lg mb-8">
            Support verified NGOs with goods or money. Every contribution — big or small — makes a real difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/donate/resources"
              className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              📦 Donate Goods / Items
            </Link>
            <Link
              to="/donate/money"
              className="bg-orange-700 bg-opacity-50 text-white border border-white border-opacity-40 font-bold px-6 py-3 rounded-xl hover:bg-opacity-70 transition-all"
            >
              💰 Donate Money
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '🔍', title: 'Choose an NGO', desc: 'Browse verified NGOs working in your area' },
            { icon: '📋', title: 'Select What to Give', desc: 'Donate physical items or contribute money directly' },
            { icon: '✅', title: 'Make an Impact', desc: 'The NGO connects with you and your donation reaches those in need' },
          ].map(s => (
            <div key={s.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{s.title}</p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* NGO list */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xl font-bold text-gray-900">Verified NGOs</h2>
          <input
            type="text"
            placeholder="Search by name or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 w-56"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No NGOs found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(ngo => (
              <div key={ngo.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{ngo.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{ngo.city}, {ngo.state}</p>
                  </div>
                  <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Verified
                  </span>
                </div>
                {ngo.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ngo.description}</p>
                )}
                {ngo.account && ngo.account.totalRaised > 0 && (
                  <p className="text-xs text-orange-600 font-medium">
                    {fmt(ngo.account.totalRaised)} raised so far
                  </p>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                  <Link
                    to={`/donate/resources?ngoId=${ngo.id}`}
                    className="flex-1 text-center text-xs font-semibold bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    📦 Donate Goods
                  </Link>
                  <Link
                    to={`/donate/money?ngoId=${ngo.id}`}
                    className="flex-1 text-center text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    💰 Donate Money
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My donations link */}
        {user && (
          <div className="mt-8 text-center">
            <Link
              to="/my-donations"
              className="text-sm text-orange-500 hover:text-orange-700 font-medium"
            >
              View my donation history →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
