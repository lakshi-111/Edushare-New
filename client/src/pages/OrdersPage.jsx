import { CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import {
  formatDate,
  formatVerificationLabel,
  getStatusBadgeClasses,
  getVerificationProgress,
  getVerificationSteps
} from '../utils/formatters';

const checklistLabels = [
  'Content quality review',
  'Academic accuracy check',
  'Earnings eligibility approved',
  'Payment processed'
];

export default function OrdersPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      try {
        const { data } = await api.get('/resources/my/list');
        setResources(data.resources || []);
      } finally {
        setLoading(false);
      }
    }

    loadResources().catch(() => setLoading(false));
  }, []);

  const stepLabels = useMemo(() => getVerificationSteps(), []);

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Payment Verification Workflow</h1>
        <p className="mt-2 text-base text-slate-500">Track the verification status of your uploaded resources</p>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Verification Pipeline</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {stepLabels.map((step, index) => (
            <div key={step} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-400 bg-brand-50 text-brand-600">
                <span className="text-sm font-semibold">{index + 1}</span>
              </div>
              <p className="mt-3 font-semibold text-slate-900">{formatVerificationLabel(step)}</p>
              <p className="text-sm text-slate-500">
                {step === 'pending' && 'Awaiting review'}
                {step === 'verified' && 'Quality check passed'}
                {step === 'approved' && 'Ready for earnings'}
                {step === 'paid' && 'Earnings distributed'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[22px] border border-slate-200 bg-white" />) : null}

        {!loading && resources.map((resource) => {
          const status = resource.verificationStatus || 'pending';
          const progress = getVerificationProgress(status);
          const stepIndex = status === 'rejected' ? -1 : Math.max(0, stepLabels.indexOf(status));

          return (
            <article key={resource._id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{resource.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{resource.faculty} · {resource.moduleCode || 'MODULE'}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(status)}`}>{formatVerificationLabel(status)}</span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {stepLabels.map((step, index) => {
                  const completed = index <= stepIndex;
                  const current = step === status;
                  return (
                    <div key={step} className="text-center">
                      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${completed ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
                        <span className="text-xs font-semibold">{index + 1}</span>
                      </div>
                      <div className={`mx-auto mt-3 h-1.5 w-full rounded-full ${completed || current ? 'bg-brand-500' : 'bg-slate-200'}`} />
                      <p className="mt-2 text-sm font-medium text-slate-700">{formatVerificationLabel(step)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[18px] bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Verification Checklist</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {checklistLabels.map((label, index) => {
                    const completed = index < Math.round(progress / 25);
                    return (
                      <div key={label} className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 size={16} className={completed ? 'text-emerald-500' : 'text-slate-300'} />
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {resource.verificationNotes && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Verification notes:</span> {resource.verificationNotes}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <span>Progress: {Math.round(progress)}%</span>
                <span>Uploaded on {formatDate(resource.createdAt)}</span>
              </div>
            </article>
          );
        })}

        {!loading && !resources.length && <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">You have not uploaded any resources yet.</div>}
      </div>
    </section>
  );
}
