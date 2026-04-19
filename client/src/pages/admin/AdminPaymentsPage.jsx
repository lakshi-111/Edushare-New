import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, Clock, Check, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../utils/api';

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // On component mount, retrieve the flattened list of all global transactions
  // This allows the admin to view all pending/completed financial activities system-wide
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/orders/all');
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('AdminPaymentsPage load error', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Handler for mutating a transaction's state manually (e.g. from 'pending' to 'verified')
  // Automatically syncs the local UI state on successful API response to prevent needing a full reload
  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      await api.put(`/orders/${transactionId}/status`, { status: newStatus });
      setTransactions((prev) =>
        prev.map((t) => (t._id === transactionId ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  // Memoized aggregator applying the 4 toolbar filters to the raw transactions list:
  // 1. Text Search (resource name)
  // 2. Status Dropdown (Paid, Verified, Pending)
  // 3. Start Date boundary
  // 4. End Date boundary (shifted to the end of the day)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All statuses' || t.status.toLowerCase() === statusFilter.toLowerCase();
      
      const txDate = new Date(t.date);
      const matchesStart = !startDate || txDate >= new Date(startDate);
      let matchesEnd = true;
      if (endDate) {
        const endD = new Date(endDate);
        // Expand the end boundary to catch all transactions occurring at any time on the end date
        endD.setHours(23, 59, 59, 999);
        matchesEnd = txDate <= endD;
      }

      // Include row only if it safely passes all dynamic filter constraints
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [transactions, searchQuery, statusFilter, startDate, endDate]);

  // Compiles and triggers the download for a formatted PDF ledger
  // This report respects the current active filters matching the table UI 1:1
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Payment Management Report', 14, 15);
    
    // Inject the structured layout using the autoTable plugin
    autoTable(doc, {
      head: [['Date', 'Buyer', 'Seller', 'Resource', 'Amount', 'Status']],
      body: filteredTransactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.buyerName,
        t.sellerName,
        t.title,
        `Rs. ${t.amount}`,
        t.status.toUpperCase(),
      ]),
      startY: 20,
      headStyles: { fillColor: [124, 58, 237] }, // Purple branding matching the UI primary color
      alternateRowStyles: { fillColor: [248, 250, 252] }, // Light slate contrast for readability
      styles: { fontSize: 9, cellPadding: 4 }
    });
    
    doc.save('Student_Payments.pdf');
  };

  // Reset all active toolbar filters back to their defaults
  const handleClear = () => {
    setSearchQuery('');
    setStatusFilter('All statuses');
    setStartDate('');
    setEndDate('');
  };

  // Helper function to return color-coded badges based on the parsed state machine
  const getStatusPill = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700">PAID</span>;
      case 'verified':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">VERIFIED</span>;
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-wide text-orange-700">PENDING</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Payment Management</h1>
        <p className="mt-1 text-sm text-slate-500">Review and approve student payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Payments', value: transactions.length },
          { label: 'Pending', value: transactions.filter((t) => t.status === 'pending').length },
          { label: 'Verified', value: transactions.filter((t) => t.status === 'verified').length },
          { label: 'Completed', value: transactions.filter((t) => t.status === 'completed').length }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>
      <br />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4 lg:grid-cols-[1fr_180px_160px_160px]">
          <div className="relative border border-slate-200 rounded-lg pr-3 pl-3 py-2 flex items-center bg-slate-50/50 hover:border-purple-300 transition-colors">
            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by resource name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm outline-none bg-transparent placeholder-slate-400 text-slate-700"
            />
          </div>

          <div className="relative border border-slate-200 rounded-lg flex items-center bg-slate-50/50 hover:border-purple-300 transition-colors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-transparent py-2 pl-3 pr-8 text-sm outline-none text-slate-700 cursor-pointer"
            >
              <option value="All statuses">All statuses</option>
              <option value="paid">PAID</option>
              <option value="verified">VERIFIED</option>
              <option value="pending">PENDING</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden flex items-center hover:border-purple-300 transition-colors">
             <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-600 appearance-none cursor-pointer"
            />
          </div>

          <div className="relative border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden flex items-center hover:border-purple-300 transition-colors">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-600 appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading payments...</div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm text-slate-600">
              <thead className="bg-[#fcfcfd]">
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-500">
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Buyer</th>
                  <th className="px-5 py-3.5 font-medium">Resource</th>
                  <th className="px-5 py-3.5 font-medium">Amount</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t, idx) => (
                    <tr key={`${t._id}-${t.itemId}-${idx}`} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-[13px] font-medium text-slate-600">
                        {new Date(t.date).toISOString().split('T')[0]}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap border-l-[3px] border-transparent">
                        <div className="font-semibold text-slate-800 text-[13px]">{t.buyerName}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5 flex items-center">
                          <span className="mr-1">→</span> {t.sellerName}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800 text-[13px]">{t.title}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800 text-[13px]">
                         Rs. {t.amount}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusPill(t.status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {t.status === 'completed' || t.status === 'paid' ? (
                          <span className="text-[13px] text-slate-400 font-medium ml-2">Completed</span>
                        ) : (
                          <div className="flex items-center gap-2">
                             {t.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(t._id, 'verified')}
                                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-purple-700"
                                >
                                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                                  Verify
                                </button>
                             )}
                            <button
                              onClick={() => handleUpdateStatus(t._id, 'paid')}
                              className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-purple-700 shadow-sm"
                            >
                              <Check className="mr-1.5 h-3 w-3 stroke-[3px]" />
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="text-slate-400 mb-1 flex justify-center"><Search className="h-8 w-8 opacity-20" /></div>
                      <p className="text-[14px] text-slate-500 font-medium">No payments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
