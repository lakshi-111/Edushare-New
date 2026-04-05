import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const newFieldErrors = {};

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newFieldErrors.email = 'Please enter a valid email.';
    }
    if (!form.password || form.password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      login({ user: data.user, token: data.token });
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/browse');
    } catch (err) {
      const body = err.response?.data;
      if (body?.errors) {
        setFieldErrors(Object.fromEntries(body.errors.map((e) => [e.param, e.msg])));
      }
      setError(body?.message || 'Login failed.');
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

        <p className="mt-6 text-sm text-slate-600">Don&apos;t have an account? <Link className="font-semibold text-brand-700" to="/signup">Create one</Link></p>
      </div>
    </main>
  );
}
