import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data.orders || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pending = orders.filter((o) => o.status !== 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return { totalSpent, pending, completed: totalSpent - pending };
  }, [orders]);

  const monthly = useMemo(() => {
    const map = new Map();
    const today = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, { label: d.toLocaleString('default', { month: 'short' }), amount: 0 });
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt || Date.now());
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(key)) map.get(key).amount += order.totalPrice || 0;
    });
    return [...map.values()];
  }, [orders]);

  const chartData = {
    labels: monthly.map((m) => m.label),
    datasets: [{ label: 'Spent', data: monthly.map((m) => m.amount), borderColor: '#047857', backgroundColor: 'rgba(5,150,105,0.2)', fill: true, tension: 0.4 }]
  };

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Billing Dashboard</h1>
        <p className="mt-2 text-base text-slate-500">Manage your purchases, payment history and credentials.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Total Spent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totals.totalSpent)}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(totals.completed)}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Monthly Spend Trend</h2>
          <div className="mt-4 h-72">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Payment Stats</h2>
          <p className="mt-3 text-sm text-slate-600">Total orders: <strong>{orders.length}</strong></p>
          <p className="mt-1 text-sm text-slate-600">Pending orders: <strong>{orders.filter((o) => o.status !== 'completed').length}</strong></p>
          <p className="mt-1 text-sm text-slate-600">Completed orders: <strong>{orders.filter((o) => o.status === 'completed').length}</strong></p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Transaction History</h2>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500">Loading...</div>
        ) : !orders.length ? (
          <div className="mt-4 text-sm text-slate-500">No orders found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Order #</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-3 py-2">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-3 py-2">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
