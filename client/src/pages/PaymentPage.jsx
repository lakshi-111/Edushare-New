import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { CreditCard, Shield, Wallet } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { z } from 'zod';

const paymentSchema = z.object({
  cardNumber: z.string()
    .transform((val) => val.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{16}$/, 'Must be 16 digits')),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY').refine((val) => {
    const [month, year] = val.split('/');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100;
    
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    if (expYear > currentYear) return true;
    if (expYear === currentYear && expMonth >= currentMonth) return true;
    return false;
  }, 'Must be in the future'),
  cvv: z.string().regex(/^\d{3}$/, 'Must be 3 digits')
});

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = location.state?.items || [];
  const [method, setMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const total = useMemo(() => items.reduce((acc, item) => acc + (Number(item.price) || 0), 0), [items]);

  if (!items.length) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="mb-5">
          <h1 className="text-4xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">No items in cart to process payment.</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Please add resources to your cart before proceeding to payment.</p>
        </div>
      </section>
    );
  }

  const validateField = (field, value) => {
    if (!value) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
      return;
    }
    const result = paymentSchema.pick({ [field]: true }).safeParse({ [field]: value });
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.flatten().fieldErrors[field]?.[0]
    }));
  };

  const handleCardNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formatted);
    validateField('cardNumber', formatted);
  };

  const handleExpiryChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setExpiry(formatted);
    validateField('expiry', formatted);
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCvv(val);
    validateField('cvv', val);
  };

  async function handlePay() {
    setBusy(true);
    setError('');
    setFieldErrors({});

    if (method === 'credit-card') {
      const result = paymentSchema.safeParse({ cardNumber, expiry, cvv });
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setFieldErrors({
          cardNumber: errors.cardNumber?.[0],
          expiry: errors.expiry?.[0],
          cvv: errors.cvv?.[0]
        });
        setBusy(false);
        return;
      }
    }

    try {
      const response = await api.post('/payments/process', {
        items: items.map((item) => ({ resourceId: item._id })),
        paymentMethod: method,
        card: method === 'credit-card' ? { number: cardNumber.replace(/\s+/g, ''), expiry: expiry.trim(), cvv: cvv.trim() } : undefined
      });

      navigate('/payment/success', { state: { total: total, order: response.data.order } });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-4xl font-bold text-slate-900">Payment</h1>
        <p className="mt-2 text-sm text-slate-500">Complete your purchase and unlock resources instantly.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span>{item.title}</span>
                <span className="font-semibold text-slate-900">{Number(item.price || 0) === 0 ? 'Free' : formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Payment Method</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setMethod('credit-card')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${method === 'credit-card' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}>
                <CreditCard size={14} className="mr-2 inline" />Credit Card
              </button>
              <button type="button" onClick={() => setMethod('paypal')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${method === 'paypal' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}>
                <Wallet size={14} className="mr-2 inline" />PayPal
              </button>
            </div>
          </div>

          {method === 'credit-card' && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-600">
                  Card Number
                  <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="1234 5678 9012 3456" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${fieldErrors.cardNumber ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-brand-500'}`} />
                  {fieldErrors.cardNumber && <p className="text-xs text-rose-500">{fieldErrors.cardNumber}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Expiry Date
                  <input type="text" value={expiry} onChange={handleExpiryChange} placeholder="MM/YY" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${fieldErrors.expiry ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-brand-500'}`} />
                  {fieldErrors.expiry && <p className="text-xs text-rose-500">{fieldErrors.expiry}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-600 sm:col-span-2">
                  CVV
                  <input type="password" value={cvv} onChange={handleCvvChange} placeholder="***" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${fieldErrors.cvv ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-brand-500'}`} />
                  {fieldErrors.cvv && <p className="text-xs text-rose-500">{fieldErrors.cvv}</p>}
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-500"><Shield size={14} className="inline-block mr-1" />Secure encrypted payment</p>
            </div>
          )}

          <button type="button" onClick={handlePay} disabled={busy} className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {busy ? 'Processing payment...' : `Pay ${formatCurrency(total)}`}
          </button>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Helpful information</h2>
          <p className="mt-2 text-sm text-slate-500">Your purchase will be added to library instantly after payment succeeds. You can then download resources in My Library.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Transactions are processed securely</li>
            <li>• Payment receipt is stored in transaction history</li>
            <li>• You will receive a notification once payment completes</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
