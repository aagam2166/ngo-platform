import { useEffect, useState } from 'react';
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
  citizen: { firstName: string; lastName: string; email: string; phone?: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  RECEIVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

interface RespondModal {
  donationId: string;
  action: 'ACCEPTED' | 'REJECTED' | 'RECEIVED';
}

export default function NGODonationsPage() {
  const [donations, setDonations] = useState<ResourceDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modal, setModal] = useState<RespondModal | null>(null);
  const [ngoNote, setNgoNote] = useState('');
  const [responding, setResponding] = useState(false);
  const [responseError, setResponseError] = useState('');

  const fetchDonations = () => {
    setLoading(true);
    api.get('/donations/resources/incoming')
      .then(r => setDonations(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDonations(); }, []);

  const filtered = filterStatus === 'ALL'
    ? donations
    : donations.filter(d => d.status === filterStatus);

  const handleRespond = async () => {
    if (!modal) return;
    setResponseError('');
    setResponding(true);
    try {
      await api.patch(`/donations/resources/${modal.donationId}/respond`, {
        status: modal.action,
        ngoNote: ngoNote.trim() || undefined,
      });
      setModal(null);
      setNgoNote('');
      fetchDonations();
    } catch (err: any) {
      setResponseError(err.response?.data?.message || 'Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: 'Accept Donation', color: 'bg-green-600 hover:bg-green-700' },
    REJECTED: { label: 'Decline Donation', color: 'bg-red-600 hover:bg-red-700' },
    RECEIVED: { label: 'Mark as Received', color: 'bg-emerald-600 hover:bg-emerald-700' },
  };

  const pendingCount = donations.filter(d => d.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Respond modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transition-all border border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {ACTION_LABELS[modal.action].label}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave an optional note for the donor — they'll be notified automatically.
            </p>
            <textarea
              rows={3}
              value={ngoNote}
              onChange={e => setNgoNote(e.target.value)}
              placeholder={
                modal.action === 'ACCEPTED'
                  ? 'e.g. Thank you! Please call us to arrange drop-off.'
                  : modal.action === 'REJECTED'
                  ? 'e.g. We currently have sufficient supplies. Thank you for offering!'
                  : 'e.g. Received in good condition. Thank you so much!'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none mb-3 bg-white text-gray-900 transition-all"
            />
            {responseError && <p className="text-xs text-red-500 mb-3 font-medium">{responseError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleRespond}
                disabled={responding}
                className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm ${ACTION_LABELS[modal.action].color}`}
              >
                {responding ? 'Saving…' : ACTION_LABELS[modal.action].label}
              </button>
              <button
                onClick={() => { setModal(null); setNgoNote(''); setResponseError(''); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 bg-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Centered Professional Header Section */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            Donation Processing Queue
            {pendingCount > 0 && (
              <span className="text-xs bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold tracking-wide animate-pulse">
                {pendingCount} NEW
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-2.5 leading-relaxed">
            Review and manage incoming resource contributions from community donors
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {['ALL', 'PENDING', 'ACCEPTED', 'RECEIVED', 'REJECTED'].map(s => {
            const count = s === 'ALL' ? donations.length : donations.filter(d => d.status === s).length;
            const formattedLabel = s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase();
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                  filterStatus === s
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {formattedLabel} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
            <p className="text-gray-900 font-semibold mb-1">No donations in this category</p>
            <p className="text-sm text-gray-500 max-w-xs">When citizens offer to donate items, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md/50 transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="max-w-[70%]">
                    {/* Minimal text-only label indicator */}
                    <span className="inline-block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                      {d.category}
                    </span>
                    <p className="font-bold text-gray-900 text-base truncate">{d.itemName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{d.quantity}{d.unit ? ` ${d.unit}` : ''}</span> · Offered {fmtDate(d.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wide ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Donor info block */}
                <div className="bg-slate-50 rounded-xl p-3.5 mb-3 border border-slate-100/50 max-w-md">
                  <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Donor Contact Profile</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {d.citizen.firstName} {d.citizen.lastName}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">{d.citizen.email}</span>
                    {d.citizen.phone && (
                      <>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <span>{d.citizen.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                {d.description && (
                  <p className="text-xs text-gray-600 bg-slate-50/50 rounded-lg p-2.5 mb-3 leading-relaxed border border-dashed border-gray-100 italic max-w-md">
                    "{d.description}"
                  </p>
                )}

                {d.ngoNote && (
                  <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3 mb-3 max-w-md">
                    <p className="text-xs text-blue-700 font-medium">
                      <span className="font-bold uppercase text-2xs tracking-wider block mb-0.5 text-blue-500">Your Response Note</span>
                      {d.ngoNote}
                    </p>
                  </div>
                )}

                {/* Response Handles */}
                {d.status === 'PENDING' && (
                  <div className="flex gap-2 pt-3.5 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'ACCEPTED' })}
                      className="flex-1 text-center text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-2 rounded-lg transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'REJECTED' })}
                      className="flex-1 text-center text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 py-2 rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {d.status === 'ACCEPTED' && (
                  <div className="pt-3.5 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'RECEIVED' })}
                      className="w-full text-center text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2 rounded-lg transition-colors"
                    >
                      Mark as Received
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}