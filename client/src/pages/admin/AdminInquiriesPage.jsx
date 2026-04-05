import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminInquiriesPage() {
  const [data, setData] = useState({ inquiries: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: response } = await api.get('/admin/dashboard');
        setData({ inquiries: response.inquiries || [] });
      } catch (error) {
        console.error('AdminInquiriesPage load error', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return data.inquiries.filter((inq) =>
      search.trim() === ''
        ? true
        : inq.subject?.toLowerCase().includes(search.toLowerCase()) || inq.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.inquiries, search]);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading inquiries...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-600">Inquiries</h2>
            <p className="mt-2 text-sm text-slate-500">Manage inbound user questions and respond from the admin panel.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Inquiries', value: data.inquiries.length },
          { label: 'Pending', value: data.inquiries.filter((inq) => !inq.status || inq.status === 'pending').length },
          { label: 'Answered', value: data.inquiries.filter((inq) => inq.status === 'answered').length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Recent Inquiries</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or subject"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                filtered.map((inq) => (
                  <tr key={inq._id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{inq.name} ({inq.email})</td>
                    <td className="px-3 py-2">{inq.subject}</td>
                    <td className="px-3 py-2 font-semibold text-brand-600">{inq.status || 'Pending'}</td>
                    <td className="px-3 py-2">
                      <button className="rounded-lg border border-brand-300 px-3 py-1 text-xs text-brand-700">Reply</button>
                    </td>
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
