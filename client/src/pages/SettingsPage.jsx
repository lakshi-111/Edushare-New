import { useMemo, useState } from 'react';
import { LockKeyhole, Save, UserCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function SettingsPage() {
  const { user, login } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const stats = useMemo(() => [
    ['Account Role', user?.role || 'student'],
    ['Member Since', formatDate(user?.createdAt)],
    ['Uploads', user?.uploadCount || 0],
    ['Total Earnings', formatCurrency(user?.totalEarnings || 0)]
  ], [user]);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      login({ user: data.user, token: localStorage.getItem('token') });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the profile.');
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.put('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the password.');
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-2 text-base text-slate-500">Manage your profile and account preferences</p>
      </div>

      {(message || error) && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${error ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-lg font-bold">{(user?.name || 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={saveProfile} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserCircle2 size={18} className="text-brand-600" />
              <h2 className="text-xl font-semibold text-slate-900">Profile Information</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Full Name</p>
                <input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Avatar URL</p>
                <input value={profileForm.avatar} onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
            </div>
            <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"><Save size={14} /> Save Changes</button>
          </form>

          <form onSubmit={updatePassword} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <LockKeyhole size={18} className="text-brand-600" />
              <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Current Password</p>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">New Password</p>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
            </div>
            <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Save size={14} /> Update Password</button>
          </form>
        </div>
      </div>
    </section>
  );
}
