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

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍱', CLOTHING: '👕', MEDICAL: '🏥', EDUCATION: '📚',
  FURNITURE: '🪑', ELECTRONICS: '💻', OTHER: '📦',
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
    ACCEPTED: { label: 'Accept Donation', color: 'bg-green-500 hover:bg-green-600' },
    REJECTED: { label: 'Decline Donation', color: 'bg-red-500 hover:bg-red-600' },
    RECEIVED: { label: 'Mark as Received', color: 'bg-emerald-500 hover:bg-emerald-600' },
  };

  const pendingCount = donations.filter(d => d.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Respond modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {ACTION_LABELS[modal.action].label}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave an optional note for the donor — they'll be notified.
            </p>
            <textarea
              rows={3}
              value={ngoNote}
              onChange={e => setNgoNote(e.target.value)}
              placeholder={
                modal.action === 'ACCEPTED'
                  ? 'e.g. Thank you! Please call us at 9XXXXXXXXX to arrange drop-off.'
                  : modal.action === 'REJECTED'
                  ? 'e.g. We currently have sufficient supplies. Thank you for offering!'
                  : 'e.g. Received in good condition. Thank you so much!'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none mb-3"
            />
            {responseError && <p className="text-xs text-red-500 mb-3">{responseError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleRespond}
                disabled={responding}
                className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${ACTION_LABELS[modal.action].color}`}
              >
                {responding ? 'Saving…' : ACTION_LABELS[modal.action].label}
              </button>
              <button
                onClick={() => { setModal(null); setNgoNote(''); setResponseError(''); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Incoming Donations
              {pendingCount > 0 && (
                <span className="text-sm bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {pendingCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Resource donation offers from citizens</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['ALL', 'PENDING', 'ACCEPTED', 'RECEIVED', 'REJECTED'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === s
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {s === 'ALL' ? `All (${donations.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${donations.filter(d => d.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">📥</div>
            <p className="text-gray-900 font-semibold mb-1">No donations in this category</p>
            <p className="text-sm text-gray-500">When citizens offer to donate items, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[d.category] ?? '📦'}</span>
                    <div>
                      <p className="font-bold text-gray-900">{d.itemName}</p>
                      <p className="text-xs text-gray-500">
                        {d.quantity}{d.unit ? ` ${d.unit}` : ''} · Offered {fmtDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Donor info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Donor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {d.citizen.firstName} {d.citizen.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{d.citizen.email}</p>
                  {d.citizen.phone && <p className="text-xs text-gray-500">{d.citizen.phone}</p>}
                </div>

                {d.description && (
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed italic">"{d.description}"</p>
                )}

                {d.ngoNote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-3">
                    <p className="text-xs text-blue-600 font-medium">Your note: {d.ngoNote}</p>
                  </div>
                )}

                {/* Action buttons */}
                {d.status === 'PENDING' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'ACCEPTED' })}
                      className="flex-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-2 rounded-lg transition-colors"
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'REJECTED' })}
                      className="flex-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 py-2 rounded-lg transition-colors"
                    >
                      ✗ Decline
                    </button>
                  </div>
                )}
                {d.status === 'ACCEPTED' && (
                  <div className="pt-3 border-t border-gray-50">
                    <button
                      onClick={() => setModal({ donationId: d.id, action: 'RECEIVED' })}
                      className="w-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2 rounded-lg transition-colors"
                    >
                      🙌 Mark as Received
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
