import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function InquiryForm({ resourceId }) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      await api.post('/inquiries', { resourceId, ...form });
      setForm({ subject: '', message: '' });
      setMessage('Inquiry sent successfully! It will appear in your Inquiries tab.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Have a Question?</h2>
            <p className="text-sm text-slate-500 mt-2">Sign in to send an inquiry to the uploader.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
          <HelpCircle size={20} />
        </div>
        <h2 className="font-semibold text-slate-900">Have a Question?</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
          <input
            type="text"
            disabled
            value={user?.name || ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your Email</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="What is your question about?"
            value={form.subject}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="Write your question..."
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Submit Inquiry'}
        </button>
      </form>
      {message && (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}
    </section>
  );
}
