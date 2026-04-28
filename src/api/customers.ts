import type {
  Customer,
  CustomerListResponse,
  CustomerFormData,
} from '../types/customer'

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

export interface CustomerQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  industry?: string
  region?: string
  grade?: string
  status?: string
  ownerId?: number
}

export const customerApi = {
  list: async (params: CustomerQueryParams = {}): Promise<CustomerListResponse> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    })
    const res = await fetch(`${API_BASE}/customers?${qs}`, { headers: headers() })
    return handleResponse<CustomerListResponse>(res)
  },

  get: async (id: number): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: headers() })
    return handleResponse<Customer>(res)
  },

  create: async (data: CustomerFormData): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Customer>(res)
  },

  update: async (id: number, data: CustomerFormData): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Customer>(res)
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    await handleResponse<{ success: boolean }>(res)
  },

  importExcel: async (buffer: ArrayBuffer): Promise<{ success: boolean; count: number }> => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const res = await fetch(`${API_BASE}/customers/import`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ buffer: base64 }),
    })
    return handleResponse<{ success: boolean; count: number }>(res)
  },

  exportExcel: async (params: CustomerQueryParams = {}): Promise<Blob> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    })
    const res = await fetch(`${API_BASE}/customers/export?${qs}`, { headers: headers() })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '导出失败' }))
      throw new Error(err.error)
    }
    return res.blob()
  },
}
