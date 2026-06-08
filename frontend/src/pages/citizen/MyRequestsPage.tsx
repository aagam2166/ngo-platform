import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

interface Request {
  id: string;
  title: string;
  category: string;
  status: string;
  urgencyLevel: number;
  city: string;
  state: string;
  createdAt: string;
}

// Fixed: Emojis stripped out to protect option baseline layout alignments
const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Food',
  MEDICAL: 'Medical',
  SHELTER: 'Shelter',
  EDUCATION: 'Education',
  CLOTHING: 'Clothing',
  FINANCIAL: 'Financial',
  OTHER: 'Other',
};

const URGENCY_COLORS: Record<number, string> = {
  1: 'text-green-600',
  2: 'text-lime-600',
  3: 'text-yellow-600',
  4: 'text-orange-600',
  5: 'text-red-600',
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancellingAction, setIsCancellingAction] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/mine');
      setRequests(res.data.data);
    } catch (err: any) {
      setError('Failed to load your requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id: string) => {
    setCancelError('');
    setIsCancellingAction(true);
    try {
      await api.patch(`/requests/${id}/cancel`);
      await fetchRequests();
      setCancellingId(null);
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setIsCancellingAction(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Fixed: Centered Top Header Block */}
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track all your submitted help requests</p>
          <div className="mt-4">
            <Link
              to="/requests/new"
              className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              + New Request
            </Link>
          </div>
        </div>

        {/* Loading Global State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error Global State */}
        {!loading && error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty state (Emoji safely removed) */}
        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">No requests yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              Submit your first help request and an NGO will get back to you.
            </p>
            <Link
              to="/requests/new"
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Submit a Request
            </Link>
          </div>
        )}

        {/* Request cards - Original Layout Intact */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.city}, {req.state} · {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {/* Bottom metadata row */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {CATEGORY_LABELS[req.category] ?? req.category}
                  </span>
                  <span className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel] ?? 'text-gray-500'}`}>
                    Urgency {req.urgencyLevel}/5
                  </span>
                  <Link
                    to={`/requests/${req.id}`}
                    className="text-xs text-orange-500 hover:text-orange-700 font-medium ml-auto"
                  >
                    View Details →
                  </Link>
                </div>

                {/* Dynamic Cancel Block — only for PENDING requests */}
                {req.status === 'PENDING' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between min-h-[32px]">
                    {cancellingId === req.id ? (
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-red-600 font-medium truncate">
                            {cancelError ? cancelError : 'Are you sure you want to cancel?'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCancel(req.id)}
                            disabled={isCancellingAction}
                            className="text-xs bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            {isCancellingAction ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCancellingId(null); setCancelError(''); }}
                            disabled={isCancellingAction}
                            className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCancellingId(req.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}
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