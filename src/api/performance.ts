import type {
  Target,
  TargetFormData,
  Achievement,
  AchievementFormData,
  PerformanceSummary,
  RankingResponse,
} from '../types/performance'

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

export const targetApi = {
  list: async (params?: { ownerId?: number; year?: number; type?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.append(k, String(v))
      })
    }
    const res = await fetch(`${API_BASE}/targets?${qs}`, { headers: headers() })
    return handleResponse<{ data: Target[]; pagination: any }>(res)
  },

  create: async (data: TargetFormData): Promise<Target> => {
    const res = await fetch(`${API_BASE}/targets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Target>(res)
  },

  update: async (id: number, data: Partial<TargetFormData>): Promise<Target> => {
    const res = await fetch(`${API_BASE}/targets/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Target>(res)
  },
}

export const achievementApi = {
  list: async (params?: { page?: number; pageSize?: number; customerId?: number; createdById?: number; startDate?: string; endDate?: string; keyword?: string }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.append(k, String(v))
      })
    }
    const res = await fetch(`${API_BASE}/achievements?${qs}`, { headers: headers() })
    return handleResponse<{ data: Achievement[]; pagination: any }>(res)
  },

  get: async (id: number): Promise<Achievement> => {
    const res = await fetch(`${API_BASE}/achievements/${id}`, { headers: headers() })
    return handleResponse<Achievement>(res)
  },

  create: async (data: AchievementFormData): Promise<Achievement> => {
    const res = await fetch(`${API_BASE}/achievements`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Achievement>(res)
  },

  update: async (id: number, data: AchievementFormData): Promise<Achievement> => {
    const res = await fetch(`${API_BASE}/achievements/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return handleResponse<Achievement>(res)
  },
}

export const performanceApi = {
  summary: async (params?: { period?: string; year?: number; quarter?: number; month?: number; ownerId?: number }): Promise<PerformanceSummary> => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.append(k, String(v))
      })
    }
    const res = await fetch(`${API_BASE}/performance/summary?${qs}`, { headers: headers() })
    return handleResponse<PerformanceSummary>(res)
  },

  ranking: async (params?: { period?: string; year?: number; quarter?: number; month?: number; sortBy?: string }): Promise<RankingResponse> => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.append(k, String(v))
      })
    }
    const res = await fetch(`${API_BASE}/performance/ranking?${qs}`, { headers: headers() })
    return handleResponse<RankingResponse>(res)
  },
}
