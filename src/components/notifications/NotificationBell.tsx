import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { notificationApi } from '../../api/notifications'
import type { Notification } from '../../types/notification'
import { notificationTypeLabels } from '../../types/notification'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationApi.unreadCount()
      setUnreadCount(res.count)
    } catch {}
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationApi.list({ pageSize: 10 })
      setNotifications(res.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkRead(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  async function handleMarkAllRead(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch {}
  }

  function handleClickNotification(n: Notification) {
    if (!n.readAt) {
      notificationApi.markRead(n.id).then(() => {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }).catch(() => {})
    }
    setOpen(false)
    if (n.relatedType === 'CUSTOMER' && n.relatedId) {
      navigate(`/customers/${n.relatedId}`)
    } else if (n.relatedType === 'LEAD' && n.relatedId) {
      navigate(`/leads/${n.relatedId}`)
    } else if (n.relatedType === 'OPPORTUNITY' && n.relatedId) {
      navigate(`/opportunities/${n.relatedId}`)
    } else if (n.relatedType === 'ACTIVITY' && n.relatedId) {
      navigate(`/activities`)
    } else {
      navigate('/notifications')
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">通知中心</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCheck size={12} />
                  全部已读
                </button>
              )}
              <button
                onClick={() => { setOpen(false); navigate('/notifications') }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                查看全部
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-400">加载中...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">暂无通知</div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !n.readAt ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.readAt ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                    {n.content && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">
                        {notificationTypeLabels[n.type]} · {new Date(n.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!n.readAt && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          <Check size={10} />
                          已读
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
