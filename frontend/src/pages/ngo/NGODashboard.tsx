import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

interface Citizen {
  firstName: string;
  lastName: string;
  email: string;
}

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgencyLevel: number;
  address: string;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  citizen: Citizen;
}

interface NGOProfile {
  id: string;
  name: string;
  registrationNo: string;
  city: string;
  state: string;
  isVerified: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD:      '🍱 Food',
  MEDICAL:   '🏥 Medical',
  SHELTER:   '🏠 Shelter',
  EDUCATION: '📚 Education',
  CLOTHING:  '👕 Clothing',
  FINANCIAL: '💰 Financial',
  OTHER:     '📦 Other',
};

const URGENCY_COLORS: Record<number, string> = {
  1: 'text-green-600',
  2: 'text-lime-600',
  3: 'text-yellow-600',
  4: 'text-orange-600',
  5: 'text-red-600',
};

const URGENCY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const UPDATABLE_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

type Tab = 'queue' | 'mine';

export default function NGODashboard() {
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [queue, setQueue] = useState<Request[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [tab, setTab] = useState<Tab>('queue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, queueRes, mineRes] = await Promise.all([
          api.get('/ngo/profile'),
          api.get('/ngo/queue'),
          api.get('/ngo/my-requests'),
        ]);
        setProfile(profileRes.data.data);
        setQueue(queueRes.data.data);
        setMyRequests(mineRes.data.data);
      } catch {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAccept = async (requestId: string) => {
    setAccepting(requestId);
    try {
      const res = await api.patch(`/ngo/requests/${requestId}/accept`);
      const accepted = res.data.data;
      setQueue((prev) => prev.filter((r) => r.id !== requestId));
      setMyRequests((prev) => [accepted, ...prev]);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to accept request.');
    } finally {
      setAccepting(null);
    }
  };

  const handleStatusUpdate = async (requestId: string) => {
    const status = pendingStatuses[requestId];
    if (!status) return;
    setUpdatingStatus(requestId);
    try {
      const res = await api.patch(`/ngo/requests/${requestId}/status`, { status });
      const updated = res.data.data;
      setMyRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      setPendingStatuses((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const completedCount = myRequests.filter((r) => r.status === 'COMPLETED').length;
  const activeCount = myRequests.filter((r) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  🏢
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name ?? 'NGO Dashboard'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {profile?.isVerified ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Pending Verification
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {profile?.city}, {profile?.state}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Request Queue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{queue.length}</p>
                <p className="text-xs text-gray-400 mt-1">Awaiting acceptance</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
                <p className="text-xs text-gray-400 mt-1">In progress by your NGO</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{completedCount}</p>
                <p className="text-xs text-gray-400 mt-1">Resolved by your NGO</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
              <button
                onClick={() => setTab('queue')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === 'queue'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Request Queue
                {queue.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {queue.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('mine')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === 'mine'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Requests
                {myRequests.length > 0 && (
                  <span className="ml-2 bg-gray-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {myRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Queue Tab */}
            {tab === 'queue' && (
              <>
                {queue.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Queue is empty</h3>
                    <p className="text-sm text-gray-500">No pending requests waiting for acceptance.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queue.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{req.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {req.city}, {req.state} · {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAccept(req.id)}
                            disabled={accepting === req.id}
                            className="flex-shrink-0 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {accepting === req.id ? 'Accepting…' : 'Accept'}
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            {CATEGORY_LABELS[req.category] ?? req.category}
                          </span>
                          <span className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'}`}>
                            {URGENCY_LABELS[req.urgencyLevel] ?? req.urgencyLevel} urgency
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {req.citizen.firstName} {req.citizen.lastName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Requests Tab */}
            {tab === 'mine' && (
              <>
                {myRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">No requests yet</h3>
                    <p className="text-sm text-gray-500">
                      Accept requests from the queue to start managing them here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {req.city}, {req.state} · Updated {formatDate(req.updatedAt)}
                            </p>
                          </div>
                          <StatusBadge status={req.status} />
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            {CATEGORY_LABELS[req.category] ?? req.category}
                          </span>
                          <span className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'}`}>
                            {URGENCY_LABELS[req.urgencyLevel]} urgency
                          </span>
                          <span className="text-xs text-gray-400">
                            {req.citizen.firstName} {req.citizen.lastName}
                          </span>
                        </div>

                        {!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(req.status) && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                            <select
                              value={pendingStatuses[req.id] ?? ''}
                              onChange={(e) =>
                                setPendingStatuses((prev) => ({ ...prev, [req.id]: e.target.value }))
                              }
                              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            >
                              <option value="" disabled>
                                Update status…
                              </option>
                              {UPDATABLE_STATUSES.filter((s) => s !== req.status).map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleStatusUpdate(req.id)}
                              disabled={!pendingStatuses[req.id] || updatingStatus === req.id}
                              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {updatingStatus === req.id ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
