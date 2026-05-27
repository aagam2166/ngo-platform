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
            setUsers(u.data.data.users);
            setNgos(n.data.data);
        }).finally(() => setLoading(false));
    }, []);

    const toggleUser = async (userId: string) => {
        await api.patch(`/admin/users/${userId}/toggle`);
        const res = await api.get('/admin/users');
        setUsers(res.data.data.users);
    };

    const toggleNGO = async (ngoId: string) => {
        await api.patch(`/admin/ngos/${ngoId}/verify`);
        const res = await api.get('/admin/ngos');
        setNgos(res.data.data);
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
                            { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
                            { label: 'NGOs', value: stats.totalNGOs, icon: '🏢' },
                            { label: 'Requests', value: stats.totalRequests, icon: '📋' },
                            { label: 'Volunteers', value: stats.totalVolunteers, icon: '🤝' },
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
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                            {tab}
                        </button>
                    ))}
                </div>


                {/* Overview tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                        {/* Requests by status */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">Requests by Status</h2>
                            <div className="space-y-2">
                                {stats.requestsByStatus.map((item: any) => (
                                    <div key={item.status} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-700">{item.status}</span>
                                        <span className="text-sm font-semibold text-gray-900">{item._count.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Users by role */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">Users by Role</h2>
                            <div className="space-y-2">
                                {stats.usersByRole.map((item: any) => (
                                    <div key={item.role} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-700">{item.role}</span>
                                        <span className="text-sm font-semibold text-gray-900">{item._count.role}</span>
                                    </div>
                                ))}
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
                                            <button onClick={() => toggleUser(u.id)}
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
                                            <button onClick={() => toggleNGO(n.id)}
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
