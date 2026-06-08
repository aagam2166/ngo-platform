import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Navbar from '../components/layout/Navbar';
import api from '../lib/api';

// ── Role config ────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  CITIZEN: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Citizen',
    description: 'Submit help requests and track their progress.',
    iconBg: 'bg-blue-50/80 border border-blue-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    actions: [
      { label: 'Submit a Request', href: '/requests/new', primary: true },
      { label: 'My Requests', href: '/requests/mine', primary: false },
    ],
    statLabels: ['Total Requests', 'Active', 'Resolved'],
  },
  NGO_ADMIN: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'NGO Admin',
    description: 'Manage incoming requests and coordinate volunteers.',
    iconBg: 'bg-emerald-50/80 border border-emerald-100',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 text-emerald-700"
      >
        {/* Standard Heroicons Solid Heart */}
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
    actions: [
      { label: 'Request Queue', href: '/ngo/dashboard', primary: true },
      { label: 'Manage Inventory', href: '/ngo/resources', primary: false },
    ],
    statLabels: ['Accepted Requests', 'Active', 'Completed'],
  },
  VOLUNTEER: {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    label: 'Volunteer',
    description: 'Find opportunities and track your assignments.',
    iconBg: 'bg-purple-50/80 border border-purple-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b21a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.886H3.894L9.047 12.5l-1.912 5.886L12 14.772l4.865 3.614-1.912-5.886 5.153-3.614h-6.194L12 3Z" />
      </svg>
    ),
    actions: [
      { label: 'My Assignments', href: '/volunteer/dashboard?tab=assignments', primary: true },
      { label: 'NGO Memberships', href: '/volunteer/dashboard?tab=memberships', primary: false },
    ],
    statLabels: ['Total Assignments', 'Active', 'Completed'],
  },
  SUPER_ADMIN: {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Super Admin',
    description: 'Oversee the entire platform.',
    iconBg: 'bg-rose-50/80 border border-rose-100',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    actions: [
      { label: 'Admin Panel', href: '/admin', primary: true },
    ],
    statLabels: ['Total Users', 'Total NGOs', 'Total Requests'],
  },
} as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useSelector((s: RootState) => s.auth);

  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user?.role]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      if (user!.role === 'CITIZEN') {
        const res = await api.get('/requests/mine');
        const reqs: any[] = res.data.data;
        setStats({
          total: reqs.length,
          active: reqs.filter((r) =>
            ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(r.status)
          ).length,
          resolved: reqs.filter((r) => r.status === 'COMPLETED').length,
        });
      } else if (user!.role === 'NGO_ADMIN') {
        const res = await api.get('/ngo/my-requests');
        const reqs: any[] = res.data.data;
        setStats({
          total: reqs.length,
          active: reqs.filter((r) =>
            ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(r.status)
          ).length,
          resolved: reqs.filter((r) => r.status === 'COMPLETED').length,
        });
      } else if (user!.role === 'VOLUNTEER') {
        const res = await api.get('/volunteers/assignments');
        const assignments: any[] = res.data.data;
        setStats({
          total: assignments.length,
          active: assignments.filter((a) =>
            ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)
          ).length,
          resolved: assignments.filter((a) => a.status === 'COMPLETED').length,
        });
      } else if (user!.role === 'SUPER_ADMIN') {
        const res = await api.get('/admin/stats');
        const s = res.data.data;
        setStats({
          total: s.totalUsers,
          active: s.totalNGOs,
          resolved: s.totalRequests,
        });
      }
    } catch {
      // silent — keep zeros
    } finally {
      setStatsLoading(false);
    }
  };

  if (!user) return null;

  const config = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
    ?? ROLE_CONFIG.CITIZEN;

  const statValues = [stats.total, stats.active, stats.resolved];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Welcome banner */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {/* Dynamic Abstract Role Icon Workstation Box */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${config.iconBg}`}>
                {config.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user.firstName}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">|</span>
                  <span className="text-sm text-slate-500">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
            <p className="text-sm text-slate-600 font-medium">
              {config.description}
            </p>
            {/* Action buttons */}
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {config.actions.map((action) => (
                <Link
                  key={action.href}
                  to={action.href}
                  className={
                    action.primary
                      ? 'bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {config.statLabels.map((label, i) => (
            <div key={label}
              className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              {statsLoading ? (
                <div className="mt-3 h-9 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
                  {statValues[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Overhauled Profile Card Layout */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Account Profile</h2>
          </div>

          <div className="divide-y divide-slate-100 px-6 text-sm">
            <div className="grid grid-cols-3 py-3.5 items-center">
              <p className="text-slate-400 font-medium">Full Name</p>
              <p className="col-span-2 font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="grid grid-cols-3 py-3.5 items-center">
              <p className="text-slate-400 font-medium">Registered Email</p>
              <p className="col-span-2 font-medium text-slate-900">{user.email}</p>
            </div>
            <div className="grid grid-cols-3 py-3.5 items-center">
              <p className="text-slate-400 font-medium">System Role</p>
              <p className="col-span-2 font-medium text-slate-900">{config.label}</p>
            </div>
            <div className="grid grid-cols-3 py-3.5 items-center">
              <p className="text-slate-400 font-medium">Account ID</p>
              <p className="col-span-2 font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">
                {user.id}
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}