import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminModerationPage() {
  const [data, setData] = useState({ comments: [], inquiries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: response } = await api.get('/admin/dashboard');
        setData({ comments: response.comments || [], inquiries: response.inquiries || [] });
      } catch (error) {
        console.error('AdminModerationPage load error', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const reportedComments = useMemo(() => data.comments.filter((item) => item.flagged || item.reports?.length > 0), [data.comments]);
  const openInquiries = useMemo(() => data.inquiries.filter((item) => !item.status || item.status === 'pending'), [data.inquiries]);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading moderation queue...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900">Reports & Moderation</h2>
        <p className="mt-2 text-sm text-slate-500">Inspect reports from users and handle policy violations quickly.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Reported Comments', value: reportedComments.length },
          { label: 'Pending Inquiries', value: openInquiries.length },
          { label: 'Total Alerts', value: reportedComments.length + openInquiries.length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Latest Moderation Items</h3>
        <div className="mt-4 space-y-3">
          {reportedComments.length === 0 && openInquiries.length === 0 ? (
            <p className="text-sm text-slate-500">No moderation items at this time.</p>
          ) : (
            [...reportedComments.slice(0, 4), ...openInquiries.slice(0, 4)].map((item, idx) => (
              <div key={`${item._id}-${idx}`} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">{item.text || item.subject || 'Check item'}</p>
                <p className="text-xs text-slate-500">{item.userId?.name || item.name || 'Unknown user'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-600">{item.status || 'pending'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.reports?.length || 0} reports</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
