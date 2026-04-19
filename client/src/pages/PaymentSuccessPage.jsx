import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/** Shown after POST /payments/process; copy reflects pending admin verification (not instant library). */
export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const total = location.state?.total || 0;
  const payment = location.state?.payment;

  return (
    <section className="mx-auto max-w-4xl text-center">
      <div className="mt-10 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={34} />
      </div>
      <h1 className="mt-5 text-4xl font-bold text-slate-900">Payment submitted</h1>
      <p className="mt-3 text-base text-slate-600">
        Your payment of <strong>Rs {Number(total).toFixed(2)}</strong> was received and is <strong>pending admin verification</strong>. You will get a notification when your resources appear in My Library.
      </p>
      {payment?._id && (
        <p className="mt-2 text-sm text-slate-500">
          Reference: <span className="font-mono text-slate-700">{payment._id}</span>
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => navigate('/library')} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">Open My Library</button>
        <button type="button" onClick={() => navigate('/billing')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Go to Billing</button>
      </div>
    </section>
  );
}
