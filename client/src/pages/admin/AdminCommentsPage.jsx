import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setComments(data.comments || []);
      } catch (error) {
        console.error('AdminCommentsPage load error', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return comments;
    if (filter === 'flagged') return comments.filter((c) => c.flagged || c.reports?.length > 0);
    if (filter === 'unflagged') return comments.filter((c) => !c.flagged && !(c.reports?.length > 0));
    return comments;
  }, [comments, filter]);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading comments...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900">Comments & Reviews</h2>
        <p className="mt-2 text-sm text-slate-500">Track and moderate user-submitted comments and ratings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Comments', value: comments.length },
          { label: 'Flagged comments', value: filtered.filter((c) => c.flagged || c.reports?.length > 0).length },
          { label: 'Unflagged', value: filtered.filter((c) => !c.flagged && !(c.reports?.length > 0)).length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Latest Comments</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="all">All</option>
            <option value="flagged">Flagged</option>
            <option value="unflagged">Unflagged</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No comments available.</p>
          ) : (
            filtered.slice(0, 8).map((comment) => (
              <div key={comment._id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{comment.userId?.name || comment.userId?.email || 'Anonymous'}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${comment.flagged || comment.reports?.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {comment.flagged || comment.reports?.length > 0 ? 'Flagged' : 'OK'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
