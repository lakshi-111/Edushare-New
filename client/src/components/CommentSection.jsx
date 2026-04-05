import { useState } from 'react';
import { MessageCircle, Flag, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ resourceId, comments, onReload }) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [reportModal, setReportModal] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

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

  async function submitReport(event) {
    event.preventDefault();
    if (!reportReason) return;
    setReportBusy(true);
    try {
      await api.post(`/comments/${reportModal}/report`, { reason: reportReason, description: reportDescription });
      setReportModal(null);
      setReportReason('');
      setReportDescription('');
      alert('Report submitted successfully.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportBusy(false);
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
                  <div className="flex items-center gap-2">
                    {comment.userId?.badge && (
                      <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                        {comment.userId.badge}
                      </span>
                    )}
                    {isAuthenticated && user?._id !== comment.userId?._id && (
                      <button
                        onClick={() => setReportModal(comment._id)}
                        className="rounded-full p-1 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Report comment"
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>
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

      {reportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Report Comment</h3>
              <button onClick={() => setReportModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="incorrect_or_misleading_information">Incorrect or misleading information</option>
                  <option value="inappropriate_language">Inappropriate language</option>
                  <option value="spam_or_advertising">Spam or advertising</option>
                  <option value="harassment_or_personal_attack">Harassment or personal attack</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional details (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 min-h-20"
                  placeholder="Provide more context..."
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReportModal(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportBusy || !reportReason}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {reportBusy ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
