import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Columns,
  Users,
  FileText,
  MessageCircle,
  CreditCard,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  LogOut
} from 'lucide-react';

function isActive(pathname, itemPath) {
  return pathname.startsWith(itemPath);
}

const adminMenu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Columns },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Resource Management', path: '/admin/resources', icon: FileText },
  { label: 'Comments & Reviews', path: '/admin/comments', icon: MessageCircle },
  { label: 'Inquiries', path: '/admin/inquiries', icon: MessageCircle },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Reports / Moderation', path: '/admin/moderation', icon: ShieldCheck },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

export default function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menu = useMemo(() => adminMenu, []);

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[210px] border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <div className="h-8 w-8 rounded-xl bg-brand-600 text-center text-xs font-bold text-white">AD</div>
          <div>
            <p className="text-base font-bold text-slate-900">Admin Portal</p>
            <p className="text-xs text-slate-500">System Control</p>
          </div>
        </div>

        <nav className="px-2 py-4 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-[210px]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome Admin </h1>
            <p className="text-sm text-slate-500">Manage users, resources, comments, payments and reports</p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/signin');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
