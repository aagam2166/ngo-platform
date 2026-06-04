import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ngos'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/ngos'),
    ]).then(([s, u, n]) => {
      setStats(s.data.data);
      setUsers(u.data.data);
      setNgos(n.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const toggleUser = async (userId: string, isActive: boolean) => {
    const endpoint = isActive ? 'deactivate' : 'activate';
    await api.patch(`/admin/users/${userId}/${endpoint}`);
    setUsers((prev: any[]) =>
      prev.map(u => u.id === userId ? { ...u, isActive: !isActive } : u)
    );
  };

  const toggleNGO = async (ngoId: string, isVerified: boolean) => {
    const endpoint = isVerified ? 'revoke' : 'approve';
    await api.patch(`/admin/ngos/${ngoId}/${endpoint}`);
    setNgos((prev: any[]) =>
      prev.map(n => n.id === ngoId ? { ...n, isVerified: !isVerified } : n)
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">Platform overview and management</p>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.users?.total, icon: '👥' },
              { label: 'NGOs', value: stats.ngos?.total, icon: '🏢' },
              { label: 'Requests', value: stats.requests?.total, icon: '📋' },
              { label: 'Volunteers', value: stats.volunteers, icon: '🤝' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
          {(['overview', 'users', 'ngos'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 gap-6">
            {/* Requests by status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Requests by Status</h2>
              <div className="space-y-3">
                {Object.entries(stats.requests?.byStatus ?? {}).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No requests yet</p>
                ) : (
                  Object.entries(stats.requests?.byStatus ?? {}).map(([status, count]) => {
                    const colors: Record<string, string> = {
                      PENDING: 'bg-yellow-100 text-yellow-700',
                      UNDER_REVIEW: 'bg-blue-100 text-blue-700',
                      APPROVED: 'bg-green-100 text-green-700',
                      REJECTED: 'bg-red-100 text-red-700',
                      IN_PROGRESS: 'bg-purple-100 text-purple-700',
                      COMPLETED: 'bg-emerald-100 text-emerald-700',
                      CANCELLED: 'bg-gray-100 text-gray-500',
                    };
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{count as number}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Users by role */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Users by Role</h2>
              <div className="space-y-3">
                {Object.entries(stats.users?.byRole ?? {}).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
                ) : (
                  Object.entries(stats.users?.byRole ?? {}).map(([role, count]) => {
                    const colors: Record<string, string> = {
                      CITIZEN: 'bg-blue-100 text-blue-700',
                      NGO_ADMIN: 'bg-orange-100 text-orange-700',
                      VOLUNTEER: 'bg-purple-100 text-purple-700',
                      SUPER_ADMIN: 'bg-red-100 text-red-700',
                    };
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {role.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{count as number}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* NGO status summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 col-span-2">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">NGO Verification Status</h2>
              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">✅</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.ngos?.verified ?? 0}</p>
                    <p className="text-xs text-gray-500">Verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-lg">⏳</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.ngos?.pending ?? 0}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📦</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.resources ?? 0}</p>
                    <p className="text-xs text-gray-500">Resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u.id, u.isActive)}
                        className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NGOs tab */}
        {activeTab === 'ngos' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Verified</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {ngos.map(n => (
                  <tr key={n.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{n.name}</td>
                    <td className="px-4 py-3 text-gray-500">{n.user.firstName} {n.user.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{n.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {n.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleNGO(n.id, n.isVerified)}
                        className={`text-xs font-medium ${n.isVerified ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                        {n.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}