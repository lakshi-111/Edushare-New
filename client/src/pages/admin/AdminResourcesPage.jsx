import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminResourcesPage() {
  const [data, setData] = useState({ resources: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: response } = await api.get('/admin/dashboard');
        setData({ resources: response.resources || [], stats: response.stats || {} });
      } catch (error) {
        console.error('AdminResourcesPage load error', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredResources = useMemo(() => {
    return data.resources
      .filter((resource) => (statusFilter === 'all' ? true : resource.verificationStatus === statusFilter))
      .filter((resource) =>
        search.trim() === ''
          ? true
          : resource.title?.toLowerCase().includes(search.toLowerCase()) || resource.faculty?.toLowerCase().includes(search.toLowerCase())
      );
  }, [data.resources, statusFilter, search]);

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
          { label: 'Total Resources', value: data.resources.length },
          { label: 'Pending Review', value: data.stats.pendingReview || 0 },
          { label: 'Verified', value: data.stats.verified || 0 },
          { label: 'Rejected', value: data.stats.rejected || 0 }
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

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Faculty</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                    No resources found for this filter.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr key={resource._id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-800">{resource.title || 'Untitled'}</td>
                    <td className="px-3 py-2 text-slate-600">{resource.faculty || '–'}</td>
                    <td className="px-3 py-2 text-slate-600">{resource.verificationStatus || 'pending'}</td>
                    <td className="px-3 py-2 text-slate-900">{Number(resource.price || 0) === 0 ? 'Free' : `$${Number(resource.price).toFixed(2)}`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
