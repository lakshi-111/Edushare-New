import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  Grid2x2,
  HelpCircle,
  Library,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Upload,
  Wallet
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

function isItemActive(pathname, itemPath) {
  if (itemPath === '/dashboard') return pathname === '/dashboard' || pathname === '/earnings';
  if (itemPath === '/browse') return pathname === '/browse' || pathname === '/home' || pathname.startsWith('/resource/');
  return pathname === itemPath;
}

export default function DashboardShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    async function loadUnread() {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count || 0);
      } catch (_error) {
        setUnreadCount(0);
      }
    }

    loadUnread();
  }, [isAuthenticated, location.pathname]);

  const menuItems = useMemo(() => [
    { label: 'Dashboard', path: '/dashboard', icon: Grid2x2 },
    { label: 'Upload Resource', path: '/upload', icon: Upload },
    { label: 'Browse Resources', path: '/browse', icon: BookOpen },
    { label: 'Cart', path: '/cart', icon: CreditCard },
    { label: 'My Library', path: '/library', icon: Library },
    { label: 'Billing', path: '/billing', icon: Wallet },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Inquiries', path: '/inquiries', icon: MessageSquare },
    { label: 'Settings', path: user?.role === 'admin' ? '/admin/dashboard' : '/settings', icon: Settings }
  ], [user?.role]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = search.trim();
    navigate(trimmed ? `/browse?search=${encodeURIComponent(trimmed)}` : '/browse');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[138px] border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-xs font-bold text-white">ES</div>
          <div>
            <p className="text-base font-bold text-slate-900">EduShare</p>
          </div>
        </div>

        <nav className="px-2 py-4">
          {menuItems.map((item) => {
            const active = isItemActive(location.pathname, item.path);
            const showCartBadge = item.label === 'Cart' && totalItems > 0;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${active ? 'bg-brand-500 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className="relative">
                  <item.icon size={16} />
                  {showCartBadge && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-[138px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search resources, modules, faculty..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </form>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 md:flex"
              title="Help"
            >
              <HelpCircle size={16} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              title="Billing"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/settings')}
              className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-left sm:flex"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {(user?.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Student'}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
