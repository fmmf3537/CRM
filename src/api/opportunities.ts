import type { Opportunity, OpportunityListResponse, OpportunityFormData, PipelineData } from '../types/opportunity'

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

export interface OpportunityQueryParams {
  page?: number
  pageSize?: number
  stage?: string
  status?: string
  customerId?: number
  ownerId?: number
  startDate?: string
  endDate?: string
  keyword?: string
}

export const opportunityApi = {
  list: async (params: OpportunityQueryParams = {}): Promise<OpportunityListResponse> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    })
    const res = await fetch(`${API_BASE}/opportunities?${qs}`, { headers: headers() })
    return handleResponse<OpportunityListResponse>(res)
  },

  get: async (id: number): Promise<Opportunity> => {
    const res = await fetch(`${API_BASE}/opportunities/${id}`, { headers: headers() })
    return handleResponse<Opportunity>(res)
  },

  create: async (data: OpportunityFormData): Promise<Opportunity> => {
    const res = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Opportunity>(res)
  },

  update: async (id: number, data: OpportunityFormData): Promise<Opportunity> => {
    const res = await fetch(`${API_BASE}/opportunities/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Opportunity>(res)
  },

  advance: async (id: number, toStage: string, remarks?: string): Promise<Opportunity> => {
    const res = await fetch(`${API_BASE}/opportunities/${id}/advance`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ toStage, remarks }),
    })
    return handleResponse<Opportunity>(res)
  },

  close: async (id: number, result: 'WON' | 'LOST', remarks?: string): Promise<Opportunity> => {
    const res = await fetch(`${API_BASE}/opportunities/${id}/close`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ result, remarks }),
    })
    return handleResponse<Opportunity>(res)
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/opportunities/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    await handleResponse<{ success: boolean }>(res)
  },

  pipeline: async (params?: { startDate?: string; endDate?: string }): Promise<PipelineData> => {
    const qs = new URLSearchParams()
    if (params?.startDate) qs.append('startDate', params.startDate)
    if (params?.endDate) qs.append('endDate', params.endDate)
    const res = await fetch(`${API_BASE}/opportunities/pipeline?${qs}`, { headers: headers() })
    return handleResponse<PipelineData>(res)
  },
}
