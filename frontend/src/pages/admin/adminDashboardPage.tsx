import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface DashboardStats {
  users: { total: number; byRole: { role: string; count: number }[] };
  ngos: { total: number; verified: number; pending: number };
  requests: { total: number; byStatus: { status: string; count: number }[] };
  volunteers: { total: number };
  resources: { total: number };
}

const STATUS_COLOR_MAP: Record<string, string> = {
  'UNDER REVIEW': 'bg-blue-50 text-blue-700 border-blue-200',
  'REJECTED':     'bg-red-50 text-red-700 border-red-200',
  'IN PROGRESS':   'bg-purple-50 text-purple-700 border-purple-200',
  'COMPLETED':     'bg-green-50 text-green-700 border-green-200',
  'CANCELLED':     'bg-gray-100 text-gray-700 border-gray-200',
};

const ROLE_COLOR_MAP: Record<string, string> = {
  'CITIZEN':     'bg-indigo-50 text-indigo-700 border-indigo-100',
  'NGO_ADMIN':   'bg-amber-50 text-amber-700 border-amber-200',
  'VOLUNTEER':   'bg-purple-50 text-purple-700 border-purple-200',
  'SUPER_ADMIN': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ngos'>('overview');

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Safe normalization fallback logic to handle both array and object formats cleanly
  const requestStatusArray = Array.isArray(stats.requests?.byStatus)
    ? stats.requests.byStatus
    : stats.requests?.byStatus
    ? Object.entries(stats.requests.byStatus).map(([status, count]) => ({ status, count: count as number }))
    : [];

  const userRolesArray = Array.isArray(stats.users?.byRole)
    ? stats.users.byRole
    : stats.users?.byRole
    ? Object.entries(stats.users.byRole).map(([role, count]) => ({ role, count: count as number }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Block */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Platform overview metrics and operational system data management</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.users?.total ?? 0}</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered NGOs</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.ngos?.total ?? 0}</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">System Requests</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.requests?.total ?? 0}</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Volunteers</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.volunteers?.total ?? 0}</p>
          </div>
        </div>

        {/* Dynamic View Segment Control Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-1.5 border-b border-slate-200 pb-px mb-6">
          {(['overview', 'users', 'ngos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-4 py-2.5 border-b-2 transition-all capitalize whitespace-nowrap -mb-px ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Conditional Sections */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests Status Breakdown Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b border-slate-100 pb-3 mb-4">
                  Requests Breakdown by Status
                </h3>
                <div className="space-y-3">
                  {requestStatusArray.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No request data found</p>
                  ) : (
                    requestStatusArray.map((item) => (
                      <div key={item.status} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className={`text-2xs font-bold px-2.5 py-1 rounded-md border tracking-wide uppercase ${STATUS_COLOR_MAP[item.status.toUpperCase()] ?? 'bg-slate-100 text-slate-600'}`}>
                          {item.status}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Users Distribution Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b border-slate-100 pb-3 mb-4">
                  System Registrations by Role
                </h3>
                <div className="space-y-3">
                  {userRolesArray.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No user role data found</p>
                  ) : (
                    userRolesArray.map((item) => (
                      <div key={item.role} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className={`text-2xs font-bold px-2.5 py-1 rounded-md border tracking-wide uppercase ${ROLE_COLOR_MAP[item.role.toUpperCase()] ?? 'bg-slate-100 text-slate-600'}`}>
                          {item.role.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Lower Horizontal Matrix Metrics (Verification Statuses) */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-5">NGO Verification Status Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="pt-2 sm:pt-0 sm:pl-0 flex flex-col justify-center">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider block">Verified Entities</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.ngos?.verified ?? 0}</span>
                    <span className="text-[10px] sm:text-2xs font-semibold text-slate-400">organizations</span>
                  </div>
                </div>
                <div className="pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-center">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Pending Credentials</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.ngos?.pending ?? 0}</span>
                    <span className="text-[10px] sm:text-2xs font-semibold text-slate-400">awaiting audit</span>
                  </div>
                </div>
                <div className="pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Allocated Resources</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.resources?.total ?? 0}</span>
                    <span className="text-[10px] sm:text-2xs font-semibold text-slate-400">active assets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
            User administration database directory view pipeline component context mount target.
          </div>
        )}

        {activeTab === 'ngos' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
            NGO organization operational verification queue and validation portal component context mount target.
          </div>
        )}
      </div>
    </div>
  );
}