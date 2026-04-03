import { BookOpen, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { formatDate } from '../utils/formatters';

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my-library');
        setLibrary(data.library || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your library.');
      } finally {
        setLoading(false);
      }
    }

    loadLibrary();
  }, []);

  async function openResource(resourceId, fileUrl) {
    try {
      await api.post(`/resources/${resourceId}/download`);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (_error) {
      setError('Could not open the selected resource right now.');
    }
  }

  if (!loading && !library.length) {
    return (
      <section>
        <div className="mb-5">
          <h1 className="text-[44px] font-bold tracking-tight text-slate-900">My Library</h1>
          <p className="mt-2 text-base text-slate-500">0 saved resources</p>
        </div>

        {searchParams.get('success') === '1' && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Checkout completed successfully. Your purchased items will appear here.</div>}

        <div className="rounded-[22px] border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <BookOpen size={22} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900">Your library is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Add resources from the marketplace to build your collection</p>
          <Link to="/browse" className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600">Browse Marketplace</Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">My Library</h1>
        <p className="mt-2 text-base text-slate-500">{library.length} saved resources</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[20px] border border-slate-200 bg-white" />)}</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {library.map((item, index) => (
            <div key={`${item.resourceId}-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">Purchased on {formatDate(item.purchasedAt)}</p>
                </div>
                <button type="button" onClick={() => openResource(item.resourceId, item.fileUrl)} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"><Download size={14} /> Open File</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
