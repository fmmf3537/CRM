import { TrendingUp, Users, FolderKanban, DollarSign, Activity } from 'lucide-react';
import PerformanceCards from '../components/performance/PerformanceCards';
import TopRanking from '../components/performance/TopRanking';

const stats = [
  { label: '总客户数', value: '1,284', change: '+12%', icon: Users, color: 'bg-blue-500' },
  { label: '进行中项目', value: '42', change: '+5%', icon: FolderKanban, color: 'bg-emerald-500' },
  { label: '本月收入', value: '¥2.4M', change: '+18%', icon: DollarSign, color: 'bg-amber-500' },
  { label: '设备在线率', value: '98.2%', change: '+0.5%', icon: Activity, color: 'bg-purple-500' },
];

const recentActivities = [
  { action: '新客户签约', detail: '华远航空科技有限公司', time: '10分钟前' },
  { action: '项目交付', detail: '农业植保无人机编队系统', time: '1小时前' },
  { action: '设备报修', detail: 'ZT-800 巡检无人机 #0321', time: '2小时前' },
  { action: '合同续签', detail: '城市安防监控项目', time: '3小时前' },
  { action: '新订单', detail: '物流配送无人机 x20', time: '5小时前' },
];

export default function Dashboard() {
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
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">{stat.change}</span>
                <span className="text-sm text-slate-400">较上月</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopRanking limit={5} />

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">业务趋势</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end justify-between gap-3">
              {[45, 62, 38, 75, 55, 88, 72, 95, 68, 82, 58, 90].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary-100 rounded-t-md relative group"
                    style={{ height: `${h}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t-md transition-all group-hover:bg-primary-600"
                      style={{ height: '100%' }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400">{i + 1}月</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">最近动态</h3>
          </div>
          <div className="p-4 space-y-1">
            {recentActivities.map((activity, i) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
