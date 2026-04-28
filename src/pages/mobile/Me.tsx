import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, ChevronRight, Target, TrendingUp, CalendarDays, Award, Settings, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { performanceApi } from '../../api/performance'
import { activityApi } from '../../api/activities'

export default function MobileMe() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [completionRate, setCompletionRate] = useState(0)
  const [workload, setWorkload] = useState({ totalActivities: 0, totalScore: 0 })
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    performanceApi.summary({ period: 'month' }).then((r) => {
      setCompletionRate(r.completionRate)
    }).catch(() => {})

    activityApi.workload(undefined, 'week').then((r) => {
      setWorkload({ totalActivities: r.totalActivities, totalScore: r.totalScore })
    }).catch(() => {})

    performanceApi.ranking({ period: 'month', sortBy: 'amount' }).then((r) => {
      const myRank = r.data.find((item) => item.userId === user?.id)
      if (myRank) setRank(myRank.rank)
    }).catch(() => {})
  }, [user?.id])

  const menuItems = [
    { icon: Bell, label: '通知中心', onClick: () => navigate('/notifications') },
    { icon: Settings, label: '系统设置', onClick: () => navigate('/settings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-blue-600 text-white px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.name || '用户'}</h2>
            <p className="text-sm text-blue-100">{user?.username} · {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{completionRate.toFixed(0)}%</p>
            <p className="text-[10px] text-gray-500 mt-0.5">本月达成率</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-xl font-bold text-emerald-600">{workload.totalActivities}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">本周活动</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-xl font-bold text-amber-600">{rank ? `第${rank}名` : '-'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">本月排行</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
          <button
            onClick={() => navigate('/performance')}
            className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="flex-1 text-sm text-gray-800 text-left">业绩看板</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button
            onClick={() => navigate('/workload')}
            className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <span className="flex-1 text-sm text-gray-800 text-left">工作量统计</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button
            onClick={() => navigate('/targets')}
            className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target size={18} />
            </div>
            <span className="flex-1 text-sm text-gray-800 text-left">目标设置</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button
            onClick={() => navigate('/pipeline')}
            className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={18} />
            </div>
            <span className="flex-1 text-sm text-gray-800 text-left">漏斗分析</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Settings & Logout */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px]"
              >
                <Icon size={18} className="text-gray-500" />
                <span className="flex-1 text-sm text-gray-800 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            )
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 min-h-[44px]"
          >
            <LogOut size={18} />
            <span className="flex-1 text-sm text-left">退出登录</span>
          </button>
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}
