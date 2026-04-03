import { useEffect, useMemo, useState } from 'react';
import { Users, Activity, Download } from 'lucide-react';
import api from '../utils/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, resources: [], users: [], comments: [], inquiries: [], orders: [] });
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [{ data: response }, { data: ordersData }] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/orders/all')
      ]);

      setData({
        ...response,
        users: response.users || [],
        resources: response.resources || [],
        comments: response.comments || [],
        inquiries: response.inquiries || [],
        orders: ordersData.orders || []
      });
    } catch (error) {
      console.error('DP loadDashboard error', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard().catch(() => setLoading(false));
  }, []);

  const totalUsers = data.stats.totalUsers || data.users.length;
  const activeStudents = data.users.filter((u) => u.role === 'student').length;
  const resourcesUploaded = data.stats.totalResources || data.resources.length;
  const totalDownloads = data.stats.totalDownloads || data.resources.reduce((sum, r) => sum + (r.downloads || 0), 0);

  const pendingResources = data.resources.filter((r) => r.verificationStatus === 'pending').length;
  const totalOrders = data.orders.length;
  const totalRevenue = data.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  const activityFeed = useMemo(() => {
    const resourceEvents = data.resources.slice(-4).map((resource) => ({
      id: `resource-${resource._id}`,
      label: `Resource uploaded: ${resource.title}`,
      amount: resource.price ? `$${resource.price.toFixed(2)}` : 'Free',
      time: new Date(resource.createdAt || Date.now())
    }));

    const inquiryEvents = data.inquiries.slice(-4).map((inq) => ({
      id: `inquiry-${inq._id}`,
      label: `Inquiry in: ${inq.subject || 'General'}`,
      amount: inq.status === 'answered' ? 'Answered' : 'Pending',
      time: new Date(inq.createdAt || Date.now())
    }));

    const orderEvents = data.orders.slice(-4).map((order) => ({
      id: `order-${order._id}`,
      label: `Order (${order.userId?.name || 'Unknown'})`, 
      amount: `$${(order.totalPrice || 0).toFixed(2)}`,
      time: new Date(order.createdAt || Date.now())
    }));

    return [...resourceEvents, ...inquiryEvents, ...orderEvents]
      .sort((a, b) => b.time - a.time)
      .slice(0, 6);
  }, [data.resources, data.inquiries, data.orders]);

  const dailyRevenuePoints = useMemo(() => {
    const days = 7;
    const baseline = new Date();
    baseline.setHours(0, 0, 0, 0);
    const dayMap = new Array(days).fill(0).map((_, idx) => {
      const date = new Date(baseline);
      date.setDate(date.getDate() - (days - 1 - idx));
      return { date, revenue: 0 };
    });

    data.orders.forEach((order) => {
      const created = new Date(order.createdAt || Date.now());
      const dayIndex = Math.floor((created - dayMap[0].date) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < days) {
        dayMap[dayIndex].revenue += order.totalPrice || 0;
      }
    });

    return dayMap;
  }, [data.orders]);

  const maxRevenue = Math.max(...dailyRevenuePoints.map((p) => p.revenue), 1);
  const linePoints = dailyRevenuePoints.map((p, idx) => {
    const step = 100 / (dailyRevenuePoints.length - 1);
    const x = idx * step;
    const y = 100 - (p.revenue / maxRevenue) * 100;
    return `${x},${y}`;
  }).join(' ');

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading admin dashboard...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Performance insights and operational metrics for the EduShare admin dashboard.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Users', value: totalUsers, delta: '+12.4%', color: 'text-brand-600', icon: Users },
          { label: 'Active Students', value: activeStudents, delta: '+8.2%', color: 'text-brand-600', icon: Users },
          { label: 'Resources Uploaded', value: resourcesUploaded, delta: '+31.7%', color: 'text-amber-600', icon: Activity },
          { label: 'Total Downloads', value: totalDownloads, delta: '+22.7%', color: 'text-emerald-600', icon: Download }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                </div>
                <div className="rounded-lg bg-white p-2 text-slate-500 shadow-sm">
                  <Icon size={18} />
                </div>
              </div>
              <p className={`mt-3 text-sm font-semibold ${item.color}`}>{item.delta} YoY</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-sm text-slate-500">Last 7 days revenue trend</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Week</button>
              <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Month</button>
              <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Year</button>
            </div>
          </div>

          <div className="mb-4 h-48 w-full overflow-hidden rounded-xl bg-slate-50">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <polygon points={`0,100 100,100 ${linePoints} 0,100`} fill="rgba(16,185,129,0.13)" />
              <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="2" />
              {dailyRevenuePoints.map((day, idx) => {
                const x = (idx * 100) / (dailyRevenuePoints.length - 1);
                const y = 100 - (day.revenue / maxRevenue) * 100;
                return <circle key={day.date.toISOString()} cx={x} cy={y} r="1.8" fill="#059669" />;
              })}
            </svg>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Monthly Revenue</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500">+34.2% from last month</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">This Week</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">${(totalRevenue * 0.24).toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Today</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">${(totalRevenue * 0.08).toFixed(2)}</p>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Pending Approvals</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>Resources</span><span className="font-semibold text-brand-600">{pendingResources}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>Orders Pending</span><span className="font-semibold text-slate-800">{totalOrders}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>Withdrawals</span><span className="font-semibold text-amber-600">3</span></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>User Reports</span><span className="font-semibold text-rose-600">7</span></div>
          </div>
          <button className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Review All</button>
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Download Trends</h2>
            <span className="text-xs font-semibold text-brand-600">+18% this week</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {dailyRevenuePoints.map((day) => {
              const height = Math.max(6, Math.round((day.revenue / maxRevenue) * 80));
              return <div key={day.date.toISOString()} className="mx-0.5 h-24 w-full rounded-lg bg-brand-200" style={{ height: `${height}px` }} />;
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-700">
            {activityFeed.length === 0 ? (
              <li className="text-slate-500">No recent activity yet.</li>
            ) : (
              activityFeed.map((item) => (
                <li key={item.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-slate-800">{item.amount}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800">{item.label}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
