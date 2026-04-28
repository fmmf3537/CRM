import type { Activity, ActivityListResponse, ActivityFormData, WorkloadStats } from '../types/activity'

const API_BASE = 'http://localhost:3001/api'

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

export interface ActivityQueryParams {
  page?: number
  pageSize?: number
  customerId?: number
  leadId?: number
  type?: string
  startDate?: string
  endDate?: string
  result?: string
  keyword?: string
}

export const activityApi = {
  list: async (params: ActivityQueryParams = {}): Promise<ActivityListResponse> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    })
    const res = await fetch(`${API_BASE}/activities?${qs}`, { headers: headers() })
    return handleResponse<ActivityListResponse>(res)
  },

  get: async (id: number): Promise<Activity> => {
    const res = await fetch(`${API_BASE}/activities/${id}`, { headers: headers() })
    return handleResponse<Activity>(res)
  },

  create: async (data: ActivityFormData): Promise<Activity> => {
    const res = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Activity>(res)
  },

  update: async (id: number, data: ActivityFormData): Promise<Activity> => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Activity>(res)
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    await handleResponse<{ success: boolean }>(res)
  },

  byCustomer: async (customerId: number): Promise<Activity[]> => {
    const res = await fetch(`${API_BASE}/activities/by-customer/${customerId}`, { headers: headers() })
    return handleResponse<Activity[]>(res)
  },

  byLead: async (leadId: number): Promise<Activity[]> => {
    const res = await fetch(`${API_BASE}/activities/by-lead/${leadId}`, { headers: headers() })
    return handleResponse<Activity[]>(res)
  },

  calendar: async (year?: number, month?: number): Promise<Record<string, Activity[]>> => {
    const qs = new URLSearchParams()
    if (year) qs.append('year', String(year))
    if (month) qs.append('month', String(month))
    const res = await fetch(`${API_BASE}/activities/calendar?${qs}`, { headers: headers() })
    return handleResponse<Record<string, Activity[]>>(res)
  },

  workload: async (userId?: number, period?: string): Promise<WorkloadStats> => {
    const qs = new URLSearchParams()
    if (userId) qs.append('userId', String(userId))
    if (period) qs.append('period', period)
    const res = await fetch(`${API_BASE}/activities/workload?${qs}`, { headers: headers() })
    return handleResponse<WorkloadStats>(res)
  },
}
