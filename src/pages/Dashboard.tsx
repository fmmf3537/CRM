import { TrendingUp, Users, FolderKanban, DollarSign, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import PerformanceCards from '../components/performance/PerformanceCards';
import TopRanking from '../components/performance/TopRanking';

const API_BASE = 'http://localhost:3006/api';

function getToken() {
  return localStorage.getItem('crm_token') || '';
}

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: '总客户数', value: '--', change: '加载中...', icon: Users, color: 'bg-blue-500' },
    { label: '进行中商机', value: '--', change: '加载中...', icon: FolderKanban, color: 'bg-emerald-500' },
    { label: '本月签约额', value: '--', change: '加载中...', icon: DollarSign, color: 'bg-amber-500' },
    { label: '本月活动数', value: '--', change: '加载中...', icon: Activity, color: 'bg-purple-500' },
  ]);

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    // Fetch summary data in parallel
    Promise.all([
      fetch(`${API_BASE}/customers?pageSize=1`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/opportunities?pageSize=1&status=IN_PROGRESS`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/performance/summary`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/activities?pageSize=5`, { headers }).then((r) => r.json()),
    ])
      .then(([customersRes, oppsRes, perfRes, activitiesRes]) => {
        const totalCustomers = customersRes.pagination?.total || 0;
        const activeOpps = oppsRes.pagination?.total || 0;
        const dealAmount = perfRes?.data?.totalDealAmount || 0;
        const monthActivities = activitiesRes.pagination?.total || 0;

        setStats([
          { label: '总客户数', value: totalCustomers.toLocaleString(), change: '', icon: Users, color: 'bg-blue-500' },
          { label: '进行中商机', value: activeOpps.toLocaleString(), change: '', icon: FolderKanban, color: 'bg-emerald-500' },
          { label: '总签约额', value: `¥${(dealAmount / 10000).toFixed(1)}万`, change: '', icon: DollarSign, color: 'bg-amber-500' },
          { label: '本月活动', value: monthActivities.toString(), change: '', icon: Activity, color: 'bg-purple-500' },
        ]);

        const activities = activitiesRes.data || [];
        setRecentActivities(
          activities.map((a: any) => ({
            action: a.type || '活动',
            detail: a.title || '',
            time: new Date(a.createdAt).toLocaleString('zh-CN'),
          }))
        );
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
        <p className="text-slate-500 mt-1">欢迎回来，查看今日业务概览</p>
      </div>

      {/* Performance Dashboard */}
      <PerformanceCards />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} text-white p-2.5 rounded-lg`}>
                  <Icon size={20} />
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">{stat.change}</span>
                  <span className="text-sm text-slate-400">较上月</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopRanking limit={5} />

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">最近动态</h3>
          </div>
          <div className="p-4 space-y-1">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 p-3 text-center">暂无活动记录</p>
            ) : (
              recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500 truncate">{activity.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
