import { useEffect, useMemo, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { jsPDF } from 'jspdf';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function StudentPerformancePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/resources?limit=200');
        setResources(data.resources || []);
      } catch (err) {
        console.error('StudentPerformancePage load error', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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

  const topUsers = useMemo(() => {
    const map = new Map();
    resources.forEach((resource) => {
      const user = resource.uploaderId?.name || resource.uploaderId?.email || 'Unknown';
      const prev = map.get(user) || { uploads: 0, downloads: 0 };
      map.set(user, { uploads: prev.uploads + 1, downloads: prev.downloads + Number(resource.downloads || 0) });
    });

    return [...map.entries()]
      .map(([name, metrics]) => ({ name, uploads: metrics.uploads, downloads: metrics.downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 6);
  }, [resources]);

  const heatmapData = useMemo(() => {
    const categories = categoryCounts.map(([cat]) => cat);
    const values = categoryCounts.map(([_, count]) => count);
    const max = Math.max(...values, 1);
    const matrix = [];
    const width = 6;
    for (let i = 0; i < Math.ceil(categories.length / width); i += 1) {
      matrix.push(categories.slice(i * width, i * width + width));
    }
    return { matrix, max, counts: Object.fromEntries(categoryCounts) };
  }, [categoryCounts]);

  const barData = {
    labels: categoryDownloadCounts.map(([cat]) => cat),
    datasets: [
      {
        label: 'Downloads',
        data: categoryDownloadCounts.map(([_, downloads]) => downloads),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
        barThickness: 22
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
    const totalResources = resources.length;
    const totalDownloads = resources.reduce((sum, resource) => sum + Number(resource.downloads || 0), 0);
    const topCategoryByDownloads = categoryDownloadCounts[0] || ['N/A', 0];
    const topCategoryByUploads = categoryCounts[0] || ['N/A', 0];

    return {
      generatedAt: new Date().toLocaleString(),
      totalResources,
      totalDownloads,
      topCategoryByDownloads,
      topCategoryByUploads,
      topDownloadCategories: categoryDownloadCounts.slice(0, 5),
      topUploadCategories: categoryCounts.slice(0, 5),
      topUsers: topUsers.slice(0, 5)
    };
  }, [resources, categoryDownloadCounts, categoryCounts, topUsers]);

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
    writeLine('');

    doc.setFont(undefined, 'bold');
    writeLine('Overview');
    doc.setFont(undefined, 'normal');
    writeLine(`Total Resources: ${reportData.totalResources}`);
    writeLine(`Total Downloads: ${reportData.totalDownloads}`);
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
    writeLine('Top Users by Downloads');
    doc.setFont(undefined, 'normal');
    if (reportData.topUsers.length === 0) {
      writeLine('No user data available.');
    } else {
      reportData.topUsers.forEach((user, index) => {
        writeLine(`${index + 1}. ${user.name} - Downloads: ${user.downloads}, Uploads: ${user.uploads}`);
      });
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    doc.save(`student-analytics-report-${dateStamp}.pdf`);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
            <p className="mt-2 text-sm text-slate-500">Student performance and content metrics across the platform.</p>
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

      {loading ? (
        <div className="rounded-[22px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">Loading performance data...</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Resource Popularity</h2>
            <p className="mt-1 text-sm text-slate-500">Top categories by downloads</p>
            <div className="mt-4 h-72">
              <Bar data={barData} options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#475569' }, grid: { display: false } }, y: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } } } }} />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Category Distribution</h2>
            <p className="mt-1 text-sm text-slate-500">Courses by category share</p>
            <div className="mt-6 h-72">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Top Users Leaderboard</h2>
            <p className="mt-1 text-sm text-slate-500">By downloads earned</p>
            <div className="mt-4 space-y-3">
              {topUsers.map((user, idx) => (
                <div key={user.name} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{idx + 1}. {user.name}</p>
                    <p className="text-xs text-slate-500">{user.uploads} uploads</p>
                  </div>
                  <p className="text-lg font-bold text-brand-600">{user.downloads}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Category Usage Heatmap</h2>
            <p className="mt-1 text-sm text-slate-500">More uploads = darker tile</p>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {heatmapData.matrix.flat().map((cat) => {
                const value = heatmapData.counts[cat] || 0;
                const ratio = value / heatmapData.max;
                return (
                  <div key={cat} className="rounded-lg p-2 text-center text-xs font-semibold text-slate-800" style={{ backgroundColor: `rgb(${199 - ratio * 80}, ${237 - ratio * 80}, ${211 - ratio * 80})` }}>
                    <span>{cat}</span>
                    <div className="text-xs text-slate-600">{value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {reportGenerated && (
            <div className="xl:col-span-2 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-emerald-900">Generated Analytics Report Preview</h2>
                <p className="text-xs text-emerald-700">Generated at: {reportData.generatedAt}</p>
              </div>
              <p className="mt-2 text-sm text-emerald-800">This preview shows the same report content that will be downloaded as PDF.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Total Resources</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{reportData.totalResources}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Total Downloads</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{reportData.totalDownloads}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Top By Downloads</p>
                  <p className="mt-1 text-base font-bold text-emerald-900">{reportData.topCategoryByDownloads[0]}</p>
                  <p className="text-sm text-emerald-700">{reportData.topCategoryByDownloads[1]} downloads</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Top By Uploads</p>
                  <p className="mt-1 text-base font-bold text-emerald-900">{reportData.topCategoryByUploads[0]}</p>
                  <p className="text-sm text-emerald-700">{reportData.topCategoryByUploads[1]} uploads</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-emerald-900">Top Categories By Downloads</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {reportData.topDownloadCategories.map(([category, value]) => (
                      <li key={`download-${category}`}>{category}: {value}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-emerald-900">Top Categories By Uploads</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {reportData.topUploadCategories.map(([category, value]) => (
                      <li key={`upload-${category}`}>{category}: {value}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                <h3 className="text-sm font-semibold text-emerald-900">Top Users By Downloads</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {reportData.topUsers.map((user) => (
                    <li key={`user-${user.name}`}>{user.name}: {user.downloads} downloads ({user.uploads} uploads)</li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      )}
    </section>
  );
}
