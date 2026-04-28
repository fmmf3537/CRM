import { createContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  id: number
  username: string
  name: string
  displayName?: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE = 'http://localhost:3001/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('crm_token')
    if (storedToken) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token invalid')
          return res.json()
        })
        .then((data) => {
          setUser(data)
          setToken(storedToken)
        })
        .catch(() => {
          localStorage.removeItem('crm_token')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      return false
    }

    const data = await res.json()
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('crm_token', data.token)
    return true
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('crm_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
