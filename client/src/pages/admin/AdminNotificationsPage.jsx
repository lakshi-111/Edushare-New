import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('AdminNotificationsPage load error', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading notifications...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-600">Notifications</h2>
            <p className="mt-2 text-sm text-slate-500">Keep track of administrative system alerts and notices.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Alerts', value: notifications.length },
          { label: 'Unread', value: notifications.filter((n) => !n.read).length },
          { label: 'Read', value: notifications.filter((n) => n.read).length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Recent Notifications</h3>
        <ul className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications found.</p>
          ) : (
            notifications.slice(0, 8).map((note) => (
              <li key={note._id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{note.text || 'System update'}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${note.read ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>
                    {note.read ? 'Read' : 'Unread'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{new Date(note.createdAt || Date.now()).toLocaleString()}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
