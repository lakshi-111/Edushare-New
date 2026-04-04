import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, Trash2, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../utils/api';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadResources() {
    try {
      const { data } = await api.get('/admin/resources', {
        params: { status: statusFilter === 'all' ? undefined : statusFilter, search: search || undefined, sort: sortField, order: sortOrder }
      });
      setResources(data.resources);
      updateStats(data.resources);
    } catch (error) {
      console.error('Resources load error', error);
    } finally {
      setLoading(false);
    }
  }

  function updateStats(resources) {
    const total = resources.length;
    const pending = resources.filter(r => r.verificationStatus === 'pending').length;
    const verified = resources.filter(r => r.verificationStatus === 'verified').length;
    const rejected = resources.filter(r => r.verificationStatus === 'rejected').length;
    setStats({ total, pending, verified, rejected });
  }

  useEffect(() => {
    loadResources();
  }, [statusFilter, sortField, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleApprove = async (id) => {
    setBusy(true);
    try {
      await api.put(`/admin/resources/${id}/approve`);
      await loadResources();
    } catch (error) {
      alert('Failed to approve resource');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      await api.put(`/admin/resources/${id}/reject`, { reason: rejectReason });
      setShowRejectInput(null);
      setRejectReason('');
      await loadResources();
    } catch (error) {
      alert('Failed to reject resource');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/admin/resources/${id}`);
      setShowDeleteConfirm(null);
      await loadResources();
    } catch (error) {
      alert('Failed to delete resource');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      await api.put('/admin/resources/bulk-approve', { ids: selectedIds });
      setSelectedIds([]);
      await loadResources();
    } catch (error) {
      alert('Failed to bulk approve resources');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !rejectReason.trim()) return;
    setBusy(true);
    try {
      await api.put('/admin/resources/bulk-reject', { ids: selectedIds, reason: rejectReason });
      setSelectedIds([]);
      setRejectReason('');
      setBulkAction('');
      await loadResources();
    } catch (error) {
      alert('Failed to bulk reject resources');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      await api.delete('/admin/resources/bulk-delete', { data: { ids: selectedIds } });
      setSelectedIds([]);
      await loadResources();
    } catch (error) {
      alert('Failed to bulk delete resources');
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === resources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resources.map(r => r._id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading resources...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900">Resource Management</h2>
        <p className="mt-2 text-sm text-slate-500">Review, approve/reject, and maintain uploaded course resources.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Resources', value: stats.total },
          { label: 'Pending Review', value: stats.pending },
          { label: 'Verified', value: stats.verified },
          { label: 'Rejected', value: stats.rejected }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Resource Inbox</h3>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or faculty"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
            <span className="text-sm font-medium text-blue-900">{selectedIds.length} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={busy}
              className="rounded px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              onClick={() => setBulkAction('reject')}
              disabled={busy}
              className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={busy}
              className="rounded px-3 py-1 text-sm bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Delete All
            </button>
          </div>
        )}

        {bulkAction === 'reject' && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900 mb-2">Rejection reason for {selectedIds.length} resources:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded border border-red-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleBulkReject}
                disabled={busy || !rejectReason.trim()}
                className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject All
              </button>
              <button
                onClick={() => { setBulkAction(''); setRejectReason(''); }}
                className="rounded px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === resources.length && resources.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('title')}>
                  Title {sortField === 'title' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('faculty')}>
                  Faculty {sortField === 'faculty' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('verificationStatus')}>
                  Status {sortField === 'verificationStatus' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('price')}>
                  Price {sortField === 'price' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    {statusFilter === 'pending' ? 'No pending resources at this time.' :
                     statusFilter === 'verified' ? 'No verified resources.' :
                     statusFilter === 'rejected' ? 'No rejected resources.' :
                     'No resources found.'}
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource._id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(resource._id)}
                        onChange={() => toggleSelect(resource._id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">{resource.title || 'Untitled'}</td>
                    <td className="px-3 py-2 text-slate-600">{resource.faculty || '–'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resource.verificationStatus)}`}>
                        {resource.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-900">{Number(resource.price || 0) === 0 ? 'Free' : `$${Number(resource.price).toFixed(2)}`}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {resource.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(resource._id)}
                              disabled={busy}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => setShowRejectInput(resource._id)}
                              disabled={busy}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(resource._id)}
                          disabled={busy}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showRejectInput && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900 mb-2">Rejection reason:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded border border-red-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleReject(showRejectInput)}
                disabled={busy || !rejectReason.trim()}
                className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setShowRejectInput(null); setRejectReason(''); }}
                className="rounded px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900 mb-2">Are you sure you want to delete this resource? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={busy}
                className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
