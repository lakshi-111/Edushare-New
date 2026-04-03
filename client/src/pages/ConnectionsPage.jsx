import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  async function load() {
    const [usersRes, connectionsRes] = await Promise.all([
      api.get('/connections/discover-users'),
      api.get('/connections')
    ]);
    setUsers(usersRes.data.users || []);
    setConnections(connectionsRes.data.connections || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function sendRequest(recipientId) {
    await api.post('/connections', { recipientId, type: 'COLLABORATION' });
    setStatusMessage('Connection request sent.');
    load();
  }

  async function respond(connectionId, status) {
    await api.put(`/connections/${connectionId}/status`, { status });
    setStatusMessage(`Connection ${status.toLowerCase()}.`);
    load();
  }

  const pendingForMe = connections.filter((item) => item.status === 'PENDING' && item.recipientId?._id === user?.id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Connections</h1>
        <p className="mt-2 text-slate-600">Discover users and send collaboration requests backed by the API.</p>
        {statusMessage && <p className="mt-4 text-sm text-emerald-600">{statusMessage}</p>}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Discover users</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <button onClick={() => sendRequest(user._id)} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Pending requests</h2>
          <div className="space-y-3">
            {pendingForMe.length ? pendingForMe.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">
                  {item.requesterId?.name} → {item.recipientId?.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.type}</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => respond(item._id, 'ACCEPTED')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Accept
                  </button>
                  <button onClick={() => respond(item._id, 'REJECTED')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Reject
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No pending requests.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
