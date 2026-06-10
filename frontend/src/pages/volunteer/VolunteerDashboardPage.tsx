import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast'

type Tab = 'assignments' | 'open-requests' | 'interests' | 'memberships';

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Food', MEDICAL: 'Medical', SHELTER: 'Shelter',
  EDUCATION: 'Education', CLOTHING: 'Clothing',
  FINANCIAL: 'Financial', OTHER: 'Other',
};

const URGENCY_COLORS: Record<number, string> = {
  1: 'text-green-600', 2: 'text-lime-600', 3: 'text-yellow-600',
  4: 'text-orange-600', 5: 'text-red-600',
};

const ASSIGNMENT_STATUS_STYLES: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const JOIN_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const INTEREST_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function VolunteerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab') as Tab;
    const validTabs: Tab[] = ['assignments', 'open-requests', 'interests', 'memberships'];
    return validTabs.includes(t) ? t : 'assignments';
  });
  const [assignments, setAssignments] = useState<any[]>([]);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Interest expression state
  const [interestMessages, setInterestMessages] = useState<Record<string, string>>({});
  const [submittingInterest, setSubmittingInterest] = useState<string | null>(null);

  // Join NGO state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState('');

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };



  const fetchData = async (currentTab: Tab) => {
    setLoading(true);
    setError('');
    try {
      if (currentTab === 'assignments') {
        const res = await api.get('/volunteers/assignments');
        setAssignments(res.data.data);
      } else if (currentTab === 'open-requests') {
        const res = await api.get('/volunteers/open-requests');
        setOpenRequests(res.data.data);
      } else if (currentTab === 'interests') {
        const res = await api.get('/volunteers/interests');
        setInterests(res.data.data);
      } else if (currentTab === 'memberships') {
        const res = await api.get('/volunteers/join-requests');
        setJoinRequests(res.data.data);
      }
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const handleUpdateAssignment = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/volunteers/assignments/${id}`, { status });
      await fetchData('assignments');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExpressInterest = async (requestId: string) => {
    setSubmittingInterest(requestId);
    try {
      await api.post(`/volunteers/interests/${requestId}`, {
        message: interestMessages[requestId]?.trim() || null,
      });
      setOpenRequests((prev) => prev.filter((r) => r.id !== requestId));
      setInterestMessages((prev) => { const n = { ...prev }; delete n[requestId]; return n; });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to express interest');
    } finally {
      setSubmittingInterest(null);
    }
  };

  const handleWithdrawInterest = async (id: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/volunteers/interests/${id}/withdraw`);
      await fetchData('interests');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to withdraw');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWithdrawJoinRequest = async (id: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/volunteers/join-requests/${id}/withdraw`);
      await fetchData('memberships');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to withdraw');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLeaveNGO = async (ngoId: string) => {
    if (!window.confirm('Leave this NGO? You can re-apply later.')) return;
    setUpdatingId(ngoId);
    try {
      await api.delete(`/volunteers/roster/leave/${ngoId}`);
      toast.success('You have left the NGO');
      // Refetch memberships to ensure UI updates correctly
      await fetchData('memberships');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to leave NGO');
    } finally {
      setUpdatingId(null);
    }
  };

  const searchNGOs = async (name: string, city: string) => {
    if (!name.trim() && !city.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.append('name', name);
      if (city.trim()) params.append('city', city);
      const res = await api.get(`/volunteers/ngos/search?${params.toString()}`);
      setSearchResults(res.data.data);
    } catch (err: any) {
      toast.error('Failed to search NGOs');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendJoinRequest = async () => {
    if (!selectedNgoId.trim()) {
      setJoinError('Please select an NGO');
      return;
    }
    setSubmittingJoin(true);
    setJoinError('');
    try {
      await api.post('/volunteers/join-requests', {
        ngoId: selectedNgoId.trim(),
        message: joinMessage.trim() || null,
      });
      setShowJoinForm(false);
      setSearchQuery('');
      setSearchCity('');
      setSelectedNgoId('');
      setJoinMessage('');
      setSearchResults([]);
      await fetchData('memberships');
    } catch (err: any) {
      setJoinError(err?.response?.data?.message ?? 'Failed to send join request');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'assignments', label: 'My Assignments', count: assignments.filter(a => a.status !== 'COMPLETED').length },
    { key: 'open-requests', label: 'Find Requests', count: openRequests.length },
    { key: 'interests', label: 'My Interests', count: interests.filter(i => i.status === 'PENDING').length },
    { key: 'memberships', label: 'NGO Memberships', count: joinRequests.filter(j => j.status === 'PENDING').length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your assignments, find opportunities, and connect with NGOs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto scrollbar-none w-full sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`ml-1.5 sm:ml-2 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${t.key === 'assignments' ? 'bg-purple-500' :
                  t.key === 'open-requests' ? 'bg-orange-500' :
                    t.key === 'interests' ? 'bg-blue-500' :
                      'bg-yellow-500'
                  }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── My Assignments Tab ── */}
        {!loading && !error && tab === 'assignments' && (
          <>
            {assignments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">📋</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No assignments yet</h3>
                <p className="text-sm text-gray-500">
                  Browse open requests and express interest, or wait for an NGO to assign you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="font-semibold text-gray-900">{a.request.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          Citizen: {a.request.citizen.firstName} {a.request.citizen.lastName}
                          {a.request.citizen.phone && (
                            <span className="ml-2 text-orange-600 font-medium">
                              {a.request.citizen.phone}
                            </span>
                          )}
                        </p>
                        {a.ngo && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            NGO: {a.ngo.name} · {a.ngo.city}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                          Assigned {formatDate(a.assignedAt)}
                        </p>
                        {a.notes && (
                          <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-xs text-orange-700">{a.notes}</p>
                          </div>
                        )}
                      </div>
                      <span className={`self-start text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ASSIGNMENT_STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-600'
                        }`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                      {a.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateAssignment(a.id, 'IN_PROGRESS')}
                          disabled={updatingId === a.id}
                          className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          {updatingId === a.id ? 'Updating…' : 'Mark In Progress'}
                        </button>
                      )}
                      {a.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateAssignment(a.id, 'COMPLETED')}
                          disabled={updatingId === a.id}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          {updatingId === a.id ? 'Updating…' : '✓ Mark Completed'}
                        </button>
                      )}
                      {a.status === 'COMPLETED' && (
                        <span className="text-sm text-green-600 font-semibold">✅ Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Open Requests Tab ── */}
        {!loading && !error && tab === 'open-requests' && (
          <>
            {openRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">🔍</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No open requests right now</h3>
                <p className="text-sm text-gray-500">
                  Approved requests that need volunteers will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {openRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-1 flex-wrap">
                          <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                            {CATEGORY_LABELS[req.category] ?? req.category}
                          </span>
                          <span className={`text-[10px] sm:text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'}`}>
                            Urgency {req.urgencyLevel}/5
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{req.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-0.5">
                          {req.city}, {req.state} · {formatDate(req.createdAt)}
                        </p>
                        {req.ngo && (
                          <p className="text-[10px] sm:text-xs text-orange-600 font-medium mt-0.5">
                            Handled by {req.ngo.name}
                          </p>
                        )}
                      </div>
                      <div className="self-start">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {/* Interest form */}
                    <div className="border-t border-gray-50 pt-3">
                      <textarea
                        rows={2}
                        value={interestMessages[req.id] ?? ''}
                        onChange={(e) =>
                          setInterestMessages((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Optional: tell the NGO why you want to help with this request…"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-orange-400 resize-none mb-2 bg-white text-gray-900"
                      />
                      <button
                        onClick={() => handleExpressInterest(req.id)}
                        disabled={submittingInterest === req.id}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        {submittingInterest === req.id ? 'Sending…' : 'I can to Help'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Interests Tab ── */}
        {!loading && !error && tab === 'interests' && (
          <>
            {interests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">💬</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">No interests yet</h3>
                <p className="text-sm text-gray-500">
                  Go to "Find Requests" to express interest in helping with specific requests.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interests.map((interest) => (
                  <div key={interest.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full">
                        <h3 className="font-semibold text-gray-900">{interest.request.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {interest.request.city}, {interest.request.state}
                          {interest.ngo && ` · ${interest.ngo.name}`}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                          Applied {formatDate(interest.createdAt)}
                        </p>
                        {interest.message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-600">"{interest.message}"</p>
                          </div>
                        )}
                      </div>
                      <span className={`self-start text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${INTEREST_STATUS_STYLES[interest.status] ?? 'bg-gray-100 text-gray-500'
                        }`}>
                        {interest.status}
                      </span>
                    </div>
                    {interest.status === 'PENDING' && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => handleWithdrawInterest(interest.id)}
                          disabled={updatingId === interest.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {updatingId === interest.id ? 'Withdrawing…' : 'Withdraw Interest'}
                        </button>
                      </div>
                    )}
                    {interest.status === 'APPROVED' && (
                      <p className="text-xs text-green-600 font-medium mt-2">
                        ✅ Approved — check My Assignments for your assignment
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── NGO Memberships Tab ── */}
        {!loading && !error && tab === 'memberships' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 font-medium">
                Your NGO affiliations and pending applications
              </p>
              <button
                onClick={() => setShowJoinForm(!showJoinForm)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {showJoinForm ? 'Cancel' : '+ Apply to NGO'}
              </button>
            </div>

            {/* Join form */}
            {showJoinForm && (
              <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Search & Apply to Join an NGO</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Search by NGO Name
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchNGOs(e.target.value, searchCity);
                      }}
                      placeholder="Enter NGO name…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Filter by City (optional)
                    </label>
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => {
                        setSearchCity(e.target.value);
                        searchNGOs(searchQuery, e.target.value);
                      }}
                      placeholder="Enter city name…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                    />
                  </div>

                  {/* Search Results */}
                  {searchLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((ngo) => (
                        <button
                          key={ngo.id}
                          onClick={() => {
                            setSelectedNgoId(ngo.id);
                            setSearchQuery('');
                            setSearchCity('');
                            setSearchResults([]);
                          }}
                          className={`w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-orange-50 transition-colors ${
                            selectedNgoId === ngo.id ? 'bg-orange-100 border-l-2 border-l-orange-500' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">{ngo.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{ngo.city}, {ngo.state}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && (searchQuery.trim() || searchCity.trim()) && (
                    <p className="text-xs text-gray-400 text-center py-4">No NGOs found. Try different search terms.</p>
                  )}

                  {selectedNgoId && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-orange-900">
                        ✓ Selected:{' '}
                        {searchResults.find((n) => n.id === selectedNgoId)?.name ||
                          'NGO'}
                      </p>
                      <button
                        onClick={() => setSelectedNgoId('')}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2"
                      >
                        Change Selection
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      placeholder="Tell them about your skills and why you want to join…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none bg-white text-gray-900"
                    />
                  </div>
                  {joinError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {joinError}
                    </p>
                  )}
                  <button
                    onClick={handleSendJoinRequest}
                    disabled={submittingJoin || !selectedNgoId.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {submittingJoin ? 'Sending…' : 'Send Application'}
                  </button>
                </div>
              </div>
            )}

            {joinRequests.length === 0 && !showJoinForm ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <span className="text-4xl">🏢</span>
                <h3 className="font-semibold text-gray-900 mt-4 mb-1">Not affiliated with any NGO yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Apply to join an NGO to start receiving direct assignments.
                </p>
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg"
                >
                  Apply to an NGO
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="w-full">
                        <p className="font-semibold text-gray-900 text-sm">
                          {req.ngo.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {req.ngo.city}, {req.ngo.state}
                          {req.ngo.isVerified && (
                            <span className="ml-2 text-green-600 font-semibold">✓ Verified</span>
                          )}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                          Applied {formatDate(req.createdAt)}
                          {req.respondedAt && ` · Responded ${formatDate(req.respondedAt)}`}
                        </p>
                        {req.message && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{req.message}"</p>
                        )}
                      </div>
                      <span className={`self-start sm:self-auto text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${JOIN_STATUS_STYLES[req.status] ?? 'bg-gray-100 text-gray-500'
                        }`}>
                        {req.status}
                      </span>
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="mt-3 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleWithdrawJoinRequest(req.id)}
                          disabled={updatingId === req.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {updatingId === req.id ? 'Withdrawing…' : 'Withdraw Application'}
                        </button>
                      </div>
                    )}
                    {req.status === 'APPROVED' && (
                      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs text-green-600 font-medium">
                          ✅ Active member
                        </p>
                        <button
                          onClick={() => handleLeaveNGO(req.ngoId)}
                          disabled={updatingId === req.ngoId}
                          className="text-xs text-red-500 hover:text-red-700 font-medium
                 border border-red-200 bg-red-50 px-3 py-1 rounded-lg
                 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {updatingId === req.ngoId ? 'Leaving…' : 'Leave NGO'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}