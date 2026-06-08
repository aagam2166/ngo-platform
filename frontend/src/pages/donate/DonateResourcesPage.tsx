import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface NGO { 
  id: string; 
  name: string; 
  city: string; 
  state: string; 
}

const CATEGORIES = [
  { value: 'FOOD', label: 'Food & Groceries' },
  { value: 'CLOTHING', label: 'Clothing & Textiles' },
  { value: 'MEDICAL', label: 'Medical Supplies' },
  { value: 'EDUCATION', label: 'Books & Stationery' },
  { value: 'FURNITURE', label: 'Furniture & Household' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'OTHER', label: 'Other Items' },
];

const UNITS = ['kg', 'pieces', 'boxes', 'bags', 'litres', 'packets', 'sets', 'pairs'];

export default function DonateResourcesPage() {
  const [params] = useSearchParams();

  const [ngos, setNgos] = useState<NGO[]>([]);
  const [form, setForm] = useState({
    ngoId: params.get('ngoId') ?? '',
    itemName: '',
    category: 'FOOD',
    quantity: '',
    unit: 'kg',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/donations/ngos')
      .then(r => setNgos(r.data.data))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.ngoId) { setError('Please select an NGO.'); return; }
    if (!form.itemName.trim()) { setError('Please specify the item details.'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Please specify a valid quantity.'); return; }

    setSubmitting(true);
    try {
      await api.post('/donations/resources', {
        ...form,
        quantity: Number(form.quantity),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register your donation item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Donation Offer Logged</h2>
          <p className="text-base text-slate-600 max-w-sm mx-auto mb-8 leading-relaxed">
            Thank you for your generosity! The chosen organization has been notified of your items and will contact you directly to sync on pickup or logistics routing.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setSuccess(false); setForm(f => ({ ...f, itemName: '', quantity: '', description: '' })); }}
              className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              Donate More Items
            </button>
            <Link to="/my-donations" className="border border-slate-200 bg-white text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-12">
        <Link to="/donate" className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Dashboard
        </Link>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-10">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donate Supplies</h1>
          <p className="text-sm text-slate-500 leading-relaxed mt-1.5 mb-8">
            Register individual supply provisions here. Partner coordinates will review items and verify distribution handshakes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NGO Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target NGO *</label>
              <select
                value={form.ngoId}
                onChange={e => set('ngoId', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white text-slate-800 font-medium transition-all"
              >
                <option value="">— Select an organization —</option>
                {ngos.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.city}, {n.state})</option>
                ))}
              </select>
            </div>

            {/* Category Selector Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Item Classification *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('category', c.value)}
                    className={`text-xs px-4 py-3 rounded-xl border text-left font-bold transition-all ${
                      form.category === c.value
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item Label *</label>
              <input
                type="text"
                value={form.itemName}
                onChange={e => set('itemName', e.target.value)}
                placeholder="e.g., Basmati Rice, Winter Coats, Notebooks"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800 font-medium transition-all"
              />
            </div>

            {/* Quantity and Unit Layout Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800 font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Metric Unit</label>
                <select
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white text-slate-800 font-medium transition-all"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Logistics Notes / Condition <span className="text-slate-400 font-normal lowercase italic">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Specify details regarding expiration parameters, batch counts, packaging integrity, or custom pickup instructions..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800 font-medium placeholder:text-slate-400 resize-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent text-white font-bold py-4 rounded-xl text-sm transition-all shadow-sm tracking-wide hover:shadow-md active:translate-y-px"
            >
              {submitting ? 'Registering Material Flow...' : 'Register Donation Offer'}
            </button>

            <p className="text-xs text-center text-slate-400 font-medium">
              Secure collection allocation verification tracking.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}