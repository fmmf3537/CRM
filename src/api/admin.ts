import type { AdminUser, AdminUserFormData, ConfigItem, ConfigKey } from '../types/admin'

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

export const adminApi = {
  users: {
    list: async (): Promise<{ data: AdminUser[] }> => {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: headers() })
      return handleResponse(res)
    },

    create: async (data: AdminUserFormData): Promise<AdminUser> => {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      })
      return handleResponse(res)
    },

    update: async (id: number, data: Partial<AdminUserFormData>): Promise<AdminUser> => {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(data),
      })
      return handleResponse(res)
    },

    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      await handleResponse<{ success: boolean }>(res)
    },

    resetPassword: async (id: number, password: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ password }),
      })
      await handleResponse<{ success: boolean }>(res)
    },
  },

  config: {
    get: async (key: ConfigKey): Promise<{ key: string; value: ConfigItem[] }> => {
      const res = await fetch(`${API_BASE}/admin/config/${key}`, { headers: headers() })
      return handleResponse(res)
    },

    update: async (key: ConfigKey, value: ConfigItem[]): Promise<{ key: string; value: ConfigItem[] }> => {
      const res = await fetch(`${API_BASE}/admin/config/${key}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ value }),
      })
      return handleResponse(res)
    },
  },
}
