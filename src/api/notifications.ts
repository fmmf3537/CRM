import type { Notification, NotificationListResponse } from '../types/notification'

const API_BASE = 'http://localhost:3006/api'

function getToken() {
  return localStorage.getItem('crm_token') || ''
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const notificationApi = {
  list: async (params?: { page?: number; pageSize?: number; read?: boolean }): Promise<NotificationListResponse> => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== '') qs.append(k, String(v))
      })
    }
    const res = await fetch(`${API_BASE}/notifications?${qs}`, { headers: headers() })
    return handleResponse<NotificationListResponse>(res)
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: headers() })
    return handleResponse<{ count: number }>(res)
  },

  markRead: async (id: number): Promise<Notification> => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: headers(),
    })
    return handleResponse<Notification>(res)
  },

  markAllRead: async (): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: headers(),
    })
    return handleResponse<{ success: boolean }>(res)
  },
}
