import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

export default function CartDropdown() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  async function checkout() {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    if (!items.length) {
      navigate('/billing');
      return;
    }

    try {
      await api.post('/orders/checkout', {
        items: items.map((item) => ({ resourceId: item._id }))
      });

      clearCart();
      navigate('/orders?success=1');
    } catch (_error) {
      navigate('/billing');
    }
  }

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <ShoppingCart size={16} />
          Cart ({totalItems})
        </summary>
        <div className="absolute right-0 z-30 mt-3 w-96 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Your cart</h3>
              <p className="mt-1 text-xs text-slate-500">Quick order preview</p>
            </div>
            <button type="button" onClick={() => navigate('/billing')} className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              Open billing center
            </button>
          </div>

          {!items.length ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No resources added yet.
            </div>
          ) : (
            <>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {items.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.category} · {item.faculty}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item._id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-brand-700">
                      {Number(item.price || 0) === 0 ? 'Free' : formatCurrency(item.price)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
                <p className="mb-3 text-sm font-semibold">Total: {formatCurrency(totalPrice)}</p>
                <button onClick={checkout} className="w-full rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </details>
    </div>
  );
}
