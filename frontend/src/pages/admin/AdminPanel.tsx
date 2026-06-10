import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface NGOAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface NGO {
  id: string;
  name: string;
  registrationNo: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  isVerified: boolean;
  createdAt: string;
  user: NGOAdmin;
  _count: { requests: number };
}

type Filter = 'all' | 'pending' | 'verified';

export default function AdminPanel() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/ngos')
      .then((res) => setNgos(res.data.data))
      .catch(() => setError('Failed to load NGOs. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (ngoId: string) => {
    setActionLoading(ngoId);
    try {
      await api.patch(`/admin/ngos/${ngoId}/approve`);
      setNgos((prev) => prev.map((n) => (n.id === ngoId ? { ...n, isVerified: true } : n)));
    } catch {
      alert('Failed to approve NGO.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (ngoId: string) => {
    setActionLoading(ngoId);
    try {
      await api.patch(`/admin/ngos/${ngoId}/revoke`);
      setNgos((prev) => prev.map((n) => (n.id === ngoId ? { ...n, isVerified: false } : n)));
    } catch {
      alert('Failed to revoke verification.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const filtered = ngos.filter((n) => {
    if (filter === 'pending') return !n.isVerified;
    if (filter === 'verified') return n.isVerified;
    return true;
  });

  const pendingCount = ngos.filter((n) => !n.isVerified).length;
  const verifiedCount = ngos.filter((n) => n.isVerified).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
              ⚙️
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">NGO Approvals</h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2 sm:mt-1">
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {pendingCount} Pending
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {verifiedCount} Verified
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400">{ngos.length} total registered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-full sm:w-fit overflow-x-auto scrollbar-none">
          {(['all', 'pending', 'verified'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? `All (${ngos.length})` : f === 'pending' ? `Pending (${pendingCount})` : `Verified (${verifiedCount})`}
            </button>
          ))}
        </div>

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

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No NGOs found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'pending'
                ? 'All NGOs have been verified.'
                : filter === 'verified'
                ? 'No NGOs have been verified yet.'
                : 'No NGOs have registered on the platform yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((ngo) => (
              <div
                key={ngo.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-0 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{ngo.name}</h3>
                      {ngo.isVerified ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{ngo.registrationNo}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 sm:gap-y-2 mt-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Location</p>
                        <p className="text-gray-700 font-medium">{ngo.city}, {ngo.state}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Registered</p>
                        <p className="text-gray-700 font-medium">{formatDate(ngo.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Admin</p>
                        <p className="text-gray-700 font-medium">
                          {ngo.user.firstName} {ngo.user.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Admin Email</p>
                        <p className="text-gray-700 font-medium truncate">{ngo.user.email}</p>
                      </div>
                    </div>

                    {ngo.description && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">{ngo.description}</p>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      {ngo._count.requests} request{ngo._count.requests !== 1 ? 's' : ''} handled
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 mt-4 sm:mt-0 flex-shrink-0 border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                    {!ngo.isVerified ? (
                      <button
                        onClick={() => handleApprove(ngo.id)}
                        disabled={actionLoading === ngo.id}
                        className="w-full sm:w-auto bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === ngo.id ? 'Approving…' : 'Approve'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevoke(ngo.id)}
                        disabled={actionLoading === ngo.id}
                        className="w-full sm:w-auto border border-red-300 text-red-600 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === ngo.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
