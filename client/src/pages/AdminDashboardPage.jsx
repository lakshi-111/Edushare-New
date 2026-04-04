import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  AlertTriangle,
  MessageSquare,
  Star,
  Award,
  BarChart3,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import api from '../utils/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    totalResources: 0,
    totalDownloads: 0,
    changes: {
      totalUsers: '+0%',
      activeStudents: '+0%',
      totalResources: '+0%',
      totalDownloads: '+0%'
    },
    ratingStats: {
      counts: {},
      leaderboard: []
    }
  });
  const [revenueData, setRevenueData] = useState({ data: [], summary: {} });
  const [revenuePeriod, setRevenuePeriod] = useState('week');
  const [activityFeed, setActivityFeed] = useState([]);
  const [moderationStats, setModerationStats] = useState({ reportedComments: 0, pendingInquiries: 0, totalAlerts: 0 });
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Stats load error', error);
    }
  }

  async function loadRevenue() {
    try {
      const { data } = await api.get(`/admin/revenue?period=${revenuePeriod}`);
      setRevenueData(data);
    } catch (error) {
      console.error('Revenue load error', error);
    }
  }

  async function loadActivity() {
    try {
      const { data } = await api.get('/admin/activity?limit=10');
      setActivityFeed(data.activities);
    } catch (error) {
      console.error('Activity load error', error);
    }
  }

  async function loadModerationStats() {
    try {
      const { data } = await api.get('/admin/moderation/stats');
      setModerationStats(data);
    } catch (error) {
      console.error('Moderation stats load error', error);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRevenue(),
        loadActivity(),
        loadModerationStats()
      ]);
    } catch (error) {
      console.error('Dashboard load error', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    // Set up polling
    const statsInterval = setInterval(loadStats, 60000); // 60 seconds
    const activityInterval = setInterval(loadActivity, 30000); // 30 seconds
    const moderationInterval = setInterval(loadModerationStats, 30000); // 30 seconds

    return () => {
      clearInterval(statsInterval);
      clearInterval(activityInterval);
      clearInterval(moderationInterval);
    };
  }, []);

  useEffect(() => {
    loadRevenue();
  }, [revenuePeriod]);

  const totalUsers = stats.totalUsers;
  const activeStudents = stats.activeStudents;
  const resourcesUploaded = stats.totalResources;
  const totalDownloads = stats.totalDownloads;

  const activityFeedItems = useMemo(() => {
    return activityFeed.map((item) => ({
      id: item.id,
      label: item.title,
      amount: item.amount,
      time: new Date(item.timestamp)
    }));
  }, [activityFeed]);

  const dailyRevenuePoints = useMemo(() => {
    const points = revenueData.data.map((point, idx) => {
      let date;
      if (revenuePeriod === 'week') {
        date = new Date(point.period);
      } else if (revenuePeriod === 'month') {
        const [year, week] = point.period.split('-');
        const firstDayOfYear = new Date(parseInt(year), 0, 1);
        const daysToAdd = (parseInt(week) - 1) * 7;
        date = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      } else if (revenuePeriod === 'year') {
        const [year, month] = point.period.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, 1);
      } else {
        date = new Date(point.period);
      }

      if (isNaN(date.getTime())) {
        date = new Date();
      }

      return {
        date,
        revenue: point.revenue || 0
      };
    });

    const maxRevenue = Math.max(...points.map((p) => p.revenue), 1);
    return points.map((point, idx) => ({
      ...point,
      percentage: (point.revenue / maxRevenue) * 100
    }));
  }, [revenueData.data, revenuePeriod]);

  const maxRevenue = Math.max(...dailyRevenuePoints.map((p) => p.revenue), 1);
  const linePoints = dailyRevenuePoints.map((p, idx) => {
    const step = 100 / (dailyRevenuePoints.length - 1);
    const x = idx * step;
    const y = 100 - p.percentage;
    return `${x},${y}`;
  }).join(' ');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="mt-3 text-lg text-slate-600">Performance insights and operational metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Users',
              value: totalUsers,
              change: stats.changes.totalUsers,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-50 to-blue-100',
              icon: Users,
              iconColor: 'text-blue-600'
            },
            {
              label: 'Active Students',
              value: activeStudents,
              change: stats.changes.activeStudents,
              color: 'from-emerald-500 to-emerald-600',
              bgColor: 'from-emerald-50 to-emerald-100',
              icon: Activity,
              iconColor: 'text-emerald-600'
            },
            {
              label: 'Resources',
              value: resourcesUploaded,
              change: stats.changes.totalResources,
              color: 'from-amber-500 to-amber-600',
              bgColor: 'from-amber-50 to-amber-100',
              icon: BarChart3,
              iconColor: 'text-amber-600'
            },
            {
              label: 'Downloads',
              value: totalDownloads,
              change: stats.changes.totalDownloads,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-50 to-purple-100',
              icon: Download,
              iconColor: 'text-purple-600'
            }
          ].map((item) => {
            const Icon = item.icon;
            const isPositive = item.change.startsWith('+');
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            return (
              <div key={item.label} className={`bg-gradient-to-br ${item.bgColor} rounded-3xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendIcon size={12} />
                    {item.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{item.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{item.value.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 xl:grid-cols-3">
          {/* Rating Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Award size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Rating Tiers</h3>
                <p className="text-sm text-slate-600">Student badge distribution</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { tier: 'Unranked', color: 'from-gray-400 to-gray-500', bgColor: 'from-gray-50 to-gray-100' },
                { tier: 'Bronze', color: 'from-amber-600 to-amber-700', bgColor: 'from-amber-50 to-amber-100' },
                { tier: 'Silver', color: 'from-slate-400 to-slate-500', bgColor: 'from-slate-50 to-slate-100' },
                { tier: 'Gold', color: 'from-yellow-400 to-yellow-500', bgColor: 'from-yellow-50 to-yellow-100' },
                { tier: 'Platinum', color: 'from-indigo-500 to-purple-600', bgColor: 'from-indigo-50 to-purple-100' }
              ].map(({ tier, color, bgColor }) => (
                <div key={tier} className={`bg-gradient-to-br ${bgColor} rounded-2xl p-4 border border-white/50 hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{tier}</span>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${color} shadow-sm`}></div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.ratingStats?.counts?.[tier] ?? 0}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <DollarSign size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Revenue Analytics</h3>
                  <p className="text-sm text-slate-600">Track financial performance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                {[
                  { period: 'week', label: 'Week' },
                  { period: 'month', label: 'Month' },
                  { period: 'year', label: 'Year' }
                ].map(({ period, label }) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      revenuePeriod === period
                        ? 'bg-white text-indigo-600 shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                  </linearGradient>
                </defs>
                <polygon points={`0,100 100,100 ${linePoints} 0,100`} fill="url(#revenueGradient)" />
                <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                {dailyRevenuePoints.map((point, idx) => {
                  const x = (idx * 100) / (dailyRevenuePoints.length - 1);
                  const y = 100 - point.percentage;
                  return (
                    <circle
                      key={point.date.toISOString()}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#10b981"
                      className="drop-shadow-sm"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Monthly', value: revenueData.summary.monthlyRevenue, color: 'from-blue-500 to-blue-600' },
                { label: 'Weekly', value: revenueData.summary.weeklyRevenue, color: 'from-green-500 to-green-600' },
                { label: 'Today', value: revenueData.summary.todayRevenue, color: 'from-purple-500 to-purple-600' }
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 border border-white/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    ${Number(value || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-8 xl:grid-cols-3">
          {/* Moderation Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Moderation</h3>
                <p className="text-sm text-slate-600">Content oversight</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Reported Comments', value: moderationStats.reportedComments, color: 'text-red-600', bgColor: 'from-red-50 to-red-100' },
                { label: 'Pending Inquiries', value: moderationStats.pendingInquiries, color: 'text-blue-600', bgColor: 'from-blue-50 to-blue-100' },
                { label: 'Total Alerts', value: moderationStats.totalAlerts, color: 'text-orange-600', bgColor: 'from-orange-50 to-orange-100' }
              ].map(({ label, value, color, bgColor }) => (
                <div key={label} className={`bg-gradient-to-r ${bgColor} rounded-2xl p-4 border border-white/50 hover:shadow-md transition-all duration-200 cursor-pointer`} onClick={() => window.location.hash = '#/admin/moderation'}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => window.location.hash = '#/admin/resources'}>
              Review Resources
            </button>
          </div>

          {/* Download Trends */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Download Trends</h3>
                  <p className="text-sm text-slate-600">Weekly activity overview</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                <TrendingUp size={14} />
                +18% this week
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3 mb-6">
              {dailyRevenuePoints.map((day, idx) => {
                const height = Math.max(8, Math.round((day.revenue / maxRevenue) * 120));
                return (
                  <div key={day.date.toISOString()} className="flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-slate-500 font-medium">
                      {day.date.toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Activity Feed */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Zap size={20} className="text-white" />
                </div>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Live Activity</h4>
                    <p className="text-sm text-slate-600">Real-time platform updates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4">
                <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" />
                  Top Rated Uploaders
                </h5>
                <div className="space-y-3">
                  {stats.ratingStats?.leaderboard?.slice(0, 3).map((user, idx) => (
                    <div key={user._id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                          'bg-gradient-to-br from-amber-600 to-amber-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.ratingBadge || 'Unranked'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{Number(user.averageRating || 0).toFixed(1)} ⭐</p>
                        <p className="text-xs text-slate-500">{user.uploadCount || 0} uploads</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-slate-500 text-center py-4">No leaderboard data yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activityFeedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={32} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">No recent activity</p>
                  </div>
                ) : (
                  activityFeedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-r from-white to-slate-50 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-102"
                      onClick={() => {
                        if (item.id.startsWith('resource-')) {
                          window.location.hash = '#/admin/resources';
                        } else if (item.id.startsWith('inquiry-')) {
                          window.location.hash = '#/admin/moderation';
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                          {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">{item.amount}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
