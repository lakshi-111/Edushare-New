import { Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const pollIntervalRef = useRef(null);

  async function loadNotifications() {
    try {
      const [{ data: list }, { data: unread }] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(list.notifications || []);
      setCount(unread.count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial load
    loadNotifications();

    // Set up polling for real-time updates every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
        <Bell size={16} />
        {count > 0 ? `Notifications (${count})` : 'Notifications'}
      </summary>
      <div className="absolute right-0 z-30 mt-3 w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Recent notifications</h3>
        </div>
        <div className="max-h-80 space-y-3 overflow-auto">
          {notifications.length ? notifications.map((item) => (
            <div key={item._id} className={`rounded-xl border p-3 ${item.isRead ? 'border-slate-100' : 'border-brand-200 bg-brand-50/50'}`}>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.message}</p>
            </div>
          )) : <p className="text-sm text-slate-500">No notifications yet.</p>}
        </div>
      </div>
    </details>
  );
}
