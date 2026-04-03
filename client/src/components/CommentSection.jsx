import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ resourceId, comments, onReload }) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitComment(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      await api.post('/comments', { resourceId, content });
      setContent('');
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Comments</h2>

      {isAuthenticated ? (
        <form onSubmit={submitComment} className="mb-6 space-y-3">
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-brand-500"
            placeholder="Share your thoughts about this resource..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-slate-500">Sign in to comment.</p>
      )}

      <div className="space-y-4">
        {comments.length ? comments.map((comment) => (
          <div key={comment._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{comment.userId?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                {comment.userId?.badge || 'Bronze'}
              </span>
            </div>
            <p className="text-sm text-slate-700">{comment.content}</p>
          </div>
        )) : <p className="text-sm text-slate-500">No comments yet.</p>}
      </div>
    </section>
  );
}
