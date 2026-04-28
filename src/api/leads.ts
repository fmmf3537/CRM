import type { Lead, LeadListResponse, LeadFormData, LeadStats } from '../types/lead'

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

export interface LeadQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  source?: string
  status?: string
  region?: string
  assignStatus?: string
  assigneeId?: number
}

export const leadApi = {
  list: async (params: LeadQueryParams = {}): Promise<LeadListResponse> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    })
    const res = await fetch(`${API_BASE}/leads?${qs}`, { headers: headers() })
    return handleResponse<LeadListResponse>(res)
  },

  get: async (id: number): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { headers: headers() })
    return handleResponse<Lead>(res)
  },

  create: async (data: LeadFormData): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Lead>(res)
  },

  update: async (id: number, data: LeadFormData): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Lead>(res)
  },

  assign: async (id: number, assigneeId: number): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads/${id}/assign`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ assigneeId }),
    })
    return handleResponse<Lead>(res)
  },

  claim: async (id: number): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads/${id}/claim`, {
      method: 'POST',
      headers: headers(),
    })
    return handleResponse<Lead>(res)
  },

  convert: async (id: number): Promise<{ success: boolean; customerId: number }> => {
    const res = await fetch(`${API_BASE}/leads/${id}/convert`, {
      method: 'POST',
      headers: headers(),
    })
    return handleResponse<{ success: boolean; customerId: number }>(res)
  },

  abandon: async (id: number, reason: string): Promise<Lead> => {
    const res = await fetch(`${API_BASE}/leads/${id}/abandon`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ reason }),
    })
    return handleResponse<Lead>(res)
  },

  stats: async (): Promise<LeadStats> => {
    const res = await fetch(`${API_BASE}/leads/stats`, { headers: headers() })
    return handleResponse<LeadStats>(res)
  },

  importExcel: async (buffer: ArrayBuffer): Promise<{ success: boolean; count: number }> => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const res = await fetch(`${API_BASE}/leads/batch-import`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ buffer: base64 }),
    })
    return handleResponse<{ success: boolean; count: number }>(res)
  },
}
