import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, Settings, ChevronRight, Target,
  CalendarDays, TrendingUp, BarChart3, Crosshair, ClipboardList, Medal,
  Bell, Shield, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const menuItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/leads', label: '线索管理', icon: Target },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp },
  { path: '/pipeline', label: '漏斗分析', icon: BarChart3 },
  { path: '/targets', label: '目标设置', icon: Crosshair },
  { path: '/achievements', label: '业绩录入', icon: ClipboardList },
  { path: '/performance', label: '业绩看板', icon: Medal },
  { path: '/activities', label: '活动管理', icon: CalendarDays },
  { path: '/projects', label: '项目中心', icon: FolderKanban },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">导航菜单</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                  : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}

        <Link
          to="/notifications"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            location.pathname === '/notifications'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
              : 'hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <Bell size={18} />
          <span>通知中心</span>
          {location.pathname === '/notifications' && <ChevronRight size={14} className="ml-auto opacity-60" />}
        </Link>

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">系统管理</p>
            <Link
              to="/admin/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === '/admin/users'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                  : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Shield size={18} />
              <span>用户管理</span>
              {location.pathname === '/admin/users' && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
            <Link
              to="/admin/config"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === '/admin/config'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                  : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span>基础配置</span>
              {location.pathname === '/admin/config' && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            location.pathname === '/settings'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
              : 'hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <Settings size={18} />
          <span>系统设置</span>
        </Link>
      </div>
    </aside>
  );
}
