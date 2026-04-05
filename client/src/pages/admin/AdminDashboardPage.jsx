import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, ShoppingCart, AlertCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, activeStudents: 0, totalResources: 0, totalDownloads: 0, changes: {} });
  const [revenue, setRevenue] = useState({ data: [], monthly: 0, weekly: 0, daily: 0 });
  const [revenueFilter, setRevenueFilter] = useState('month');
  const [modStats, setModStats] = useState({ reportedComments: 0, pendingInquiries: 0, totalAlerts: 0 });
  const [activity, setActivity] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ resources: 0, orders: 0, withdrawals: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef(null);

  async function loadDashboard() {
    try {
      const [statsRes, revRes, modRes, actRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/revenue?period=${revenueFilter}`),
        api.get('/admin/moderation/stats'),
        api.get('/admin/activity')
      ]);

      setStats(statsRes.data);
      
      // Format revenue data for charts (add name field for Recharts)
      const formattedRevenue = (revRes.data.data || []).map(item => ({
        name: item.period,
        revenue: item.revenue
      }));
      
      setRevenue({
        data: formattedRevenue,
        monthly: revRes.data.summary?.monthlyRevenue || 0,
        weekly: revRes.data.summary?.weeklyRevenue || 0,
        daily: revRes.data.summary?.todayRevenue || 0
      });
      setModStats(modRes.data);

      // Parse activity feed
      if (actRes.data?.activities) {
        setActivity(actRes.data.activities);
      }

      // Calculate pending counts - get from resources endpoint
      try {
        const resourcesRes = await api.get('/admin/resources?status=pending');
        const pendingCount = resourcesRes.data?.length || 0;
        setPendingCounts({
          resources: pendingCount,
          orders: 0, // Would come from separate endpoint
          withdrawals: 0, // Would come from separate endpoint
          reports: modRes.data.reportedComments || 0
        });
      } catch (e) {
        console.warn('Could not load pending resources count', e);
        setPendingCounts({
          resources: 0,
          orders: 0,
          withdrawals: 0,
          reports: modRes.data.reportedComments || 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Dashboard load error', error);
      setLoading(false);
    }
  }

  // Auto-poll activity feed every 30 seconds
  useEffect(() => {
    loadDashboard();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/admin/activity');
        if (data?.activities) {
          setActivity(data.activities);
        }
      } catch (error) {
        console.error('Activity poll error', error);
      }
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Reload revenue data when filter changes
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/admin/revenue?period=${revenueFilter}`);
        const formattedRevenue = (data.data || []).map(item => ({
          name: item.period,
          revenue: item.revenue
        }));
        setRevenue({
          data: formattedRevenue,
          monthly: data.summary?.monthlyRevenue || 0,
          weekly: data.summary?.weeklyRevenue || 0,
          daily: data.summary?.todayRevenue || 0
        });
      } catch (error) {
        console.error('Revenue load error', error);
      }
    })();
  }, [revenueFilter]);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-600">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Overview of platform activity, revenue, and pending actions.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, change: stats.changes?.totalUsers },
          { label: 'Active Students', value: stats.activeStudents, change: stats.changes?.activeStudents },
          { label: 'Resources Uploaded', value: stats.totalResources, change: stats.changes?.totalResources },
          { label: 'Total Downloads', value: stats.totalDownloads, change: stats.changes?.totalDownloads }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
            {item.change && <p className="mt-1 text-xs text-emerald-600">{item.change} YoY</p>}
          </div>
        ))}
      </div>

      {/* Revenue Overview */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Revenue Overview</h3>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setRevenueFilter(period)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  revenueFilter === period
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>

        {revenue.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="revenue" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Monthly Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs {revenue.monthly.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">This Week</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs {revenue.weekly.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Today</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs {revenue.daily.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Pending Approvals</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Resources', value: pendingCounts.resources, icon: FileText, color: 'text-blue-600', action: () => navigate('/admin/resources') },
            { label: 'Orders', value: pendingCounts.orders, icon: ShoppingCart, color: 'text-green-600', action: () => navigate('/admin/orders') },
            { label: 'Withdrawals', value: pendingCounts.withdrawals, icon: TrendingUp, color: 'text-purple-600', action: () => navigate('/admin/payments') },
            { label: 'Reports', value: pendingCounts.reports, icon: AlertCircle, color: 'text-red-600', action: () => navigate('/admin/moderation') }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                  </div>
                  <Icon className={`${item.color} w-10 h-10 opacity-20`} />
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => navigate('/admin/moderation')}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Review All
        </button>
      </div>

      {/* Moderation Summary */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Moderation</h3>
            <p className="text-sm text-slate-500">Content oversight</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span className="text-slate-700">Reported Comments</span>
            <span className="text-2xl font-bold text-red-600">{modStats.reportedComments || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="text-slate-700">Pending Inquiries</span>
            <span className="text-2xl font-bold text-blue-600">{modStats.pendingInquiries || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
            <span className="text-slate-700">Total Alerts</span>
            <span className="text-2xl font-bold text-yellow-600">{modStats.totalAlerts || 0}</span>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/admin/resources')}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Review Resources
        </button>
      </div>

      {/* Recent Activity */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Activity size={20} />
            Recent Activity
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              Live
            </span>
          </h3>
        </div>

        <div className="space-y-3">
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            activity.slice(0, 10).map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.type === 'inquiry_pending' && item.data?.inquiryId) {
                    navigate(`/admin/inquiries?id=${item.data.inquiryId}`);
                  } else if (item.type === 'resource_uploaded' && item.data?.resourceId) {
                    navigate(`/admin/resources?id=${item.data.resourceId}`);
                  }
                }}
                className="w-full text-left rounded-lg border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
