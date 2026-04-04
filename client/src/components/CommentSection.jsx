import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ resourceId, comments, onReload }) {
  const { isAuthenticated, user } = useAuth();
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
    <section>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Discussion and feedback</h2>
      <p className="text-sm text-slate-500 mb-6">Ask questions, discuss the content, and help future buyers understand the value of this file.</p>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
        {isAuthenticated ? (
          <form onSubmit={submitComment} className="mb-6 space-y-3">
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 focus:border-brand-500"
              placeholder="Share your thoughts about this resource..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-slate-500">Sign in to comment.</p>
        )}

        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-brand-600">{(comment.userId?.name || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{comment.userId?.name || 'User'}</p>
                      <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  {comment.userId?.badge && (
                    <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                      {comment.userId.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
