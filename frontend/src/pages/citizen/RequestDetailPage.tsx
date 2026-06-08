import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

interface StatusLog {
  id: string;
  status: string;
  changedBy: string;
  note?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface Assignment {
  id: string;
  status: string;
  assignedAt: string;
  volunteer: {
    user: { firstName: string; lastName: string; email: string };
  };
}

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgencyLevel: number;
  address: string;
  city: string;
  state: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  citizen: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  ngo?: { id: string; name: string; city: string; state: string; isVerified: boolean };
  assignments: Assignment[];
  statusLogs: StatusLog[];
  comments: Comment[];
}

// Fixed: Emojis stripped out to protect clean layout presentation lines
const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Food',
  MEDICAL: 'Medical',
  SHELTER: 'Shelter',
  EDUCATION: 'Education',
  CLOTHING: 'Clothing',
  FINANCIAL: 'Financial',
  OTHER: 'Other',
};

const URGENCY_LABELS: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical',
};

const URGENCY_COLORS: Record<number, string> = {
  1: 'text-green-600', 2: 'text-lime-600', 3: 'text-yellow-600',
  4: 'text-orange-600', 5: 'text-red-600',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: 'Citizen',
  NGO_ADMIN: 'NGO',
  VOLUNTEER: 'Volunteer',
  SUPER_ADMIN: 'Admin',
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((s: RootState) => s.auth);

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;
    setCommentError('');
    setSubmittingComment(true);
    try {
      await api.post(`/requests/${id}/comments`, { body: commentBody.trim() });
      setCommentBody('');
      await fetchRequest();
    } catch (err: any) {
      setCommentError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/requests/${id}/comments/${commentId}`);
      await fetchRequest();
    } catch {
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const backPath = user?.role === 'NGO_ADMIN' || user?.role === 'SUPER_ADMIN'
    ? '/ngo/dashboard'
    : '/requests/mine';

  const backLabel = user?.role === 'NGO_ADMIN' || user?.role === 'SUPER_ADMIN'
    ? '← NGO Dashboard'
    : '← My Requests';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {error || 'Request not found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Back link */}
        <Link to={backPath} className="text-sm text-orange-500 hover:text-orange-700 font-medium">
          {backLabel}
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
              <p className="text-sm text-gray-400 mt-1 font-mono">#{request.id.slice(0, 8)}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {CATEGORY_LABELS[request.category] ?? request.category}
            </span>
            <span className={`text-xs font-semibold ${URGENCY_COLORS[request.urgencyLevel]}`}>
              {URGENCY_LABELS[request.urgencyLevel]} urgency
            </span>
            <span className="text-xs text-gray-400">
              {request.city}, {request.state}
            </span>
            <span className="text-xs text-gray-400">
              Submitted {formatDate(request.createdAt)}
            </span>
          </div>

          <p className="text-sm text-gray-700 mt-4 leading-relaxed">{request.description}</p>

          {request.status === 'REJECTED' && request.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{request.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Citizen + NGO info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citizen</p>
            <p className="font-semibold text-gray-900 text-sm">
              {request.citizen.firstName} {request.citizen.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{request.citizen.email}</p>
            {request.citizen.phone && (
              <p className="text-xs text-gray-500">{request.citizen.phone}</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">NGO</p>
            {request.ngo ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{request.ngo.name}</p>
                  {request.ngo.isVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {request.ngo.city}, {request.ngo.state}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Not yet assigned</p>
            )}
          </div>
        </div>

        {/* Volunteer assignments */}
        {request.assignments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Volunteers</h2>
            <div className="space-y-2">
              {request.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.volunteer.user.firstName} {a.volunteer.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{a.volunteer.user.email}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status timeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
          {request.statusLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No status history yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {request.statusLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        index === request.statusLogs.length - 1
                          ? STATUS_COLORS[log.status] + ' border-current'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index === request.statusLogs.length - 1
                            ? 'bg-current'
                            : 'bg-gray-300'
                        }`}
                      />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {log.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-gray-500 mt-1">{log.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Comments
            {request.comments.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {request.comments.length}
              </span>
            )}
          </h2>

          {/* Comment list */}
          {request.comments.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No comments yet. Be the first.</p>
          ) : (
            <div className="space-y-3 mb-5">
              {request.comments.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.author.firstName} {c.author.lastName}
                      </span>
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                        {ROLE_LABELS[c.author.role] ?? c.author.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                      {c.author.id === user?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={deletingCommentId === c.id}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingCommentId === c.id ? '…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="border-t border-gray-50 pt-4">
            <textarea
              rows={3}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none bg-white text-gray-900"
            />
            {commentError && (
              <p className="text-xs text-red-500 mt-1">{commentError}</p>
            )}
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!commentBody.trim() || submittingComment}
              className="mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {submittingComment ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}