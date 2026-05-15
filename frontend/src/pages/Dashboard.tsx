import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';

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
  },
  NGO_ADMIN: {
    color: 'bg-green-100 text-green-700',
    label: 'NGO Admin',
    description: 'Manage incoming requests and assign volunteers.',
    icon: '🏢',
    actions: [
      { label: 'View Pending Requests', href: '/ngo/requests', primary: true },
      { label: 'Manage Volunteers', href: '/ngo/volunteers', primary: false },
    ],
  },
  VOLUNTEER: {
    color: 'bg-purple-100 text-purple-700',
    label: 'Volunteer',
    description: 'Find opportunities and track your assignments.',
    icon: '🤝',
    actions: [
      { label: 'Browse Opportunities', href: '/volunteer/requests', primary: true },
      { label: 'My Assignments', href: '/volunteer/assignments', primary: false },
    ],
  },
  SUPER_ADMIN: {
    color: 'bg-red-100 text-red-700',
    label: 'Super Admin',
    description: 'Manage the entire platform.',
    icon: '⚙️',
    actions: [
      { label: 'Admin Panel', href: '/admin', primary: true },
    ],
  },
} as const;

export default function Dashboard() {
  const { user } = useSelector((s: RootState) => s.auth);

  if (!user) return null;

  const config = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.CITIZEN;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Welcome Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
              {config.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.firstName}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
            {config.description}
          </p>
          <div className="flex gap-3 mt-4">
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

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Requests', value: '—', sub: 'See your dashboard' },
            { label: 'Active', value: '—', sub: 'See your dashboard' },
            { label: 'Resolved', value: '—', sub: 'See your dashboard' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Profile info card */}
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