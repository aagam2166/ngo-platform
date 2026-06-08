import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Navbar from '../components/layout/Navbar';
import api from '../lib/api';

// ── Role config ────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  CITIZEN: {
    color: 'bg-blue-100 text-blue-700',
    label: 'Citizen',
    description: 'Submit help requests and track their progress.',
    icon: '🙋',
    actions: [
      { label: 'Submit a Request', href: '/requests/new', primary: true },
      { label: 'My Requests', href: '/requests/mine', primary: false },
    ],
    statLabels: ['Total Requests', 'Active', 'Resolved'],
  },
  NGO_ADMIN: {
    color: 'bg-green-100 text-green-700',
    label: 'NGO Admin',
    description: 'Manage incoming requests and coordinate volunteers.',
    icon: '🏢',
    actions: [
      { label: 'Request Queue', href: '/ngo/dashboard', primary: true },
      { label: 'Manage Inventory', href: '/ngo/resources', primary: false },
    ],
    statLabels: ['Accepted Requests', 'Active', 'Completed'],
  },
  VOLUNTEER: {
    color: 'bg-purple-100 text-purple-700',
    label: 'Volunteer',
    description: 'Find opportunities and track your assignments.',
    icon: '🤝',
    // Issue iii + iv — two distinct useful buttons, no duplicates
    // Links use ?tab= so the volunteer dashboard opens the right tab
    actions: [
      { label: 'My Assignments', href: '/volunteer/dashboard?tab=assignments', primary: true },
      { label: 'NGO Memberships', href: '/volunteer/dashboard?tab=memberships', primary: false },
    ],
    statLabels: ['Total Assignments', 'Active', 'Completed'],
  },
  SUPER_ADMIN: {
    color: 'bg-red-100 text-red-700',
    label: 'Super Admin',
    description: 'Oversee the entire platform.',
    icon: '⚙️',
    actions: [
      { label: 'Admin Panel', href: '/admin', primary: true },
    ],
    statLabels: ['Total Users', 'Total NGOs', 'Total Requests'],
  },
} as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useSelector((s: RootState) => s.auth);

  // Issue v — real stats instead of dashes
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Welcome banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center
                            justify-center text-2xl">
              {config.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.firstName}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                  ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
            {config.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {config.actions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={
                  action.primary
                    ? 'bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm'
                    : 'border border-gray-300 bg-white text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors'
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Issue v — Stats with real numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {config.statLabels.map((label, i) => (
            <div key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500">{label}</p>
              {statsLoading ? (
                <div className="mt-2 h-8 w-12 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statValues[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full name</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900 mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-medium text-gray-900 mt-0.5">{config.label}</p>
            </div>
            <div>
              <p className="text-gray-500">Account ID</p>
              <p className="font-medium text-gray-900 mt-0.5 text-xs font-mono">
                {user.id.slice(0, 8)}…
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}