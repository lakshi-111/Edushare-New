import { useEffect, useMemo, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { jsPDF } from 'jspdf';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function StudentPerformancePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [resources, setResources] = useState([]);
  const [library, setLibrary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      setLoading(true);
      try {
        const [{ data: profileData }, { data: resourcesData }, { data: libraryData }, { data: ordersData }] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/resources/my/list'),
          api.get('/orders/my-library'),
          api.get('/orders/my-orders')
        ]);

        setProfile(profileData.user || null);
        setResources(resourcesData.resources || []);
        setLibrary(libraryData.library || []);
        setOrders(ordersData.orders || []);
      } catch (err) {
        console.error('StudentPerformancePage load error', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, user]);

  const isStudent = profile?.role === 'student' || user?.role === 'student';

  const categoryCounts = useMemo(() => {
    const map = new Map();
    resources.forEach((resource) => {
      const category = resource.category || 'Others';
      map.set(category, (map.get(category) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [resources]);

  const categoryDownloadCounts = useMemo(() => {
    const map = new Map();
    resources.forEach((resource) => {
      const category = resource.category || 'Others';
      const downloads = Number(resource.downloads || 0);
      map.set(category, (map.get(category) || 0) + downloads);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [resources]);

  const hasUploadCategoryData = categoryCounts.length > 0;

  const monthlyUsage = useMemo(() => {
    const months = [];
    const monthMap = new Map();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - index);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      months.push({ key, label: date.toLocaleDateString('en-US', { month: 'short' }) });
      monthMap.set(key, { uploads: 0, purchases: 0, spend: 0 });
    }

    resources.forEach((resource) => {
      const date = new Date(resource.createdAt || Date.now());
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap.has(key)) {
        monthMap.get(key).uploads += 1;
      }
    });

    orders.forEach((order) => {
      const date = new Date(order.createdAt || Date.now());
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap.has(key)) {
        monthMap.get(key).purchases += 1;
        monthMap.get(key).spend += Number(order.totalPrice || 0);
      }
    });

    return months.map(({ key, label }) => ({ label, ...monthMap.get(key) }));
  }, [resources, orders]);

  const topResources = useMemo(() => {
    const map = new Map();
    resources.forEach((resource) => {
      const category = resource.category || 'Others';
      const prev = map.get(category) || { uploads: 0, downloads: 0 };
      map.set(category, { uploads: prev.uploads + 1, downloads: prev.downloads + Number(resource.downloads || 0) });
    });

    return [...map.entries()]
      .map(([name, metrics]) => ({ name, uploads: metrics.uploads, downloads: metrics.downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 6);
  }, [resources]);

  const barData = {
    labels: categoryCounts.map(([cat]) => cat),
    datasets: [
      {
        label: 'Uploads',
        data: categoryCounts.map(([_, count]) => count),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderRadius: 8,
        barThickness: 22
      }
    ]
  };

  const lineData = {
    labels: monthlyUsage.map((item) => item.label),
    datasets: [
      {
        label: 'Uploads',
        data: monthlyUsage.map((item) => item.uploads),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.35,
        fill: true
      },
      {
        label: 'Purchases',
        data: monthlyUsage.map((item) => item.purchases),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true
      }
    ]
  };

  const pieData = {
    labels: categoryCounts.map(([cat]) => cat),
    datasets: [
      {
        data: categoryCounts.map(([_, count]) => count),
        backgroundColor: ['#059669', '#38bdf8', '#facc15', '#a78bfa', '#ef4444', '#f97316', '#0ea5e9'],
        borderWidth: 1
      }
    ]
  };

  const reportData = useMemo(() => {
    const totalUploads = resources.length;
    const totalDownloads = resources.reduce((sum, resource) => sum + Number(resource.downloads || 0), 0);
    const totalLibraryItems = library.length;
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const topCategoryByDownloads = categoryDownloadCounts[0] || ['N/A', 0];
    const topCategoryByUploads = categoryCounts[0] || ['N/A', 0];

    return {
      generatedAt: new Date().toLocaleString(),
      studentName: profile?.name || user?.name || 'Student',
      studentEmail: profile?.email || user?.email || '',
      studentIdNumber: profile?.studentIdNumber || user?.studentIdNumber || '',
      faculty: profile?.faculty || user?.faculty || '',
      year: profile?.year || user?.year || '',
      semester: profile?.semester || user?.semester || '',
      memberSince: profile?.createdAt || user?.createdAt || null,
      totalUploads,
      totalDownloads,
      totalLibraryItems,
      totalOrders,
      totalSpent,
      topCategoryByDownloads,
      topCategoryByUploads,
      topDownloadCategories: categoryDownloadCounts.slice(0, 5),
      topUploadCategories: categoryCounts.slice(0, 5),
      recentUploads: resources.slice(0, 5),
      recentLibraryItems: library.slice(0, 5),
      monthlyUsage
    };
  }, [resources, library, orders, profile, user, categoryDownloadCounts, categoryCounts, monthlyUsage]);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handleDownloadPdf = () => {
    if (!reportGenerated) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 14;

    const writeLine = (text, gap = 7) => {
      if (y + gap > pageHeight - 12) {
        doc.addPage();
        y = 14;
      }
      doc.text(text, 14, y);
      y += gap;
    };

    doc.setFontSize(16);
    writeLine('EduShare Student Analytics Report', 9);
    doc.setFontSize(11);
    writeLine(`Generated At: ${reportData.generatedAt}`);
    writeLine(`Student: ${reportData.studentName}`);
    if (reportData.studentEmail) writeLine(`Email: ${reportData.studentEmail}`);
    if (reportData.studentIdNumber) writeLine(`Student ID: ${reportData.studentIdNumber}`);
    if (reportData.faculty) writeLine(`Faculty: ${reportData.faculty}`);
    if (reportData.year) writeLine(`Year: ${reportData.year}`);
    if (reportData.semester) writeLine(`Semester: ${reportData.semester}`);
    if (reportData.memberSince) writeLine(`Member Since: ${formatDate(reportData.memberSince)}`);
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Overview');
    doc.setFont(undefined, 'normal');
    writeLine(`Total Uploads: ${reportData.totalUploads}`);
    writeLine(`Total Downloads: ${reportData.totalDownloads}`);
    writeLine(`Library Items: ${reportData.totalLibraryItems}`);
    writeLine(`Orders Completed: ${reportData.totalOrders}`);
    writeLine(`Total Spend: ${formatCurrency(reportData.totalSpent)}`);
    writeLine(`Top Category by Downloads: ${reportData.topCategoryByDownloads[0]} (${reportData.topCategoryByDownloads[1]})`);
    writeLine(`Top Category by Uploads: ${reportData.topCategoryByUploads[0]} (${reportData.topCategoryByUploads[1]})`);
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Top Categories by Downloads');
    doc.setFont(undefined, 'normal');
    if (reportData.topDownloadCategories.length === 0) {
      writeLine('No category data available.');
    } else {
      reportData.topDownloadCategories.forEach(([category, value], index) => {
        writeLine(`${index + 1}. ${category}: ${value}`);
      });
    }
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Top Categories by Uploads');
    doc.setFont(undefined, 'normal');
    if (reportData.topUploadCategories.length === 0) {
      writeLine('No category data available.');
    } else {
      reportData.topUploadCategories.forEach(([category, value], index) => {
        writeLine(`${index + 1}. ${category}: ${value}`);
      });
    }
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Recent Uploads');
    doc.setFont(undefined, 'normal');
    if (reportData.recentUploads.length === 0) {
      writeLine('No uploaded resources available.');
    } else {
      reportData.recentUploads.forEach((resource, index) => {
        writeLine(`${index + 1}. ${resource.title} - ${resource.category || 'Others'} - ${Number(resource.downloads || 0)} downloads`);
      });
    }
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Recent Library Items');
    doc.setFont(undefined, 'normal');
    if (reportData.recentLibraryItems.length === 0) {
      writeLine('No library items available.');
    } else {
      reportData.recentLibraryItems.forEach((item, index) => {
        writeLine(`${index + 1}. ${item.title} - Purchased on ${formatDate(item.purchasedAt)}`);
      });
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    doc.save(`student-report-${dateStamp}.pdf`);
  };

  if (loading || authLoading) {
    return <div className="rounded-[22px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">Loading student analytics...</div>;
  }

  if (!isStudent) {
    return (
      <section className="rounded-[22px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Student Analytics</h1>
        <p className="mt-2 text-sm text-slate-500">This report area is for student accounts only. Admin users can use the admin analytics area.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Analytics & Reports</h1>
            <p className="mt-2 text-sm text-slate-500">Personal usage, uploads, and library activity for the logged-in student.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading || resources.length === 0}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Generate Report
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!reportGenerated}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Download Report (PDF)
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Uploads', value: reportData.totalUploads },
          { label: 'Library Items', value: reportData.totalLibraryItems },
          { label: 'Orders', value: reportData.totalOrders },
          { label: 'Total Spend', value: formatCurrency(reportData.totalSpent) }
        ].map((item) => (
          <div key={item.label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">My Uploads by Category</h2>
            <p className="mt-1 text-sm text-slate-500">How your uploaded resources are distributed</p>
            <div className="mt-4 h-72">
              {hasUploadCategoryData ? (
                <Bar data={barData} options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#475569' }, grid: { display: false } }, y: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' }, beginAtZero: true, precision: 0 } } }} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No uploaded resources yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Monthly Usage Trend</h2>
            <p className="mt-1 text-sm text-slate-500">Uploads and purchases in recent months</p>
            <div className="mt-6 h-72">
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { ticks: { color: '#475569' }, grid: { display: false } }, y: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' }, beginAtZero: true, precision: 0 } } }} />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Library Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Latest items in your library</p>
            <div className="mt-4 space-y-3">
              {library.slice(0, 5).map((item, idx) => (
                <div key={`${item.resourceId}-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{idx + 1}. {item.title}</p>
                    <p className="text-xs text-slate-500">Purchased on {formatDate(item.purchasedAt)}</p>
                  </div>
                  <p className="text-xs font-semibold text-brand-600">{item.fileName ? 'Saved' : 'Open'}</p>
                </div>
              ))}
              {library.length === 0 && <p className="text-sm text-slate-500">No library items yet.</p>}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Category Distribution</h2>
            <p className="mt-1 text-sm text-slate-500">Your uploaded resources by category</p>
            <div className="mt-6 h-72">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          {reportGenerated && (
            <div className="xl:col-span-2 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-emerald-900">Generated Student Report Preview</h2>
                <p className="text-xs text-emerald-700">Generated at: {reportData.generatedAt}</p>
              </div>
              <p className="mt-2 text-sm text-emerald-800">This preview reflects your own student activity only.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Uploads</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{reportData.totalUploads}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Library Items</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{reportData.totalLibraryItems}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Orders</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{reportData.totalOrders}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Total Spend</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(reportData.totalSpent)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
                <h3 className="text-sm font-semibold text-emerald-900">Student Profile</h3>
                <p className="mt-2 text-sm text-slate-700">{reportData.studentName}</p>
                <p className="text-sm text-slate-700">{reportData.studentEmail}</p>
                <p className="text-sm text-slate-700">{reportData.studentIdNumber || 'No student ID saved'}</p>
                <p className="text-sm text-slate-700">{reportData.faculty || 'No faculty saved'} · {reportData.year || 'No year saved'} · {reportData.semester || 'No semester saved'}</p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-emerald-900">Recent Uploads</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {reportData.recentUploads.length === 0 ? <li>No uploads yet.</li> : reportData.recentUploads.map((resource) => <li key={resource._id}>{resource.title} - {resource.category || 'Others'}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-emerald-900">Recent Library Items</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {reportData.recentLibraryItems.length === 0 ? <li>No library items yet.</li> : reportData.recentLibraryItems.map((item) => <li key={item.resourceId}>{item.title} - {formatDate(item.purchasedAt)}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
                <h3 className="text-sm font-semibold text-emerald-900">Monthly Activity</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {reportData.monthlyUsage.map((item) => (
                    <li key={item.label}>{item.label}: {item.uploads} uploads, {item.purchases} purchases, {formatCurrency(item.spend)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
    </section>
  );
}
