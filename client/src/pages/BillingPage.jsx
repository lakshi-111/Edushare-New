import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { DollarSign, TrendingUp, Clock, Search, ArrowDownToLine } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = useMemo(() => {
    const totalEarnings = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pendingBalance = orders.filter((o) => o.status !== 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const availableBalance = totalEarnings - pendingBalance;
    return { totalEarnings, pendingBalance, availableBalance };
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search filter
      const title = order.items?.[0]?.resourceId?.title || order.title || `Resource #${order._id.slice(-8).toUpperCase()}`;
      if (searchTerm && !title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // 2. Status filter
      if (statusFilter !== 'All statuses') {
        let derivedStatus = 'pending';
        const s = order.status?.toLowerCase();
        if (s === 'completed' || s === 'paid') derivedStatus = 'paid';
        else if (s === 'verified') derivedStatus = 'verified';

        if (statusFilter.toLowerCase() !== derivedStatus) return false;
      }

      // 3. Date range filter
      if (startDate || endDate) {
        const orderDate = new Date(order.createdAt);
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1); // include the entire end date day
          if (orderDate >= end) return false;
        }
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, startDate, endDate]);

  const chartData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: 'Earnings',
        data: monthly.map((m) => m.amount),
        backgroundColor: '#6b21a8',
        hoverBackgroundColor: '#581c87',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { padding: 12, backgroundColor: '#1e293b', titleFont: { size: 13 }, bodyFont: { size: 14 } }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f8fafc', drawTicks: false },
        ticks: { color: '#64748b', font: { size: 11 }, padding: 8, callback: (value) => 'Rs. ' + value }
      },
      x: {
        border: { display: false },
        grid: { display: false, drawTicks: false },
        ticks: { color: '#64748b', font: { size: 11 }, padding: 8 }
      }
    }
  };

  const getStatusPill = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
            Paid
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-600 uppercase">
            Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-orange-600 uppercase">
            Pending
          </span>
        );
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Transaction History', 14, 22);

    // Prepare table data
    const tableColumn = ["Date", "Resource", "Amount", "Status"];
    const tableRows = [];

    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const title = order.items?.[0]?.resourceId?.title || order.title || `Resource #${order._id.slice(-8).toUpperCase()}`;
      const amount = formatCurrency(order.totalPrice);
      
      let derivedStatus = 'Pending';
      const s = order.status?.toLowerCase();
      if (s === 'completed' || s === 'paid') derivedStatus = 'Paid';
      else if (s === 'verified') derivedStatus = 'Verified';

      tableRows.push([date, title, amount, derivedStatus]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [107, 33, 168] }, // Matches purple-800
    });

    doc.save(`transaction_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <section className="mx-auto max-w-8xl p-4 sm:p-6 lg:ml-8 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Billing Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your earnings and transactions</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-900 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          <ArrowDownToLine className="h-4 w-4" />
          Withdraw Earnings
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm flex justify-between items-start transition-all hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Earnings</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{formatCurrency(totals.totalEarnings)}</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="rounded-[20px] border border-purple-100 bg-purple-50/40 p-6 shadow-sm flex justify-between items-start transition-all hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-slate-500">Available Balance</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{formatCurrency(totals.availableBalance)}</p>
            <p className="mt-1.5 text-xs font-medium text-purple-600">Ready to withdraw</p>
          </div>
          <div className="rounded-xl bg-purple-100 p-3 flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-purple-700" />
          </div>
        </div>

        <div className="rounded-[20px] border border-orange-100 bg-orange-50/40 p-6 shadow-sm flex justify-between items-start transition-all hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Balance</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{formatCurrency(totals.pendingBalance)}</p>
            <p className="mt-1.5 text-xs font-medium text-orange-600">Awaiting verification</p>
          </div>
          <div className="rounded-xl bg-orange-100 p-3 flex-shrink-0">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Monthly Earnings</h2>
        <div className="mt-6 h-[300px] w-full">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mt-8 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
            >
              Download PDF
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All statuses');
                setStartDate('');
                setEndDate('');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by resource name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium min-w-[140px] shadow-sm"
          >
            <option>All statuses</option>
            <option>Paid</option>
            <option>Verified</option>
            <option>Pending</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium shadow-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium shadow-sm"
          />
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-slate-500 text-center py-10">Loading transactions...</div>
        ) : !filteredOrders.length ? (
          <div className="mt-8 text-sm text-slate-500 text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No transactions found.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-4 pr-4 font-semibold text-slate-600">Date</th>
                  <th className="pb-4 px-4 font-semibold text-slate-600">Resource</th>
                  <th className="pb-4 px-4 font-semibold text-slate-600">Amount</th>
                  <th className="pb-4 pl-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pr-4 text-slate-500">{new Date(order.createdAt).toISOString().split('T')[0]}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {order.items?.[0]?.resourceId?.title || order.title || `Resource #${order._id.slice(-8).toUpperCase()}`}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">{formatCurrency(order.totalPrice)}</td>
                    <td className="py-4 pl-4">
                      {getStatusPill(order.status)}
                    </td>
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
