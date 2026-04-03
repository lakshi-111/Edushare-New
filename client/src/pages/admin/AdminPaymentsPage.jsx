import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/orders/all');
        setOrders(data.orders || []);
      } catch (error) {
        console.error('AdminPaymentsPage load error', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const revenue = useMemo(() => orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0), [orders]);
  const pendingCount = useMemo(() => orders.filter((order) => order.status !== 'completed').length, [orders]);

  if (loading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading payments...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900">Payments & Transactions</h2>
        <p className="mt-2 text-sm text-slate-500">Track orders, revenue, and payout requests.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Total Revenue', value: `$${revenue.toFixed(2)}` },
          { label: 'Pending Orders', value: pendingCount }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Recent Transactions</h3>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order._id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-3 py-2">{order.userId?.name || order.userId?.email || 'Unknown'}</td>
                  <td className="px-3 py-2">${(order.totalPrice || 0).toFixed(2)}</td>
                  <td className={`px-3 py-2 font-semibold ${order.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.status || 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
