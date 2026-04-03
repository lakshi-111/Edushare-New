import { useEffect, useMemo, useState } from 'react';
import { DollarSign, BadgeCheck, Clock3, TrendingUp } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';
import api from '../utils/api';
import { formatCurrency, formatDate, formatVerificationLabel, getStatusBadgeClasses } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function EarningsPage() {
  const [overview, setOverview] = useState({ stats: {}, monthlyTrend: [], statusBreakdown: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/seller-overview');
        setOverview(data);
      } finally {
        setLoading(false);
      }
    }

    loadOverview().catch(() => setLoading(false));
  }, []);

  const lineData = useMemo(() => ({
    labels: overview.monthlyTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Revenue',
        data: overview.monthlyTrend.map((item) => item.amount),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.12)',
        tension: 0.35,
        fill: false
      }
    ]
  }), [overview.monthlyTrend]);

  const barData = useMemo(() => ({
    labels: overview.statusBreakdown.map((item) => formatVerificationLabel(item.status)),
    datasets: [
      {
        label: 'Transactions',
        data: overview.statusBreakdown.map((item) => item.count),
        backgroundColor: '#7c3aed',
        borderRadius: 10
      }
    ]
  }), [overview.statusBreakdown]);

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Earnings Dashboard</h1>
        <p className="mt-2 text-base text-slate-500">Track your revenue and payment status</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { label: 'Total Earnings', value: formatCurrency(overview.stats.totalEarnings || 0), icon: DollarSign, tint: 'bg-brand-50 text-brand-600' },
          { label: 'Pending Payments', value: formatCurrency(overview.stats.pendingPayments || 0), icon: Clock3, tint: 'bg-amber-50 text-amber-600' },
          { label: 'Verified Payments', value: formatCurrency(overview.stats.verifiedPayments || 0), icon: TrendingUp, tint: 'bg-sky-50 text-sky-600' },
          { label: 'Completed Payouts', value: overview.stats.completedPayouts || 0, icon: BadgeCheck, tint: 'bg-emerald-50 text-emerald-600' }
        ].map((card) => (
          <div key={card.label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tint}`}><card.icon size={18} /></div>
            <p className="mt-5 text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-[34px] font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Revenue Flow Over Time</h2>
          <div className="mt-4 h-[280px]">
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Transaction Status Breakdown</h2>
          <div className="mt-4 h-[280px]">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Transaction History</h2>

        {loading ? (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">Loading transactions...</div>
        ) : overview.transactions.length ? (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-4">Resource</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Buyer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {overview.transactions.map((item, index) => (
                  <tr key={`${item.orderId}-${index}`}>
                    <td className="py-4 pr-4 font-medium text-slate-900">{item.title}</td>
                    <td className="py-4 pr-4">{formatCurrency(item.amount)}</td>
                    <td className="py-4 pr-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(item.status)}`}>{formatVerificationLabel(item.status)}</span></td>
                    <td className="py-4 pr-4">{formatDate(item.date)}</td>
                    <td className="py-4 pr-4">{item.buyer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">No earnings transactions yet.</div>
        )}
      </div>
    </section>
  );
}
