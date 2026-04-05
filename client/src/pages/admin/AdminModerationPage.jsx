import { useEffect, useState } from 'react';
import { Flag, CheckCircle, XCircle, Edit, Trash2, Mail, Ban } from 'lucide-react';
import api from '../../utils/api';

function formatReason(reason) {
  const reasons = {
    'incorrect_or_misleading_information': 'Incorrect or misleading information',
    'inappropriate_language': 'Inappropriate language',
    'spam_or_advertising': 'Spam or advertising',
    'harassment_or_personal_attack': 'Harassment or personal attack',
    'other': 'Other'
  };
  return reasons[reason] || reason;
}

export default function AdminModerationPage() {
  const [stats, setStats] = useState({ reportedComments: 0, totalAlerts: 0 });
  const [items, setItems] = useState([]);
  const [topReportedComment, setTopReportedComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadData() {
    try {
      const [statsRes, itemsRes] = await Promise.all([
        api.get('/admin/moderation/stats'),
        api.get('/admin/moderation')
      ]);
      setStats({
        reportedComments: statsRes.data.reportedComments,
        pendingInquiries: statsRes.data.pendingInquiries,
        totalAlerts: statsRes.data.totalAlerts
      });
      setItems((itemsRes.data.items || []).filter(item => item.type === 'report'));
      setTopReportedComment(itemsRes.data.topReportedComment || null);
    } catch (error) {
      console.error('Moderation load error', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(action, id, extra = {}) {
    setBusy(true);
    try {
      if (action === 'dismiss') {
        await api.put(`/admin/reports/${id}/dismiss`, extra);
      } else if (action === 'resolve') {
        await api.put(`/admin/reports/${id}/resolve`, extra);
      } else if (action === 'edit') {
        await api.put(`/admin/comments/${id}/edit`, extra);
      } else if (action === 'delete') {
        await api.delete(`/admin/comments/${id}`);
      } else if (action === 'warn') {
        await api.post(`/admin/users/${id}/warn`);
      } else if (action === 'ban') {
        await api.put(`/admin/users/${id}/ban`);
      }
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  const editModal = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  function openEditModal(item) {
    setEditingComment(item);
    setEditContent(item.commentText);
  }

  async function submitEdit() {
    if (!editContent.trim()) return;
    await handleAction('edit', editingComment.commentId, { content: editContent });
    setEditingComment(null);
    setEditContent('');
  }

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading moderation queue...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-600">Reports & Moderation</h2>
            <p className="mt-2 text-sm text-slate-500">Inspect reports from users and handle policy violations quickly.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Reported Comments</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.reportedComments}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Pending Inquiries</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{stats.pendingInquiries}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Total Alerts</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{stats.totalAlerts}</p>
        </div>
      </div>

      {topReportedComment && (
        <div className="mb-6 rounded-[22px] border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Most Reported Comment</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{topReportedComment.commentText}</p>
              <p className="mt-2 text-sm text-slate-500">Posted by {topReportedComment.commentAuthor} on {topReportedComment.resourceTitle}</p>
              <p className="mt-3 text-sm text-slate-700">This comment has {topReportedComment.reportCount} report{topReportedComment.reportCount !== 1 ? 's' : ''}.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleAction('delete', topReportedComment.commentId)}
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
              >
                Delete Most Reported
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Latest Moderation Items</h3>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No moderation items at this time.</p>
          ) : (
            items.map((item) => (
              <div key={`${item.type}-${item.id || item.commentId}`} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Flag size={16} className="text-red-500" />
                        <span className="font-semibold text-slate-800">Reported Comment</span>
                        <span className="text-xs text-slate-500">({item.reportCount} report{item.reportCount > 1 ? 's' : ''})</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">"{item.commentText}"</p>
                      <p className="text-xs text-slate-500">Posted by {item.commentAuthor} on {item.resourceTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.reports?.slice(0, 2).map((report, idx) => (
                          <span key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                            {formatReason(report.reason)}: {report.description || 'No details'}
                          </span>
                        ))}
                      </div>
                    </>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <>
                      <button
                        onClick={() => handleAction('dismiss', item.reports[0].id)}
                        disabled={busy}
                        className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Dismiss report"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        disabled={busy}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit comment"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleAction('delete', item.commentId)}
                        disabled={busy}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleAction('warn', item.commentAuthorId)}
                        disabled={busy}
                        className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title="Warn user"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => handleAction('ban', item.commentAuthorId)}
                        disabled={busy}
                        className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded"
                        title="Ban user"
                      >
                        <Ban size={16} />
                      </button>
                    </>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Comment</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 min-h-24"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditingComment(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={busy}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
