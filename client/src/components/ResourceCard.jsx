import { Eye, FileText, Star, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function ResourceCard({ resource }) {
  const navigate = useNavigate();
  const { addToCart, items } = useCart();

  const isFree = Number(resource.price || 0) === 0;

  const alreadyInCart = useMemo(
    () => items.some((item) => item._id === resource._id),
    [items, resource._id]
  );

  function handleAddToCart(event) {
    event.stopPropagation();
    addToCart(resource);
  }

  return (
    <article
      onClick={() => navigate(`/resource/${resource._id}`)}
      className="cursor-pointer rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="flex h-28 items-center justify-center rounded-[16px] bg-brand-50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
            <FileText size={22} />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{resource.moduleCode || 'MODULE'}</p>
        </div>
      </div>

      <div className="px-1 pb-1 pt-4">
        <h3 className="text-[18px] font-semibold leading-6 text-slate-900">{resource.title}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{resource.faculty}</span>
          {resource.moduleCode && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">{resource.moduleCode}</span>}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {Number(resource.averageRating || 0).toFixed(1)}</span>
          <span className="inline-flex items-center gap-1"><Eye size={14} /> {resource.downloads || 0}</span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className={`text-lg font-semibold ${isFree ? 'text-emerald-600' : 'text-slate-900'}`}>
            {isFree ? 'Free' : `$${Number(resource.price || 0).toFixed(0)}`}
          </p>
          {!isFree && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={alreadyInCart}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                alreadyInCart
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              <ShoppingCart size={14} />
              {alreadyInCart ? 'Added' : 'Add to cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
