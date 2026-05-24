import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';
import AllocateResourceModal from '../../components/AllocateResourceModal';
import { Link } from 'react-router-dom';
// ─── Types ────────────────────────────────────────────────────────────────────

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

type Tab = 'queue' | 'mine' | 'roster' | 'join-requests' | 'interests';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '🍱 Food',
  MEDICAL: '🏥 Medical',
  SHELTER: '🏠 Shelter',
  EDUCATION: '📚 Education',
  CLOTHING: '👕 Clothing',
  FINANCIAL: '💰 Financial',
  OTHER: '📦 Other',
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

const UPDATABLE_STATUSES = [
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NGODashboard() {
  // Core data
  const [profile, setProfile] = useState<NGOProfile | null>(null);

  const [queue, setQueue] = useState<Request[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [tab, setTab] = useState<Tab>('queue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Queue actions
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [submittingReject, setSubmittingReject] = useState<string | null>(null);

  // My Requests actions
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});

  // Volunteer management data
  const [roster, setRoster] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [volunteerInterests, setVolunteerInterests] = useState<any[]>([]);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerError, setVolunteerError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [allocatingRequestId, setAllocatingRequestId] = useState<string | null>(null);
  const [allocatingRequestTitle, setAllocatingRequestTitle] = useState('');

  // ─── Data fetching ──────────────────────────────────────────────────────────

  // Load profile + queue + my-requests on mount
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

  // Fetch volunteer data when switching to those tabs
  useEffect(() => {
    if (!['roster', 'join-requests', 'interests'].includes(tab)) return;

    const fetchVolunteerData = async () => {
      setVolunteerLoading(true);
      setVolunteerError('');
      try {
        if (tab === 'roster') {
          const res = await api.get('/volunteers/roster');
          setRoster(res.data.data);
        } else if (tab === 'join-requests') {
          const res = await api.get('/volunteers/join-requests/incoming');
          setJoinRequests(res.data.data);
        } else if (tab === 'interests') {
          const res = await api.get('/volunteers/interests/incoming');
          setVolunteerInterests(res.data.data);
        }
      } catch {
        setVolunteerError('Failed to load data.');
      } finally {
        setVolunteerLoading(false);
      }
    };

    fetchVolunteerData();
  }, [tab]);

  // Standalone refetch for my-requests (used after return-to-queue)
  const fetchMyRequests = async () => {
    try {
      const res = await api.get('/ngo/my-requests');
      setMyRequests(res.data.data);
    } catch {
      // silent — user sees stale data rather than a crash
    }
  };

  // ─── Queue handlers ─────────────────────────────────────────────────────────

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

  const handleReject = async (requestId: string) => {
    const reason = rejectionReasons[requestId];
    if (!reason?.trim()) return;

    setSubmittingReject(requestId);
    try {
      // Accept first (assigns to this NGO), then immediately reject
      await api.patch(`/ngo/requests/${requestId}/accept`);
      await api.patch(`/ngo/requests/${requestId}/status`, {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
      });
      setQueue((prev) => prev.filter((r) => r.id !== requestId));
      setRejectingId(null);
      setRejectionReasons((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to reject request.');
    } finally {
      setSubmittingReject(null);
    }
  };

  // ─── My Requests handlers ───────────────────────────────────────────────────

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

  const handleReturnToQueue = async (requestId: string) => {
    if (!window.confirm('Return this request to the public queue? Your NGO will be unassigned.')) return;
    try {
      await api.patch(`/ngo/requests/${requestId}/return`);
      await fetchMyRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to return request');
    }
  };

  // ─── Volunteer management handlers ──────────────────────────────────────────

  const handleRemoveFromRoster = async (volunteerId: string) => {
    setActionId(volunteerId);
    try {
      await api.delete(`/volunteers/roster/${volunteerId}`);
      setRoster((prev) => prev.filter((v) => v.volunteerId !== volunteerId));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to remove volunteer');
    } finally {
      setActionId(null);
    }
  };

  const handleApproveJoinRequest = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/volunteers/join-requests/${id}/approve`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectJoinRequest = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/volunteers/join-requests/${id}/reject`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  const handleApproveInterest = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/volunteers/interests/${id}/approve`);
      setVolunteerInterests((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectInterest = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/volunteers/interests/${id}/reject`);
      setVolunteerInterests((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const completedCount = myRequests.filter((r) => r.status === 'COMPLETED').length;
  const activeCount = myRequests.filter(
    (r) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status)
  ).length;

  // ─── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.name ?? 'NGO Dashboard'}
              </h1>
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
              <div className="mt-3">
                <Link
                  to="/ngo/resources"
                  className="text-xs text-orange-500 hover:text-orange-700 font-medium border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                >
                  📦 Manage Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
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

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 flex-wrap">
          {/* Queue */}
          <button
            onClick={() => setTab('queue')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'queue'
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

          {/* My Requests */}
          <button
            onClick={() => setTab('mine')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'mine'
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

          {/* Roster */}
          <button
            onClick={() => setTab('roster')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'roster'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Roster
            {roster.length > 0 && (
              <span className="ml-2 bg-gray-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {roster.length}
              </span>
            )}
          </button>

          {/* Join Requests */}
          <button
            onClick={() => setTab('join-requests')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'join-requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Join Requests
            {joinRequests.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {joinRequests.length}
              </span>
            )}
          </button>

          {/* Interests */}
          <button
            onClick={() => setTab('interests')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'interests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Interests
            {volunteerInterests.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {volunteerInterests.length}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── Queue Tab ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
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
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{req.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {req.city}, {req.state} · {formatDate(req.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={accepting === req.id || submittingReject === req.id}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {accepting === req.id ? 'Accepting…' : 'Accept'}
                        </button>
                        <button
                          onClick={() =>
                            setRejectingId(rejectingId === req.id ? null : req.id)
                          }
                          disabled={accepting === req.id || submittingReject === req.id}
                          className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Inline rejection form */}
                    {rejectingId === req.id && (
                      <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm font-semibold text-red-700 mb-2">
                          Reason for declining this request
                        </p>
                        <textarea
                          rows={2}
                          value={rejectionReasons[req.id] ?? ''}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Explain why your NGO cannot handle this request…"
                          className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 outline-none focus:border-red-400 resize-none bg-white mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={
                              !rejectionReasons[req.id]?.trim() ||
                              submittingReject === req.id
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                          >
                            {submittingReject === req.id ? 'Declining…' : 'Confirm Decline'}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReasons((prev) => {
                                const next = { ...prev };
                                delete next[req.id];
                                return next;
                              });
                            }}
                            className="flex-1 border border-gray-300 bg-white text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom badges */}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                        {CATEGORY_LABELS[req.category] ?? req.category}
                      </span>
                      <span
                        className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'
                          }`}
                      >
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── My Requests Tab ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
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
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.city}, {req.state} · Updated {formatDate(req.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    {/* Category / urgency / citizen */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                        {CATEGORY_LABELS[req.category] ?? req.category}
                      </span>
                      <span
                        className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'
                          }`}
                      >
                        {URGENCY_LABELS[req.urgencyLevel]} urgency
                      </span>
                      <span className="text-xs text-gray-400">
                        {req.citizen.firstName} {req.citizen.lastName}
                      </span>
                    </div>

                    {/* Actions — only shown for non-terminal statuses */}
                    {!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(req.status) && (
                      <div className="mt-4 pt-3 border-t border-gray-50 space-y-3">

                        {/* Return to queue button — UNDER_REVIEW or APPROVED only */}
                        {['UNDER_REVIEW', 'APPROVED'].includes(req.status) && (
                          <button
                            onClick={() => handleReturnToQueue(req.id)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-medium border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg"
                          >
                            ↩ Return to Queue
                          </button>


                        )}

                        <button
                          onClick={() => {
                            setAllocatingRequestId(req.id);
                            setAllocatingRequestTitle(req.title);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg"
                        >
                          Allocate Resources
                        </button>

                        {/* Status update dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={pendingStatuses[req.id] ?? ''}
                            onChange={(e) =>
                              setPendingStatuses((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── Roster Tab ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'roster' && (
          <>
            {volunteerLoading && (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!volunteerLoading && volunteerError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {volunteerError}
              </div>
            )}

            {!volunteerLoading && !volunteerError && roster.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">🤝</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No volunteers yet</h3>
                <p className="text-sm text-gray-500">
                  Volunteers can send you join requests which will appear in the Join Requests tab.
                </p>
              </div>
            )}

            {!volunteerLoading && !volunteerError && roster.length > 0 && (
              <div className="space-y-3">
                {roster.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">
                        {entry.volunteer.user.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {entry.volunteer.user.firstName} {entry.volunteer.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{entry.volunteer.user.email}</p>
                        {entry.volunteer.user.phone && (
                          <p className="text-xs text-gray-400">{entry.volunteer.user.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${entry.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {entry.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {entry.isActive && (
                        <button
                          onClick={() => handleRemoveFromRoster(entry.volunteerId)}
                          disabled={actionId === entry.volunteerId}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {actionId === entry.volunteerId ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── Join Requests Tab ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'join-requests' && (
          <>
            {volunteerLoading && (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!volunteerLoading && !volunteerError && joinRequests.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">📬</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No pending join requests</h3>
                <p className="text-sm text-gray-500">
                  When volunteers apply to join your NGO, their requests will appear here.
                </p>
              </div>
            )}

            {!volunteerLoading && !volunteerError && joinRequests.length > 0 && (
              <div className="space-y-4">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center font-bold text-purple-700 text-lg shrink-0">
                        {req.volunteer.user.firstName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {req.volunteer.user.firstName} {req.volunteer.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.volunteer.user.email}
                          {req.volunteer.user.phone && ` · ${req.volunteer.user.phone}`}
                        </p>
                        {req.message && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700">"{req.message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleApproveJoinRequest(req.id)}
                        disabled={actionId === req.id}
                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        {actionId === req.id ? 'Approving…' : '✓ Accept Volunteer'}
                      </button>
                      <button
                        onClick={() => handleRejectJoinRequest(req.id)}
                        disabled={actionId === req.id}
                        className="flex-1 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── Interests Tab ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'interests' && (
          <>
            {volunteerLoading && (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!volunteerLoading && !volunteerError && volunteerInterests.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">🙋</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No volunteer interests</h3>
                <p className="text-sm text-gray-500">
                  When volunteers express interest in your requests, they appear here.
                </p>
              </div>
            )}

            {!volunteerLoading && !volunteerError && volunteerInterests.length > 0 && (
              <div className="space-y-4">
                {volunteerInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    {/* Volunteer info */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {interest.volunteer.user.firstName} {interest.volunteer.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {interest.volunteer.user.email}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full shrink-0">
                        Wants to help
                      </span>
                    </div>

                    {/* Request details */}
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 mb-3">
                      <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-0.5">
                        Request
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {interest.request.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {interest.request.category} · {interest.request.city} · Urgency{' '}
                        {interest.request.urgencyLevel}/5
                      </p>
                    </div>

                    {/* Optional message */}
                    {interest.message && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                        <p className="text-sm text-gray-700">"{interest.message}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleApproveInterest(interest.id)}
                        disabled={actionId === interest.id}
                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        {actionId === interest.id ? 'Assigning…' : '✓ Assign Volunteer'}
                      </button>
                      <button
                        onClick={() => handleRejectInterest(interest.id)}
                        disabled={actionId === interest.id}
                        className="flex-1 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {allocatingRequestId && (
          <AllocateResourceModal
            requestId={allocatingRequestId}
            requestTitle={allocatingRequestTitle}
            onClose={() => {
              setAllocatingRequestId(null);
              setAllocatingRequestTitle('');
            }}
          />
        )}

      </main>
    </div>
  );
}
