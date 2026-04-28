import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, UserPlus, Target, Bell, ChevronRight } from 'lucide-react'
import { notificationApi } from '../../api/notifications'
import { performanceApi } from '../../api/performance'
import { activityApi } from '../../api/activities'
import type { Notification } from '../../types/notification'
import { notificationTypeLabels } from '../../types/notification'

export default function MobileHome() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [todoCount, setTodoCount] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    notificationApi.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {})
    performanceApi.summary({ period: 'month' }).then((r) => {
      setCompletionRate(r.completionRate)
    }).catch(() => {})
    activityApi.list({ pageSize: 5, startDate: new Date().toISOString().slice(0, 10) }).then((r) => {
      setTodoCount(r.data.length)
    }).catch(() => {})
    notificationApi.list({ pageSize: 5 }).then((r) => {
      setNotifications(r.data)
    }).catch(() => {})
  }, [])

  const shortcuts = [
    { label: '记录活动', icon: ClipboardList, color: 'bg-blue-500', onClick: () => navigate('/mobile/activities') },
    { label: '新增客户', icon: UserPlus, color: 'bg-emerald-500', onClick: () => navigate('/mobile/customers') },
    { label: '新增线索', icon: Target, color: 'bg-amber-500', onClick: () => navigate('/leads') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">辰航卓越</h1>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 flex items-center justify-center"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur">
            <p className="text-xs text-blue-100">今日待办</p>
            <p className="text-2xl font-bold">{todoCount}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur">
            <p className="text-xs text-blue-100">本月达成</p>
            <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-3 gap-3">
          {shortcuts.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                onClick={s.onClick}
                className="flex flex-col items-center gap-2 py-2 min-h-[44px]"
              >
                <div className={`w-11 h-11 rounded-full ${s.color} text-white flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">今日提醒</h2>
          <button onClick={() => navigate('/notifications')} className="text-xs text-blue-600 flex items-center gap-0.5">
            全部 <ChevronRight size={12} />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
          {notifications.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">暂无提醒</div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => navigate('/notifications')}
              className={`px-4 py-3 flex items-start gap-3 ${!n.readAt ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.readAt ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{n.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {notificationTypeLabels[n.type]} · {new Date(n.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer for TabBar */}
      <div className="h-4" />
    </div>
  )
}
