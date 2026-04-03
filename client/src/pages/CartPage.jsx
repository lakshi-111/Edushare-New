import { ShoppingBasket, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, removeFromCart, clearCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!items.length) return;
    setBusy(true);
    setError('');

    try {
      await api.post('/orders/checkout', { items: items.map((item) => ({ resourceId: item._id })) });
      clearCart();
      navigate('/library?success=1');
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="mb-5">
          <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Your Cart</h1>
          <p className="mt-2 text-base text-slate-500">0 items selected</p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ShoppingBasket size={22} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Browse the marketplace to add resources</p>
          <Link to="/browse" className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600">Browse Marketplace</Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Your Cart</h1>
        <p className="mt-2 text-base text-slate-500">{totalItems} item{totalItems > 1 ? 's' : ''} selected</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.faculty} · {item.moduleCode || 'MODULE'} · {item.semester || 'Semester 1'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-slate-900">{Number(item.price || 0) === 0 ? 'Free' : formatCurrency(item.price)}</span>
                  <button type="button" onClick={() => removeFromCart(item._id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Checkout Summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between"><span>Items</span><span>{totalItems}</span></div>
            <div className="flex items-center justify-between"><span>Total</span><span className="text-lg font-semibold text-slate-900">{formatCurrency(totalPrice)}</span></div>
          </div>
          <button type="button" onClick={handleCheckout} disabled={busy} className="mt-6 w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{busy ? 'Processing...' : 'Checkout Now'}</button>
          <Link to="/browse" className="mt-3 block rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Continue Shopping</Link>
        </div>
      </div>
    </section>
  );
}
