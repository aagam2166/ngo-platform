import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface NGO {
  id: string;
  name: string;
  city: string;
  state: string;
  account?: { totalRaised: number };
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function DonateMoneyPage() {
  const [params] = useSearchParams();

  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [ngoId, setNgoId] = useState(params.get('ngoId') ?? '');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ ngoName: string; amount: number } | null>(null);

  useEffect(() => {
    api.get('/donations/ngos')
      .then(r => {
        const list: NGO[] = r.data.data;
        setNgos(list);
        const preselect = params.get('ngoId');
        if (preselect) setSelectedNGO(list.find(n => n.id === preselect) ?? null);
      })
      .catch(() => {});
  }, []);

  const handleNGOChange = (id: string) => {
    setNgoId(id);
    setSelectedNGO(ngos.find(n => n.id === id) ?? null);
  };

  const handlePreset = (val: number) => {
    setAmount(String(val));
    setCustomAmount(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ngoId) { setError('Please select an NGO'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Please enter a valid amount'); return; }
    if (parsed < 10) { setError('Minimum donation amount is ₹10'); return; }

    setSubmitting(true);
    try {
      await api.post('/donations/money', { ngoId, amount: parsed, message: message.trim() || undefined });
      setSuccess({ ngoName: selectedNGO?.name ?? 'the NGO', amount: parsed });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-2">
            Your donation of <span className="font-bold text-orange-600">{fmt(success.amount)}</span> to{' '}
            <span className="font-semibold text-gray-900">{success.ngoName}</span> was successful.
          </p>
          <p className="text-sm text-gray-400 mb-8">Your generosity directly helps people in need. 🙏</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(null); setAmount(''); setMessage(''); }}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
            >
              Donate Again
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
          <div className="text-3xl mb-2">💰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Donate Money</h1>
          <p className="text-sm text-gray-500 mb-6">
            100% of your donation goes directly to the NGO to fund their relief activities.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NGO selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose NGO *</label>
              <select
                value={ngoId}
                onChange={e => handleNGOChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">— Select a verified NGO —</option>
                {ngos.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.city})</option>
                ))}
              </select>
              {selectedNGO?.account?.totalRaised != null && (
                <p className="text-xs text-orange-500 mt-1 font-medium">
                  {fmt(selectedNGO.account.totalRaised)} raised by supporters so far
                </p>
              )}
            </div>

            {/* Amount presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_AMOUNTS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      !customAmount && amount === String(p)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {fmt(p)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setCustomAmount(true); setAmount(''); }}
                className={`w-full text-xs py-2 rounded-lg border transition-colors ${
                  customAmount
                    ? 'border-orange-400 text-orange-600 bg-orange-50'
                    : 'border-gray-200 text-gray-500 hover:border-orange-300'
                }`}
              >
                Enter custom amount
              </button>
              {customAmount && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    placeholder="Enter amount"
                    autoFocus
                    className="w-full border border-orange-400 rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none"
                  />
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Leave a message of support…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
              />
            </div>

            {/* Summary */}
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  You are donating{' '}
                  <span className="font-bold text-orange-600">{fmt(Number(amount))}</span>
                  {selectedNGO ? <> to <span className="font-semibold">{selectedNGO.name}</span></> : ''}
                </p>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !amount || !ngoId}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Processing…' : `Donate ${amount && Number(amount) > 0 ? fmt(Number(amount)) : ''}`}
            </button>

            <p className="text-xs text-center text-gray-400">
              This is a simulated donation for demonstration purposes.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
