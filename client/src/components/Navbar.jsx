import { BookOpen, CreditCard, LogOut, Upload, UserCircle, Wallet } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-brand-700'}`;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-brand-800">
          <div className="rounded-2xl bg-brand-600 p-2.5 text-white shadow-soft">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-lg font-bold">EduShare</p>
            <p className="text-xs text-slate-500">Academic Resource Hub</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/home" className={linkClass}>Resources</NavLink>
          {isAuthenticated && <NavLink to="/upload" className={linkClass}>Manage resources</NavLink>}
          {isAuthenticated && <NavLink to="/earnings" className={linkClass}>Earnings</NavLink>}
          {isAuthenticated && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin/dashboard" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationDropdown />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hidden rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex md:items-center md:gap-2">
                <UserCircle size={16} />
                {user?.name?.split(' ')[0]}
              </Link>
              <Link to="/upload" className="hidden rounded-2xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 md:flex md:items-center md:gap-2">
                <Upload size={16} />
                Upload
              </Link>
              <button onClick={() => navigate('/billing')} className="hidden rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:flex lg:items-center lg:gap-2">
                <CreditCard size={16} />
                Billing
              </button>
              <button onClick={() => navigate('/earnings')} className="hidden rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 xl:flex xl:items-center xl:gap-2">
                <Wallet size={16} />
                Earnings
              </button>
              <button onClick={handleLogout} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
              <Link to="/signup" className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
