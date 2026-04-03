import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function InquiryForm({ resourceId }) {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    await api.post('/inquiries', { resourceId, ...form });
    setForm({ subject: '', message: '' });
    setMessage('Inquiry sent successfully.');
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">Questions for the uploader</h2>
        <p className="text-sm text-slate-500">Sign in to send an inquiry.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Questions for the uploader</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Subject"
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        />
        <textarea
          className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Write your question"
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
        <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Send inquiry
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
    </section>
  );
}
