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
  }, [params]);

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
    if (!ngoId) { setError('Please select an NGO to support.'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Please enter a valid amount.'); return; }
    if (parsed < 10) { setError('Minimum donation amount is ₹10.'); return; }

    setSubmitting(true);
    try {
      await api.post('/donations/money', { ngoId, amount: parsed, message: message.trim() || undefined });
      setSuccess({ ngoName: selectedNGO?.name ?? 'the selected NGO', amount: parsed });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Donation processing failed.');
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Thank You!</h2>
          <p className="text-base text-slate-600 max-w-sm mx-auto mb-8 leading-relaxed">
            Your donation of <span className="font-bold text-orange-600">{fmt(success.amount)}</span> to{' '}
            <span className="font-semibold text-slate-900">{success.ngoName}</span> was successful. Your support directly funds their community relief work.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setSuccess(null); setAmount(''); setMessage(''); }}
              className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              Donate Again
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
              <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donate Money</h1>
          <p className="text-sm text-slate-500 leading-relaxed mt-1.5 mb-8">
            100% of your contribution goes directly to the chosen NGO to fund their local relief activities.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NGO Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Choose NGO *</label>
              <select
                value={ngoId}
                onChange={e => handleNGOChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white text-slate-800 font-medium transition-all"
              >
                <option value="">— Select a verified NGO —</option>
                {ngos.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.city}, {n.state})</option>
                ))}
              </select>
              {selectedNGO?.account?.totalRaised != null && (
                <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307L21.75 7.5M21.75 7.5H14m7.5 0v7.5" /></svg>
                  {fmt(selectedNGO.account.totalRaised)} raised by supporters so far
                </p>
              )}
            </div>

            {/* Amount Configuration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Amount *</label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AMOUNTS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      !customAmount && amount === String(p)
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                    }`}
                  >
                    {fmt(p)}
                  </button>
                ))}
              </div>

              {!customAmount ? (
                <button
                  type="button"
                  onClick={() => { setCustomAmount(true); setAmount(''); }}
                  className="w-full text-center text-xs font-bold text-orange-600 hover:text-orange-700 mt-3 py-2.5 border border-dashed border-orange-200 bg-orange-50/20 hover:bg-orange-50/50 rounded-xl transition-all"
                >
                  + Enter custom amount
                </button>
              ) : (
                <div className="relative mt-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    placeholder="Enter amount"
                    autoFocus
                    className="w-full border-2 border-orange-500 rounded-xl pl-8 pr-20 py-3 text-sm outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { setCustomAmount(false); setAmount(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                  >
                    Use Presets
                  </button>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Personal Note <span className="text-slate-400 font-normal lowercase italic">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Leave a word of encouragement..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800 font-medium placeholder:text-slate-400 resize-none transition-all"
              />
            </div>

            {/* Total Badge Summary */}
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between text-sm transition-all">
                <span className="text-slate-600 font-semibold">Total Donation:</span>
                <span className="font-black text-orange-600 tracking-tight text-base">
                  {fmt(Number(amount))} {selectedNGO ? `to ${selectedNGO.name}` : ''}
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !amount || !ngoId}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent text-white font-bold py-4 rounded-xl text-sm transition-all shadow-sm tracking-wide hover:shadow-md active:translate-y-px"
            >
              {submitting ? 'Processing Donation...' : `Donate ${amount && Number(amount) > 0 ? fmt(Number(amount)) : ''}`}
            </button>

            <p className="text-xs text-center text-slate-400 font-medium">
              Secure platform transaction.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}