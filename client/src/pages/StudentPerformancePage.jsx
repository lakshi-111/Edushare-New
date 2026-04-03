import { useEffect, useMemo, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function StudentPerformancePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Student performance and content metrics across the platform.</p>
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
                const hex = Math.round(255 - ratio * 110);
                return (
                  <div key={cat} className="rounded-lg p-2 text-center text-xs font-semibold text-slate-800" style={{ backgroundColor: `rgb(${199 - ratio * 80}, ${237 - ratio * 80}, ${211 - ratio * 80})` }}>
                    <span>{cat}</span>
                    <div className="text-xs text-slate-600">{value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
