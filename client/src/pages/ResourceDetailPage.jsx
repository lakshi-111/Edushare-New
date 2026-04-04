import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, CircleDollarSign, Download, FileText, Star } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/RatingStars';
import CommentSection from '../components/CommentSection';
import InquiryForm from '../components/InquiryForm';
import { formatCurrency, formatFileSize, getFileTypeLabel } from '../utils/formatters';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratingsSummary, setRatingsSummary] = useState({ averageRating: 0, count: 0 });
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const tasks = [
        api.get(`/resources/${id}`),
        api.get(`/comments/${id}`),
        api.get(`/ratings/${id}`)
      ];

      if (isAuthenticated) {
        tasks.push(api.get(`/ratings/user/${id}`));
      }

      const [resourceRes, commentsRes, ratingsRes, userRatingRes] = await Promise.all(tasks);
      setResource(resourceRes.data.resource);
      setComments(commentsRes.data.comments || []);
      setRatingsSummary(ratingsRes.data.summary || { averageRating: 0, count: 0 });
      setUserRating(userRatingRes?.data?.rating?.rating || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the resource right now.');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveRating(nextRating) {
    await api.post('/ratings', { resourceId: id, rating: nextRating });
    await load();
  }

  async function handleAddFreeToLibrary() {
    setAddingToLibrary(true);
    try {
      await api.post('/orders/add-free', { resourceId: id });
      setError('');
      // Reload to show updated state
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add to library.');
    } finally {
      setAddingToLibrary(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading resource...</main>;
  }

  if (error && !resource) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</main>;
  }

  if (!resource) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-red-600">Resource not found.</main>;
  }

  const isFree = Number(resource.price || 0) === 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-brand-50 to-slate-100 p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">{resource.category}</span>
              <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{getFileTypeLabel(resource.fileType)}</span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">{formatFileSize(resource.fileSize)}</span>
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{resource.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{resource.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {(resource.tags || []).map((tag) => (
                <span key={tag} className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">#{tag}</span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Faculty', value: resource.faculty },
                { label: 'Academic year', value: resource.academicYear },
                { label: 'Downloads', value: resource.downloads || 0 }
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Price</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{isFree ? 'Free' : formatCurrency(resource.price)}</p>
            <p className="mt-2 text-sm text-slate-500">{isFree ? 'Click the button below to add this free resource to your library.' : 'Add this resource to your cart using the sidebar to proceed with payment.'}</p>

            <div className="mt-6 space-y-3">
              {isFree ? (
                <>
                  {isAuthenticated ? (
                    <button
                      onClick={handleAddFreeToLibrary}
                      disabled={addingToLibrary}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={18} />
                      {addingToLibrary ? 'Adding to library...' : 'Get free resource'}
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Sign in to get this free resource.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                  Use the Cart in the sidebar to add this resource and proceed to checkout.
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Uploaded by {resource.uploaderId?.name}</p>
                  <p className="text-sm text-slate-500">{resource.uploaderId?.badge || 'Bronze'} contributor</p>
                  <p className="text-sm text-slate-500">Rating tier: {resource.uploaderId?.ratingBadge || 'Unranked'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-100 p-3 text-brand-700">
                  <CircleDollarSign size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">File name</p>
                  <p className="text-sm text-slate-500">{resource.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Visibility</p>
                  <p className="text-sm text-slate-500">Public resource listing</p>
                </div>
              </div>
            </div>

            {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div>
          <CommentSection resourceId={id} comments={comments} onReload={load} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Ratings</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
                <Star size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{Number(ratingsSummary.averageRating || 0).toFixed(1)}</p>
                <p className="text-sm text-slate-500">Average from {ratingsSummary.count || 0} ratings</p>
              </div>
            </div>
            <div className="mt-4">
              <RatingStars value={ratingsSummary.averageRating || 0} />
            </div>

            {isAuthenticated ? (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
                <RatingStars value={userRating} onChange={saveRating} size={22} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Sign in to submit your rating.</p>
            )}
          </section>

          <InquiryForm resourceId={id} />
        </aside>
      </section>
    </main>
  );
}
