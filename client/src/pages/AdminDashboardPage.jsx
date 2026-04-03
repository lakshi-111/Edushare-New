import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/formatters';

function getApproveAction(status) {
  if (status === 'pending') return { label: 'Mark as Verified', nextStatus: 'verified', disabled: false };
  if (status === 'verified') return { label: 'Approve for Earnings', nextStatus: 'approved', disabled: false };
  if (status === 'approved') return { label: 'Mark as Paid', nextStatus: 'paid', disabled: false };
  if (status === 'rejected') return { label: 'Re-verify Resource', nextStatus: 'verified', disabled: false };
  return { label: 'Already Paid', nextStatus: 'paid', disabled: true };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, resources: [] });
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const { data: response } = await api.get('/admin/dashboard');
      setData(response);
      setNotes(Object.fromEntries((response.resources || []).map((item) => [item._id, item.verificationNotes || ''])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard().catch(() => setLoading(false));
  }, []);

  const sortedResources = useMemo(() => {
    const order = { pending: 0, verified: 1, rejected: 2, approved: 3, paid: 4 };
    return [...(data.resources || [])].sort((a, b) => (order[a.verificationStatus] ?? 99) - (order[b.verificationStatus] ?? 99));
  }, [data.resources]);

  async function updateVerification(resourceId, nextStatus) {
    if (nextStatus === 'rejected' && !String(notes[resourceId] || '').trim()) {
      window.alert('Please add verification notes before rejecting a resource.');
      return;
    }

    await api.put(`/admin/resources/${resourceId}/approve`, {
      verificationStatus: nextStatus,
      verificationNotes: notes[resourceId] || ''
    });
    await loadDashboard();
  }

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading admin verification panel...</div>;
  }

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Admin Verification Panel</h1>
        <p className="mt-2 text-base text-slate-500">Review and approve resources for earning eligibility</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          ['Pending Review', data.stats.pendingReview || 0, 'bg-amber-50 text-amber-600'],
          ['Verified', data.stats.verified || 0, 'bg-emerald-50 text-emerald-600'],
          ['Rejected', data.stats.rejected || 0, 'bg-rose-50 text-rose-600']
        ].map(([label, value, tint]) => (
          <div key={label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
              <span className="text-lg font-bold">•</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-[34px] font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {sortedResources.map((resource) => {
          const approveAction = getApproveAction(resource.verificationStatus || 'pending');
          return (
            <article key={resource._id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{resource.title}</h2>
                  <p className="mt-1 max-w-3xl text-sm text-slate-500">{resource.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{resource.faculty}</span>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-600">{resource.moduleCode || 'MODULE'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{resource.semester || 'Semester 1'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{resource.academicYear}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Price</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">{Number(resource.price || 0) === 0 ? 'Free' : `$${Number(resource.price || 0).toFixed(0)}`}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900">Quality Check Indicators</p>
                  <label className="mb-2 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked readOnly /> Content is academically accurate</label>
                  <label className="mb-2 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked readOnly /> No copyright violations detected</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked readOnly /> Metadata is complete and accurate</label>
                </div>
                <div className="pt-6 md:pt-8">
                  <label className="mb-2 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked readOnly /> Formatting is clear and professional</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked readOnly /> Appropriate for academic use</label>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-slate-900">Verification Notes <span className="text-rose-500">(Required for rejection)</span></p>
                <textarea value={notes[resource._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [resource._id]: event.target.value }))} placeholder="Add notes about quality, compliance, or reasons for rejection..." className="min-h-[84px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button type="button" disabled={approveAction.disabled} onClick={() => updateVerification(resource._id, approveAction.nextStatus)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
                  <CheckCircle2 size={14} /> {approveAction.label}
                </button>
                <button type="button" onClick={() => updateVerification(resource._id, 'rejected')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  <XCircle size={14} /> Reject
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <span>Uploaded on {formatDate(resource.createdAt)}</span>
                <span>By: {resource.uploaderId?.name || 'Unknown uploader'}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
