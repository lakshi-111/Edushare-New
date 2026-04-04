import { useEffect, useState } from 'react';
import { BadgeCheck, CreditCard, ShoppingBag, ShieldCheck, Mail, CheckCircle2, X } from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/formatters';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  function getNotificationStyles(type) {
    switch (type) {
      case 'payment':
        return {
          icon: CreditCard,
          tint: 'bg-sky-50 text-sky-600 border-sky-100',
        };
      case 'order':
        return {
          icon: ShoppingBag,
          tint: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        };
      case 'verification':
        return {
          icon: ShieldCheck,
          tint: 'bg-slate-50 text-slate-600 border-slate-200',
        };
      default:
        return {
          icon: Mail,
          tint: 'bg-brand-50 text-brand-600 border-brand-100',
        };
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-lg py-2 pl-3 pr-4 text-sm font-medium text-brand-600 hover:bg-brand-50 transition"
          >
            <CheckCircle2 size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-[22px] border border-slate-200 bg-white">
          <p className="text-slate-500">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-[22px] border border-red-200 bg-red-50 text-red-600">
          <p>{error}</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <Mail size={24} />
            </div>
            <p className="font-medium text-slate-900">No {filter === 'unread' ? 'unread ' : ''}notifications yet</p>
            <p className="mt-1 text-sm text-slate-500">When you perform actions, you'll see notifications here.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((notification) => {
            const { icon: Icon, tint } = getNotificationStyles(notification.type);
            return (
              <div
                key={notification._id}
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification._id);
                  setSelectedNotification(notification);
                }}
                className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
                  notification.isRead ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/50 shadow-sm'
                }`}
              >
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tint}`}>
                  <Icon size={18} />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className={`text-sm ${notification.isRead ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                    {notification.message}
                  </p>
                  <span className="mt-1 text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                </div>
                {!notification.isRead ? (
                  <div className="flex items-center justify-center pr-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-sm" title="Click to mark as read" />
                  </div>
                ) : (
                   <div className="flex items-center justify-center pr-2">
                    <CheckCircle2 size={16} className="text-slate-300" title="Read" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getNotificationStyles(selectedNotification.type).tint}`}>
                  {(() => {
                    const Icon = getNotificationStyles(selectedNotification.type).icon;
                    return <Icon size={18} />;
                  })()}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedNotification.title || (selectedNotification.type === 'verification' ? 'Resource Verified' : 'Notification')}</h3>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 mb-6">
              <p className="text-[15px] leading-relaxed text-slate-700">{selectedNotification.message}</p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-slate-400">{formatDate(selectedNotification.createdAt)}</span>
              <button onClick={() => setSelectedNotification(null)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
