import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const newFieldErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newFieldErrors.name = 'Name must be at least 2 characters.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newFieldErrors.email = 'Please enter a valid email.';
    }
    if (!form.password || form.password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      });
      login(data);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/browse');
    } catch (err) {
      const body = err.response?.data;
      if (body?.errors) {
        setFieldErrors(Object.fromEntries(body.errors.map((e) => [e.param, e.msg])));
      }
      setError(body?.message || 'Registration failed.');
    }
  }

  return (
    <main className="mx-auto flex max-w-md px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
        <p className="mt-2 text-slate-600">Start uploading, purchasing, and connecting.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="text" placeholder="Full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          {fieldErrors.name && <p className="text-xs text-rose-600">{fieldErrors.name}</p>}
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          {fieldErrors.email && <p className="text-xs text-rose-600">{fieldErrors.email}</p>}
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          {fieldErrors.password && <p className="text-xs text-rose-600">{fieldErrors.password}</p>}
          <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          {fieldErrors.confirmPassword && <p className="text-xs text-rose-600">{fieldErrors.confirmPassword}</p>}
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-slate-500">Admin role signup is allowed only when enabled on server-side.</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">Sign up</button>
        </form>

        <p className="mt-6 text-sm text-slate-600">Already have an account? <Link className="font-semibold text-brand-700" to="/signin">Sign in</Link></p>
      </div>
    </main>
  );
}
