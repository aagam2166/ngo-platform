import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';
import toast from 'react-hot-toast' 
interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit?: string;
  description?: string;
  _count?: { allocations: number };
}

const RESOURCE_TYPES = [
  'FOOD', 'MEDICAL', 'CLOTHING', 'SHELTER', 'EDUCATION', 'FINANCIAL', 'OTHER',
];

const TYPE_COLORS: Record<string, string> = {
  FOOD:      'bg-orange-100 text-orange-700',
  MEDICAL:   'bg-red-100 text-red-700',
  CLOTHING:  'bg-purple-100 text-purple-700',
  SHELTER:   'bg-blue-100 text-blue-700',
  EDUCATION: 'bg-yellow-100 text-yellow-700',
  FINANCIAL: 'bg-green-100 text-green-700',
  OTHER:     'bg-gray-100 text-gray-600',
};

const emptyForm = { name: '', type: '', quantity: 0, unit: '', description: '' };

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit quantity inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data.data);
    } catch {
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleAdd = async () => {
    setFormError('');
    if (!form.name.trim()) return setFormError('Name is required');
    if (!form.type) return setFormError('Type is required');
    if (form.quantity < 0) return setFormError('Quantity cannot be negative');

    setSubmitting(true);
    try {
      await api.post('/resources', {
        name: form.name.trim(),
        type: form.type,
        quantity: Number(form.quantity),
        unit: form.unit.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      await fetchResources();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveQuantity = async (id: string) => {
    if (editQty < 0) return;
    setSavingEdit(true);
    try {
      await api.patch(`/resources/${id}`, { quantity: editQty });
      setEditingId(null);
      await fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError('');
    try {
      await api.delete(`/resources/${id}`);
      setDeletingId(null);
      await fetchResources();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalItems = resources.length;
  const lowStock = resources.filter((r) => r.quantity < 10).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/ngo/dashboard" className="text-sm text-orange-500 hover:text-orange-700 font-medium">
                ← NGO Dashboard
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Resource Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track what your NGO has and allocate to requests
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shrink-0"
          >
            {showForm ? 'Cancel' : '+ Add Resource'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className={`text-3xl font-bold mt-1 ${lowStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {lowStock}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Quantity below 10</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Allocations</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {resources.reduce((sum, r) => sum + (r._count?.allocations ?? 0), 0)}
            </p>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">New Resource</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rice bags, Insulin, Blankets"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                >
                  <option value="">Select type…</option>
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, pieces, packs, litres…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Any details about this resource…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none bg-white text-gray-900"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                {formError}
              </p>
            )}
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Adding…' : 'Add Resource'}
            </button>
          </div>
        )}

        {/* Delete error */}
        {deleteError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            {deleteError}
            <button
              onClick={() => setDeleteError('')}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

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

        {/* Empty state */}
        {!loading && !error && resources.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="text-4xl">📦</span>
            <h3 className="font-semibold text-gray-900 mt-4 mb-1">No resources yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              Add your inventory — food, medicines, clothing, and more.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              Add First Resource
            </button>
          </div>
        )}

        {/* Resources table */}
        {!loading && !error && resources.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Resource</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Quantity</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Allocations</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                        r.quantity < 10 ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {editingId === r.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={0} value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-20 border border-orange-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-orange-500"
                            />
                            {r.unit && <span className="text-xs text-gray-400">{r.unit}</span>}
                            <button onClick={() => handleSaveQuantity(r.id)} disabled={savingEdit}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg disabled:opacity-50">
                              {savingEdit ? '…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(r.id); setEditQty(r.quantity); }}
                            className={`font-semibold hover:text-orange-500 transition-colors ${r.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {r.quantity}
                            {r.unit && <span className="text-xs text-gray-400 font-normal ml-1">{r.unit}</span>}
                            {r.quantity < 10 && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Low</span>}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-medium ${(r._count?.allocations ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {r._count?.allocations ?? 0} request{(r._count?.allocations ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {deletingId === r.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                            <button onClick={() => handleDelete(r.id)}
                              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg">Yes</button>
                            <button onClick={() => { setDeletingId(null); setDeleteError(''); }}
                              className="text-xs text-gray-400 hover:text-gray-600">No</button>
                          </div>
                        ) : (
                          <button onClick={() => { setDeletingId(r.id); setDeleteError(''); }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {resources.map((r) => (
                <div key={r.id} className={`bg-white rounded-xl border shadow-sm p-4 ${
                  r.quantity < 10 ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600'
                    }`}>{r.type}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Quantity</p>
                      <p className={`font-bold ${r.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {r.quantity}{r.unit ? ` ${r.unit}` : ''}
                        {r.quantity < 10 && <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Low</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Allocations</p>
                      <p className={`font-bold ${(r._count?.allocations ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {r._count?.allocations ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Edit quantity inline */}
                  {editingId === r.id ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input type="number" min={0} value={editQty}
                        onChange={(e) => setEditQty(Number(e.target.value))}
                        className="w-24 border border-orange-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-500"
                      />
                      <button onClick={() => handleSaveQuantity(r.id)} disabled={savingEdit}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                        {savingEdit ? '…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button>
                    </div>
                  ) : null}

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => { setEditingId(r.id); setEditQty(r.quantity); }}
                      className="flex-1 text-xs font-semibold text-orange-600 border border-orange-200 bg-orange-50 py-2 rounded-lg hover:bg-orange-100 transition-colors">
                      Edit Qty
                    </button>
                    {deletingId === r.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleDelete(r.id)}
                          className="text-xs bg-red-500 text-white px-3 py-2 rounded-lg font-semibold">Yes, Delete</button>
                        <button onClick={() => { setDeletingId(null); setDeleteError(''); }}
                          className="text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg">No</button>
                      </div>
                    ) : (
                      <button onClick={() => { setDeletingId(r.id); setDeleteError(''); }}
                        className="flex-1 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 py-2 rounded-lg hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}