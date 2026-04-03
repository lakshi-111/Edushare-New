import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const total = location.state?.total || 0;
  
  return (
    <section className="mx-auto max-w-4xl text-center">
      <div className="mt-10 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={34} />
      </div>
      <h1 className="mt-5 text-4xl font-bold text-slate-900">Payment Successful</h1>
      <p className="mt-3 text-base text-slate-600">Your payment of <strong>Rs {total.toFixed(2)}</strong> has been processed and resources are now in your library.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => navigate('/library')} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">View Library</button>
        <button type="button" onClick={() => navigate('/billing')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Go to Billing</button>
      </div>
    </section>
  );
}
