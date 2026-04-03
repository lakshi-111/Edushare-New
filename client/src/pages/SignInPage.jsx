import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  }

  return (
    <main className="mx-auto flex max-w-md px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-slate-600">Access your EduShare account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">Sign in</button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Seed accounts</p>
          <p>Admin: admin@edushare.com / Admin123</p>
          <p>Student: nimali@example.com / Student123</p>
        </div>

        <p className="mt-6 text-sm text-slate-600">Don&apos;t have an account? <Link className="font-semibold text-brand-700" to="/signup">Create one</Link></p>
      </div>
    </main>
  );
}
