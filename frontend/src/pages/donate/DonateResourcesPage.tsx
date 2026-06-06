import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface NGO { id: string; name: string; city: string; state: string; }

const CATEGORIES = [
  { value: 'FOOD', label: '🍱 Food & Groceries' },
  { value: 'CLOTHING', label: '👕 Clothing & Textiles' },
  { value: 'MEDICAL', label: '🏥 Medical Supplies' },
  { value: 'EDUCATION', label: '📚 Books & Stationery' },
  { value: 'FURNITURE', label: '🪑 Furniture & Household' },
  { value: 'ELECTRONICS', label: '💻 Electronics' },
  { value: 'OTHER', label: '📦 Other' },
];

const UNITS = ['kg', 'pieces', 'boxes', 'bags', 'litres', 'packets', 'sets', 'pairs'];

export default function DonateResourcesPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

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
    api.get('/donations/ngos').then(r => setNgos(r.data.data)).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.ngoId) { setError('Please select an NGO'); return; }
    if (!form.itemName.trim()) { setError('Item name is required'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Please enter a valid quantity'); return; }

    setSubmitting(true);
    try {
      await api.post('/donations/resources', {
        ...form,
        quantity: Number(form.quantity),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Offer Sent!</h2>
          <p className="text-gray-500 mb-8">
            The NGO has been notified and will contact you soon to arrange collection.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setForm(f => ({ ...f, itemName: '', quantity: '', description: '' })); }}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
            >
              Donate More
            </button>
            <Link to="/my-donations" className="border border-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
              View My Donations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link to="/donate" className="text-sm text-orange-500 hover:text-orange-700 font-medium">
          ← Back to Donate
        </Link>

        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <div className="text-3xl mb-2">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Donate Goods / Items</h1>
          <p className="text-sm text-gray-500 mb-6">
            Tell us what you'd like to donate. The NGO will reach out to arrange pickup or drop-off.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NGO selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose NGO *</label>
              <select
                value={form.ngoId}
                onChange={e => set('ngoId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">— Select a verified NGO —</option>
                {ngos.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.city})</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('category', c.value)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                      form.category === c.value
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={form.itemName}
                onChange={e => set('itemName', e.target.value)}
                placeholder="e.g. Rice, Winter jackets, Notebooks…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Any extra details — condition, packaging, pickup availability…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Donation Offer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
