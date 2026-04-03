import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminUsersPage() {
  const [dashboard, setDashboard] = useState({ users: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setDashboard({ users: data.users || [], stats: data.stats || {} });
      } catch (error) {
        console.error('AdminUsersPage load error', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const blockedCount = useMemo(() => dashboard.users.filter((u) => u.isBlocked).length, [dashboard.users]);
  const filteredUsers = useMemo(() => {
    return dashboard.users
      .filter((user) => (filterRole === 'all' ? true : user.role === filterRole))
      .filter((user) =>
        query.trim() === ''
          ? true
          : user.name?.toLowerCase().includes(query.toLowerCase()) || user.email?.toLowerCase().includes(query.toLowerCase())
      );
  }, [dashboard.users, filterRole, query]);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading users...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
        <p className="mt-2 text-sm text-slate-500">View, search and manage registered users in your platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: dashboard.users.length },
          { label: 'Total Admins', value: dashboard.users.filter((u) => u.role === 'admin').length },
          { label: 'Blocked Users', value: blockedCount },
          { label: 'Active Users', value: dashboard.users.filter((u) => !u.isBlocked).length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Active Users</h3>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                    No users match the filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-800">{user.name || 'Unknown User'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2 text-slate-600">{user.role}</td>
                    <td className={`px-3 py-2 font-semibold ${user.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
