import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit?: string;
}

interface Allocation {
  id: string;
  quantity: number;
  notes?: string;
  allocatedAt: string;
  resource: { name: string; type: string; unit?: string };
}

interface Props {
  requestId: string;
  requestTitle: string;
  onClose: () => void;
}

export default function AllocateResourceModal({ requestId, requestTitle, onClose }: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [resRes, allocRes] = await Promise.all([
        api.get('/resources'),
        api.get(`/resources/request/${requestId}/allocations`),
      ]);
      setResources(resRes.data.data);
      setAllocations(allocRes.data.data);
    } catch {
      setError('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedResource = resources.find((r) => r.id === selectedResourceId);

  const handleAllocate = async () => {
    if (!selectedResourceId || quantity <= 0) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/resources/${selectedResourceId}/allocate`, {
        requestId,
        quantity,
        notes: notes.trim() || undefined,
      });
      setSelectedResourceId('');
      setQuantity(1);
      setNotes('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to allocate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeallocate = async (allocationId: string) => {
    try {
      await api.delete(`/resources/allocations/${allocationId}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove allocation');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Allocate Resources</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{requestTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-medium"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Already allocated */}
            {allocations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Already Allocated</h3>
                <div className="space-y-2">
                  {allocations.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {a.quantity} {a.resource.unit ?? ''} of {a.resource.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {a.resource.type} · {formatDate(a.allocatedAt)}
                          {a.notes && ` · ${a.notes}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeallocate(a.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium ml-4 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allocate new */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Allocation</h3>

              {resources.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No resources in inventory.{' '}
                  <a href="/ngo/resources" className="text-orange-500 hover:text-orange-700">
                    Add resources first
                  </a>
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Resource
                    </label>
                    <select
                      value={selectedResourceId}
                      onChange={(e) => {
                        setSelectedResourceId(e.target.value);
                        setQuantity(1);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
                    >
                      <option value="">Choose resource…</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id} disabled={r.quantity === 0}>
                          {r.name} — {r.quantity} {r.unit ?? 'units'} available
                          {r.quantity === 0 ? ' (out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedResource && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity{selectedResource.unit && ` (${selectedResource.unit})`}
                          <span className="text-gray-400 font-normal ml-1">
                            — max {selectedResource.quantity}
                          </span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={selectedResource.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Notes <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. For family of 4"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleAllocate}
                    disabled={!selectedResourceId || quantity <= 0 || submitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {submitting ? 'Allocating…' : 'Allocate to Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}