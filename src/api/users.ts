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

export const userApi = {
  list: async (): Promise<{ data: { id: number; username: string; name: string; role: string }[] }> => {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: headers() })
    return handleResponse(res)
  },
}
