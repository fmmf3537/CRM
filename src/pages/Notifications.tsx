import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '../api/notifications'
import type { Notification } from '../types/notification'
import { notificationTypeLabels } from '../types/notification'
import { Check, CheckCheck, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page: pagination.page, pageSize: pagination.pageSize }
      if (filter === 'unread') params.read = false
      if (filter === 'read') params.read = true
      const res = await notificationApi.list(params)
      setNotifications(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, filter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function handleMarkRead(id: number) {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      )
    } catch {}
  }

  function handleClick(n: Notification) {
    if (!n.readAt) {
      notificationApi.markRead(n.id).catch(() => {})
    }
    if (n.relatedType === 'CUSTOMER' && n.relatedId) {
      navigate(`/customers/${n.relatedId}`)
    } else if (n.relatedType === 'LEAD' && n.relatedId) {
      navigate(`/leads/${n.relatedId}`)
    } else if (n.relatedType === 'OPPORTUNITY' && n.relatedId) {
      navigate(`/opportunities/${n.relatedId}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">通知中心</h1>
        <button
          onClick={handleMarkAllRead}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <CheckCheck size={16} />
          全部已读
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'unread', label: '未读' },
          { key: 'read', label: '已读' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key as any); setPagination((p) => ({ ...p, page: 1 })) }}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        {loading && <div className="py-8 text-center text-sm text-gray-400">加载中...</div>}
        {!loading && notifications.length === 0 && (
          <div className="py-12 text-center">
            <Bell size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">暂无通知</p>
          </div>
        )}
        {!loading && notifications.length > 0 && (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-5 py-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !n.readAt ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => handleClick(n)}
              >
                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${!n.readAt ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                      {notificationTypeLabels[n.type]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1">{n.title}</p>
                  {n.content && <p className="text-sm text-gray-500 mt-0.5">{n.content}</p>}
                </div>
                {!n.readAt && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id) }}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 mt-1"
                  >
                    <Check size={12} />
                    标记已读
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
