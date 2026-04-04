import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0, blockedUsers: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState('all');
  const [filterRatingBadge, setFilterRatingBadge] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    faculty: '',
    academicYear: '',
    role: 'student'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: query || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        faculty: filterFaculty !== 'all' ? filterFaculty : undefined,
        academicYear: filterAcademicYear !== 'all' ? filterAcademicYear : undefined,
        ratingBadge: filterRatingBadge !== 'all' ? filterRatingBadge : undefined
      };
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('AdminUsersPage load error', error);
    } finally {
      setLoading(false);
    }
  }, [query, filterRole, filterFaculty, filterAcademicYear, filterRatingBadge]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const facultyOptions = useMemo(
    () => ['all', ...Array.from(new Set(users.map((item) => item.faculty).filter(Boolean)))],
    [users]
  );

  const academicYearOptions = useMemo(
    () => ['all', ...Array.from(new Set(users.map((item) => item.academicYear).filter(Boolean)))],
    [users]
  );

  const ratingBadgeOptions = useMemo(
    () => ['all', ...Array.from(new Set(users.map((item) => item.ratingBadge).filter(Boolean)))],
    [users]
  );

  async function handleCreateUser(event) {
    event.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await api.post('/admin/users', form);
      setForm({ name: '', email: '', password: '', studentId: '', faculty: '', academicYear: '', role: 'student' });
      setShowForm(false);
      await loadUsers();
    } catch (error) {
      console.error('AdminUsersPage create user error', error);
      setFormError(error.response?.data?.message || 'Could not create user.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteUser(userId, userEmail) {
    if (userId === currentUser?.id) {
      return alert('You cannot delete your own admin account from this page.');
    }

    const confirmed = window.confirm(`Delete ${userEmail} permanently? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      await loadUsers();
    } catch (error) {
      console.error('AdminUsersPage delete user error', error);
      alert(error.response?.data?.message || 'Could not delete the user.');
    }
  }

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading users...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
            <p className="mt-2 text-sm text-slate-500">View, search, and manage registered accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {showForm ? 'Hide user form' : 'Add new user'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Student ID</label>
              <input
                value={form.studentId}
                onChange={(e) => setForm((current) => ({ ...current, studentId: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Faculty</label>
              <input
                value={form.faculty}
                onChange={(e) => setForm((current) => ({ ...current, faculty: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Academic year</label>
              <input
                value={form.academicYear}
                onChange={(e) => setForm((current) => ({ ...current, academicYear: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {formLoading ? 'Creating user...' : 'Create user'}
              </button>
            </div>
          </div>

          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Total Admins', value: stats.totalAdmins },
          { label: 'Blocked Users', value: stats.blockedUsers },
          { label: 'Active Users', value: stats.activeUsers }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Active Users</h3>
            <p className="text-sm text-slate-500">Search, filter, and delete accounts safely.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or student ID"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">All roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {facultyOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All faculties' : option}</option>
              ))}
            </select>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {academicYearOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All years' : option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <select
            value={filterRatingBadge}
            onChange={(e) => setFilterRatingBadge(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {ratingBadgeOptions.map((option) => (
              <option key={option} value={option}>{option === 'all' ? 'All badges' : option}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Student ID</th>
                <th className="px-3 py-2">Faculty</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Badge</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-slate-500">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-800">{user.name || 'Unknown'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2 text-slate-600">{user.studentId || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.faculty || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.academicYear || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.ratingBadge || 'Unranked'}</td>
                    <td className="px-3 py-2 text-slate-600">{user.role}</td>
                    <td className={`px-3 py-2 font-semibold ${user.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={user._id === currentUser?.id}
                        onClick={() => handleDeleteUser(user._id, user.email)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
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
